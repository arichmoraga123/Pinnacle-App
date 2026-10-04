import type { Metadata } from "next";

import { Container } from "@/components/container";
import { JobCard } from "@/components/job-card";
import { JobFilters, pickFilters } from "@/components/job-filters";
import { EmptyState, PageHeader } from "@/components/ui";
import { listPublicJobs } from "@/db/queries";

export const metadata: Metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = pickFilters(searchParams);
  const jobs = await listPublicJobs(filters);

  return (
    <main>
      <Container className="grid gap-6 py-10">
        <PageHeader
          eyebrow="Open positions"
          title="Find work in Singapore"
          description="Every role is screened by Pinnacle. Apply online and we'll guide you through the work pass process."
        />
        <JobFilters action="/jobs" values={filters} />
        <p className="font-mono text-xs uppercase tracking-wide text-graphite/70">
          {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
        </p>
        {jobs.length === 0 ? (
          <EmptyState title="No jobs match those filters">
            Try a different sector or pass type.
          </EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} href={`/jobs/${job.id}#apply`} />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
