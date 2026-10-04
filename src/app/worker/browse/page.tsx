import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { JobCard } from "@/components/job-card";
import { JobFilters, pickFilters } from "@/components/job-filters";
import { EmptyState, Notice, PageHeader, StageBadge } from "@/components/ui";
import { db } from "@/db";
import { listPublicJobs } from "@/db/queries";
import { introductions } from "@/db/schema";
import { isWorkerProfileComplete } from "@/lib/profile";
import { requireWorker } from "@/lib/session";

export const metadata: Metadata = { title: "Find jobs" };

export default async function WorkerBrowsePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const worker = await requireWorker();
  const filters = pickFilters(searchParams);
  const [jobs, applications] = await Promise.all([
    listPublicJobs(filters),
    db
      .select({
        jobListingId: introductions.jobListingId,
        stage: introductions.stage,
      })
      .from(introductions)
      .where(eq(introductions.workerId, worker.id)),
  ]);
  const applied = new Map(applications.map((a) => [a.jobListingId, a.stage]));

  return (
    <main>
      <Container className="grid gap-6 py-10">
        <PageHeader
          eyebrow={`Welcome, ${worker.fullName.split(" ")[0]}`}
          title="Find jobs"
          description="Browse open roles and apply. Pinnacle reviews every application and contacts shortlisted candidates."
        />
        {!isWorkerProfileComplete(worker) ? (
          <Notice>
            <strong>Finish your profile to start applying.</strong>{" "}
            <Link href="/worker/profile" className="text-teal underline">
              Complete it now
            </Link>
            .
          </Notice>
        ) : null}
        <JobFilters action="/worker/browse" values={filters} />
        {jobs.length === 0 ? (
          <EmptyState title="No jobs match those filters" />
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => {
              const stage = applied.get(job.id);
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  href={`/jobs/${job.id}`}
                  aside={stage ? <StageBadge stage={stage} /> : null}
                />
              );
            })}
          </div>
        )}
      </Container>
    </main>
  );
}
