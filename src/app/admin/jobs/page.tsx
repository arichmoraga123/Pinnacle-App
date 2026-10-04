import type { Metadata } from "next";
import Link from "next/link";

import { setAdminJobStatus } from "@/app/admin/actions";
import { Container } from "@/components/container";
import { JobFilters, pickFilters } from "@/components/job-filters";
import { JobStatusButtons } from "@/components/job-status-buttons";
import {
  ButtonLink,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { applicantCounts, listAllJobs } from "@/db/queries";
import { formatDate, formatSalary } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "All jobs" };

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAdmin();
  const filters = pickFilters(searchParams);
  const rows = await listAllJobs(filters);
  const counts = await applicantCounts(rows.map((r) => r.job.id));

  return (
    <main>
      <Container className="grid max-w-6xl gap-6 py-10">
        <PageHeader
          eyebrow="Pinnacle staff"
          title="Job postings"
          description="Every listing across all client companies. Post jobs on a client's behalf, or edit and close any listing."
          actions={<ButtonLink href="/admin/jobs/new">Post a job</ButtonLink>}
        />
        <JobFilters action="/admin/jobs" values={filters} />
        {rows.length === 0 ? (
          <EmptyState title="No job postings">
            <Link href="/admin/jobs/new" className="text-teal hover:underline">
              Post the first one
            </Link>
            .
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wide text-graphite/70">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Salary</th>
                  <th className="px-4 py-3">Candidates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map(({ job, companyName }) => {
                  const c = counts.get(job.id);
                  return (
                    <tr key={job.id}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/jobs/${job.id}/edit`}
                          className="font-semibold hover:text-teal"
                        >
                          {job.roleTitle}
                        </Link>
                        <p className="text-xs text-graphite/70">
                          {job.sector} · {job.passTrackRequired} ·{" "}
                          {formatDate(job.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">{companyName}</td>
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
                            action={setAdminJobStatus}
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
