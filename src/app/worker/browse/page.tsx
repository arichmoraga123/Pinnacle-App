import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { JobCard } from "@/components/job-card";
import { JobFilters, pickFilters } from "@/components/job-filters";
import {
  Badge,
  EmptyState,
  Notice,
  PageHeader,
  StageBadge,
} from "@/components/ui";
import { db } from "@/db";
import { listPublicJobs } from "@/db/queries";
import { introductions } from "@/db/schema";
import { matchLabel, scoreMatch } from "@/lib/matching";
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
  const complete = isWorkerProfileComplete(worker);

  // Best matches: unapplied jobs the worker is eligible for, best first.
  const scored = complete
    ? jobs
        .map((job) => ({ job, match: scoreMatch(worker, job) }))
        .filter(({ job, match }) => match.eligible && !applied.has(job.id))
    : [];
  const bestMatches = scored
    .filter(({ match }) => matchLabel(match.score))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 3);
  const labels = new Map(
    scored.map(({ job, match }) => [job.id, matchLabel(match.score)]),
  );
  const isFiltered = Boolean(filters.q || filters.sector || filters.passTrack);

  return (
    <main>
      <Container className="grid gap-6 py-10">
        <PageHeader
          eyebrow={`Welcome, ${worker.fullName.split(" ")[0]}`}
          title="Find jobs"
          description="Browse open roles and apply. Pinnacle reviews every application and contacts shortlisted candidates."
        />
        {!complete ? (
          <Notice>
            <strong>Finish your profile to start applying.</strong>{" "}
            <Link href="/worker/profile" className="text-teal underline">
              Complete it now
            </Link>
            .
          </Notice>
        ) : null}
        {bestMatches.length > 0 && !isFiltered ? (
          <section className="grid gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">
                Best matches for you
              </h2>
              <p className="text-sm text-graphite">
                Based on your trade, sector, work pass and experience.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {bestMatches.map(({ job, match }) => (
                <JobCard
                  key={job.id}
                  job={job}
                  href={`/jobs/${job.id}#apply`}
                  aside={<Badge tone="solid">{matchLabel(match.score)}</Badge>}
                />
              ))}
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">All jobs</h2>
          </section>
        ) : null}
        <JobFilters action="/worker/browse" values={filters} />
        {jobs.length === 0 ? (
          <EmptyState title="No jobs match those filters" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
              const stage = applied.get(job.id);
              const label = labels.get(job.id);
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  href={`/jobs/${job.id}#apply`}
                  aside={
                    stage ? (
                      <StageBadge stage={stage} />
                    ) : label ? (
                      <Badge tone="teal">{label}</Badge>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </Container>
    </main>
  );
}
