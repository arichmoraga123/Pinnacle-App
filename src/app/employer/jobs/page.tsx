import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { setEmployerJobStatus } from "@/app/employer/actions";
import { Container } from "@/components/container";
import { JobStatusButtons } from "@/components/job-status-buttons";
import {
  ButtonLink,
  EmptyState,
  Notice,
  PageHeader,
  Stat,
  StatusBadge,
} from "@/components/ui";
import { db } from "@/db";
import { applicantCounts } from "@/db/queries";
import { jobListings } from "@/db/schema";
import { formatDate, formatSalary } from "@/lib/format";
import { isEmployerProfileComplete } from "@/lib/profile";
import { requireEmployer } from "@/lib/session";

export const metadata: Metadata = { title: "My jobs" };

export default async function EmployerJobsPage() {
  const employer = await requireEmployer();
  const jobs = await db
    .select()
    .from(jobListings)
    .where(eq(jobListings.employerId, employer.id))
    .orderBy(desc(jobListings.createdAt));
  const counts = await applicantCounts(jobs.map((j) => j.id));

  const active = jobs.filter((j) => j.status === "Active").length;
  const inProgress = Array.from(counts.values()).reduce(
    (n, c) => n + c.open,
    0,
  );
  const complete = isEmployerProfileComplete(employer);

  return (
    <main>
      <Container className="grid gap-6 py-10">
        <PageHeader
          eyebrow={complete ? employer.companyName : "Employer"}
          title="My job postings"
          actions={
            complete ? (
              <ButtonLink href="/employer/jobs/new">Post a job</ButtonLink>
            ) : null
          }
        />
        {!complete ? (
          <Notice>
            <strong>Add your company details to start posting jobs.</strong>{" "}
            <Link href="/employer/profile" className="text-teal underline">
              Set up company profile
            </Link>
          </Notice>
        ) : null}

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Active listings" value={active} />
          <Stat label="Candidates in progress" value={inProgress} />
          <Stat label="Total listings" value={jobs.length} />
        </div>

        {jobs.length === 0 ? (
          <EmptyState title="No job postings yet">
            Post your first role and Pinnacle will start sourcing candidates.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wide text-graphite/70">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Salary</th>
                  <th className="px-4 py-3">Candidates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {jobs.map((job) => {
                  const c = counts.get(job.id);
                  return (
                    <tr key={job.id}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/employer/jobs/${job.id}`}
                          className="font-semibold text-ink hover:text-teal"
                        >
                          {job.roleTitle}
                        </Link>
                        <p className="text-xs text-graphite/70">
                          {job.sector} · {job.headcount} openings · posted{" "}
                          {formatDate(job.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {formatSalary(job)}
                      </td>
                      <td className="px-4 py-3">
                        {c?.open ?? 0}
                        <span className="text-graphite/60">
                          {" "}
                          / {c?.total ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <StatusBadge value={job.status} />
                          {job.urgency !== "Open" ? (
                            <StatusBadge value={job.urgency} />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <JobStatusButtons
                            action={setEmployerJobStatus}
                            jobId={job.id}
                            status={job.status}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </main>
  );
}
