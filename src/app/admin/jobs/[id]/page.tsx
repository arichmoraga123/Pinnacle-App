import { and, desc, eq, inArray, ne } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { addToPipeline, setAdminJobStatus } from "@/app/admin/actions";
import { Container } from "@/components/container";
import { SubmitButton } from "@/components/form";
import { JobStatusButtons } from "@/components/job-status-buttons";
import {
  Badge,
  ButtonLink,
  Card,
  DefinitionList,
  EmptyState,
  PageHeader,
  StageBadge,
  StatusBadge,
} from "@/components/ui";
import { db } from "@/db";
import { isUuid } from "@/db/queries";
import { employers, introductions, jobListings, workers } from "@/db/schema";
import {
  formatSalary,
  posterUrl,
  whatsappUrl,
  workerFileUrl,
} from "@/lib/format";
import { matchLabel, scoreMatch } from "@/lib/matching";
import { PENDING_ROLE_TITLE } from "@/lib/profile";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Job" };

export default async function AdminJobPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  if (!isUuid(params.id)) notFound();

  const [row] = await db
    .select({ job: jobListings, companyName: employers.companyName })
    .from(jobListings)
    .innerJoin(employers, eq(jobListings.employerId, employers.id))
    .where(eq(jobListings.id, params.id));
  if (!row) notFound();
  const { job, companyName } = row;

  const [pipeline, pool] = await Promise.all([
    db
      .select({ intro: introductions, worker: workers })
      .from(introductions)
      .innerJoin(workers, eq(introductions.workerId, workers.id))
      .where(eq(introductions.jobListingId, job.id))
      .orderBy(desc(introductions.updatedAt)),
    db
      .select()
      .from(workers)
      .where(
        and(
          inArray(workers.status, ["Available", "Introduction Requested"]),
          ne(workers.roleTitle, PENDING_ROLE_TITLE),
        ),
      ),
  ]);

  const inPipeline = new Set(pipeline.map((p) => p.worker.id));
  const suggestions = pool
    .filter((w) => !inPipeline.has(w.id))
    .map((worker) => ({ worker, match: scoreMatch(worker, job) }))
    .filter(({ match }) => match.eligible && match.score >= 30)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 15);

  const waText = `Hi, this is Pinnacle Recruitment about the ${job.roleTitle}${job.jobCode ? ` (${job.jobCode})` : ""} role.`;

  return (
    <main>
      <Container className="grid max-w-6xl gap-6 py-10">
        <Link href="/admin/jobs" className="text-sm text-teal hover:underline">
          ← All jobs
        </Link>
        <PageHeader
          eyebrow={`${companyName}${job.jobCode ? ` · ${job.jobCode}` : ""}`}
          title={job.roleTitle}
          actions={
            <>
              <JobStatusButtons
                action={setAdminJobStatus}
                jobId={job.id}
                status={job.status}
              />
              <ButtonLink
                href={`/admin/jobs/${job.id}/edit`}
                variant="secondary"
              >
                Edit
              </ButtonLink>
            </>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {job.posterKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl(job.posterKey)}
              alt="Poster"
              className="w-full rounded-lg border border-ink/10"
            />
          ) : (
            <div className="grid aspect-[4/5] place-items-center rounded-lg border border-dashed border-ink/20 text-sm text-graphite/60">
              <Link
                href={`/admin/jobs/${job.id}/edit`}
                className="hover:text-teal"
              >
                + Add poster
              </Link>
            </div>
          )}
          <Card className="h-fit">
            <DefinitionList
              items={[
                ["Status", <StatusBadge key="s" value={job.status} />],
                ["Salary", formatSalary(job)],
                ["Sector", job.sector],
                ["Work pass", job.passTrackRequired],
                ["Openings", job.headcount],
                ["Location", job.location],
              ]}
            />
            <p className="mt-4 border-t border-ink/10 pt-3 text-sm">
              Public link:{" "}
              <Link
                href={job.jobCode ? `/j/${job.jobCode}` : `/jobs/${job.id}`}
                className="font-mono text-teal hover:underline"
              >
                {job.jobCode ? `/j/${job.jobCode}` : `/jobs/${job.id}`}
              </Link>
            </p>
          </Card>
        </div>

        <section className="grid gap-3">
          <h2 className="font-display text-xl font-bold">
            In the pipeline ({pipeline.length})
          </h2>
          {pipeline.length === 0 ? (
            <p className="text-sm text-graphite">No candidates yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <tbody className="divide-y divide-ink/5">
                  {pipeline.map(({ intro, worker }) => (
                    <tr key={intro.id}>
                      <td className="px-4 py-3 font-semibold">
                        {worker.fullName}
                      </td>
                      <td className="px-4 py-3 text-graphite">
                        {worker.roleTitle} · {worker.yearsExperience} yrs
                      </td>
                      <td className="px-4 py-3">
                        <StageBadge stage={intro.stage} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link
            href="/admin/pipeline"
            className="text-sm text-teal hover:underline"
          >
            Manage stages in the pipeline →
          </Link>
        </section>

        <section className="grid gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">
              Suggested candidates
            </h2>
            <p className="text-sm text-graphite">
              Available workers ranked by trade, sector, work pass and
              experience. Putting someone forward adds them to the pipeline at
              “Pinnacle Review”.
            </p>
          </div>
          {suggestions.length === 0 ? (
            <EmptyState title="No strong matches in the talent pool yet" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {suggestions.map(({ worker, match }) => {
                const wa = whatsappUrl(worker.phone, waText);
                const label = matchLabel(match.score);
                return (
                  <Card key={worker.id} className="grid gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{worker.fullName}</p>
                        <p className="text-sm text-graphite">
                          {worker.roleTitle} · {worker.originCountry}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-bold text-teal">
                          {match.score}
                        </p>
                        {label ? <Badge tone="teal">{label}</Badge> : null}
                      </div>
                    </div>
                    <ul className="grid gap-0.5 text-xs text-graphite">
                      {match.reasons.map((r) => (
                        <li key={r}>· {r}</li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <form action={addToPipeline}>
                        <input
                          type="hidden"
                          name="workerId"
                          value={worker.id}
                        />
                        <input
                          type="hidden"
                          name="jobListingId"
                          value={job.id}
                        />
                        <SubmitButton
                          variant="accent"
                          pendingLabel="Adding…"
                          className="px-3 py-1.5"
                        >
                          Put forward
                        </SubmitButton>
                      </form>
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal hover:underline"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                      {worker.resumeKey ? (
                        <a
                          href={workerFileUrl(worker.id, "resume")}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal hover:underline"
                        >
                          Resume
                        </a>
                      ) : null}
                      {worker.photoKey ? (
                        <a
                          href={workerFileUrl(worker.id, "photo")}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal hover:underline"
                        >
                          Photo
                        </a>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
