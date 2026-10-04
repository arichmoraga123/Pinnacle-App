import "server-only";

import { eq } from "drizzle-orm";
import { Resend } from "resend";

import { db } from "@/db";
import { employers, jobListings, workers } from "@/db/schema";
import { whatsappUrl } from "@/lib/format";

/**
 * Email notifications via Resend.
 *
 *   RESEND_API_KEY      – from resend.com (no key: emails are logged instead)
 *   EMAIL_FROM          – e.g. "Pinnacle Recruitment <jobs@pinnaclerecruit.sg>"
 *   STAFF_NOTIFY_EMAIL  – where new-application alerts go (comma-separated)
 *   APP_URL             – public site URL used in links
 *
 * Notifications never throw: a failed email must not fail an application.
 */

const appUrl = () =>
  (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(
  title: string,
  rows: string[],
  cta?: { label: string; href: string },
) {
  return `<!doctype html><html><body style="margin:0;background:#F1F3EF;font-family:Arial,sans-serif;color:#14213D">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:8px">
<tr><td style="background:#14213D;color:#E3A039;padding:16px 24px;font-weight:bold;border-radius:8px 8px 0 0">PINNACLE RECRUITMENT</td></tr>
<tr><td style="padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h1>
${rows.map((r) => `<p style="margin:0 0 12px;line-height:1.5;font-size:15px">${r}</p>`).join("")}
${cta ? `<p style="margin:24px 0 0"><a href="${cta.href}" style="background:#1F6F6B;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">${escapeHtml(cta.label)}</a></p>` : ""}
</td></tr></table>
<p style="font-size:12px;color:#232B36;opacity:.6">Pinnacle Recruitment Pte. Ltd. · Singapore</p>
</td></tr></table></body></html>`;
}

async function send(to: string | string[], subject: string, html: string) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(
      `[notify] (no RESEND_API_KEY) "${subject}" → ${recipients.join(", ")}`,
    );
    return;
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from:
        process.env.EMAIL_FROM ??
        "Pinnacle Recruitment <onboarding@resend.dev>",
      to: recipients,
      subject,
      html,
    });
    if (error) console.error("[notify] Resend error:", error);
  } catch (error) {
    console.error("[notify] Failed to send email:", error);
  }
}

function staffEmails() {
  return (process.env.STAFF_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

async function loadPair(workerId: string, jobListingId: string) {
  const [worker, job] = await Promise.all([
    db.query.workers.findFirst({ where: eq(workers.id, workerId) }),
    db
      .select({ job: jobListings, employer: employers })
      .from(jobListings)
      .innerJoin(employers, eq(jobListings.employerId, employers.id))
      .where(eq(jobListings.id, jobListingId))
      .then((rows) => rows[0]),
  ]);
  return worker && job ? { worker, ...job } : null;
}

async function guard(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error) {
    console.error(`[notify] ${label} failed:`, error);
  }
}

/** Staff alert: a worker applied for a job. */
export function notifyNewApplication(input: {
  workerId: string;
  jobListingId: string;
  message: string | null;
}) {
  return guard("new application", async () => {
    const pair = await loadPair(input.workerId, input.jobListingId);
    if (!pair) return;
    const { worker, job, employer } = pair;
    const wa = whatsappUrl(worker.phone);
    const code = job.jobCode ? ` (${job.jobCode})` : "";

    await send(
      staffEmails(),
      `New application: ${worker.fullName} → ${job.roleTitle}${code}`,
      layout(
        "New application",
        [
          `<strong>${escapeHtml(worker.fullName)}</strong> applied for <strong>${escapeHtml(job.roleTitle)}${escapeHtml(code)}</strong> at ${escapeHtml(employer.companyName)}.`,
          `${escapeHtml(worker.roleTitle)} · ${worker.yearsExperience} yrs · ${escapeHtml(worker.originCountry)} · ${escapeHtml(worker.passTrack)}`,
          `Email: ${escapeHtml(worker.email ?? "—")} · Phone: ${escapeHtml(worker.phone ?? "—")}${wa ? ` · <a href="${wa}">WhatsApp</a>` : ""}`,
          `Resume: ${worker.resumeKey ? "attached" : "not provided"} · Photo: ${worker.photoKey ? "attached" : "not provided"}`,
          ...(input.message ? [`<em>“${escapeHtml(input.message)}”</em>`] : []),
        ],
        {
          label: "Open pipeline",
          href: `${appUrl()}/admin/pipeline?stage=Requested`,
        },
      ),
    );
  });
}

/** Staff alert: an employer asked to be introduced to a worker. */
export function notifyIntroductionRequested(input: {
  workerId: string;
  jobListingId: string;
  message: string | null;
}) {
  return guard("introduction request", async () => {
    const pair = await loadPair(input.workerId, input.jobListingId);
    if (!pair) return;
    const { worker, job, employer } = pair;
    await send(
      staffEmails(),
      `Introduction request: ${employer.companyName} → ${worker.fullName}`,
      layout(
        "Employer requested an introduction",
        [
          `<strong>${escapeHtml(employer.companyName)}</strong> wants to meet <strong>${escapeHtml(worker.fullName)}</strong> (${escapeHtml(worker.roleTitle)}) for <strong>${escapeHtml(job.roleTitle)}</strong>.`,
          ...(input.message ? [`<em>“${escapeHtml(input.message)}”</em>`] : []),
        ],
        {
          label: "Open pipeline",
          href: `${appUrl()}/admin/pipeline?stage=Requested`,
        },
      ),
    );
  });
}

/** Staff alert: an employer posted a job themselves. */
export function notifyJobPosted(jobListingId: string) {
  return guard("job posted", async () => {
    const [row] = await db
      .select({ job: jobListings, employer: employers })
      .from(jobListings)
      .innerJoin(employers, eq(jobListings.employerId, employers.id))
      .where(eq(jobListings.id, jobListingId));
    if (!row) return;
    await send(
      staffEmails(),
      `New job posted: ${row.job.roleTitle} at ${row.employer.companyName}`,
      layout(
        "New job posted by an employer",
        [
          `<strong>${escapeHtml(row.employer.companyName)}</strong> posted <strong>${escapeHtml(row.job.roleTitle)}</strong> (${row.job.headcount} openings). Add a job code and poster if needed.`,
        ],
        {
          label: "Review job",
          href: `${appUrl()}/admin/jobs/${row.job.id}/edit`,
        },
      ),
    );
  });
}

const WORKER_STAGE_COPY: Partial<Record<string, string>> = {
  "Pinnacle Review": "Pinnacle is now reviewing your application.",
  Introduced:
    "Good news — Pinnacle has introduced you to the employer. We'll contact you about next steps.",
  Interview:
    "You've been selected for an interview. Pinnacle will contact you with the details. Please stay reachable by phone and WhatsApp.",
  Offer: "Congratulations — an offer is being prepared for you.",
  Placed: "Congratulations — you've been placed in this role!",
  Declined:
    "Unfortunately this application did not progress. Your profile stays active and you can apply for other jobs any time.",
};

/** Worker (and, on introduction, employer) update when a stage changes. */
export function notifyStageChange(input: {
  workerId: string;
  jobListingId: string;
  from: string;
  to: string;
}) {
  return guard("stage change", async () => {
    if (input.from === input.to) return;
    const pair = await loadPair(input.workerId, input.jobListingId);
    if (!pair) return;
    const { worker, job, employer } = pair;

    const copy = WORKER_STAGE_COPY[input.to];
    if (copy && worker.email) {
      await send(
        worker.email,
        `Update on your application: ${job.roleTitle}`,
        layout(
          `Your application for ${job.roleTitle}`,
          [
            `Hi ${escapeHtml(worker.fullName.split(" ")[0])},`,
            escapeHtml(copy),
          ],
          {
            label: "View my applications",
            href: `${appUrl()}/worker/applications`,
          },
        ),
      );
    }

    if (input.to === "Introduced" && employer.clerkUserId) {
      await send(
        employer.contactEmail,
        `Candidate introduced: ${worker.fullName} for ${job.roleTitle}`,
        layout(
          "Pinnacle has introduced a candidate",
          [
            `<strong>${escapeHtml(worker.fullName)}</strong> (${escapeHtml(worker.roleTitle)}, ${worker.yearsExperience} yrs) has been introduced for <strong>${escapeHtml(job.roleTitle)}</strong>. Their contact details and resume are now visible in your dashboard.`,
          ],
          {
            label: "View candidate",
            href: `${appUrl()}/employer/jobs/${job.id}`,
          },
        ),
      );
    }
  });
}
