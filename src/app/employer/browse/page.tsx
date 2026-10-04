import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { requestIntroduction } from "@/app/employer/actions";
import { Container } from "@/components/container";
import { JobFilters, pickFilters } from "@/components/job-filters";
import { RequestIntroForm } from "@/components/request-intro-form";
import { Badge, Card, EmptyState, Notice, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { listAvailableWorkers } from "@/db/queries";
import { jobListings } from "@/db/schema";
import { requireEmployer } from "@/lib/session";

export const metadata: Metadata = { title: "Browse talent" };

export default async function EmployerBrowsePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const employer = await requireEmployer();
  const filters = pickFilters(searchParams);
  const [candidates, activeJobs] = await Promise.all([
    listAvailableWorkers(filters),
    db
      .select({ id: jobListings.id, roleTitle: jobListings.roleTitle })
      .from(jobListings)
      .where(
        and(
          eq(jobListings.employerId, employer.id),
          eq(jobListings.status, "Active"),
        ),
      ),
  ]);

  return (
    <main>
      <Container className="grid gap-6 py-10">
        <PageHeader
          eyebrow="Talent pool"
          title="Browse candidates"
          description="Profiles are anonymised. Request an introduction and Pinnacle will screen the candidate and connect you."
        />
        {activeJobs.length === 0 ? (
          <Notice>
            You need an active job posting to request introductions.{" "}
            <Link href="/employer/jobs/new" className="text-teal underline">
              Post a job
            </Link>
          </Notice>
        ) : null}
        <JobFilters
          action="/employer/browse"
          values={filters}
          showSearch={false}
        />
        {candidates.length === 0 ? (
          <EmptyState title="No candidates match those filters" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {candidates.map((c) => (
              <Card key={c.id} className="grid content-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-mono text-sm text-amber">
                      {c.initials}
                    </span>
                    <div>
                      <p className="font-display font-semibold">
                        {c.roleTitle}
                      </p>
                      <p className="text-sm text-graphite">
                        {c.yearsExperience} yrs experience · {c.originCountry}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge>{c.sector}</Badge>
                    <Badge tone="teal">{c.passTrack}</Badge>
                  </div>
                  {c.summary ? (
                    <p className="mt-3 line-clamp-3 text-sm text-graphite">
                      {c.summary}
                    </p>
                  ) : null}
                </div>
                {activeJobs.length > 0 ? (
                  <RequestIntroForm
                    action={requestIntroduction}
                    workerId={c.id}
                    jobs={activeJobs}
                  />
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
