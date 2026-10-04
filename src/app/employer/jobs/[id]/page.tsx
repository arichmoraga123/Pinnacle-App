import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { setEmployerJobStatus } from "@/app/employer/actions";
import { Container } from "@/components/container";
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
import { introductions, jobListings, workers } from "@/db/schema";
import {
  formatDate,
  formatPasses,
  formatSalary,
  workerFileUrl,
} from "@/lib/format";
import { REVEALED_STAGES } from "@/lib/options";
import { requireEmployer } from "@/lib/session";

export const metadata: Metadata = { title: "Job" };

export default async function EmployerJobPage({
  params,
}: {
  params: { id: string };
}) {
  const employer = await requireEmployer();
  if (!isUuid(params.id)) notFound();
  const job = await db.query.jobListings.findFirst({
    where: and(
      eq(jobListings.id, params.id),
      eq(jobListings.employerId, employer.id),
    ),
  });
  if (!job) notFound();

  const candidates = await db
    .select({ intro: introductions, worker: workers })
    .from(introductions)
    .innerJoin(workers, eq(introductions.workerId, workers.id))
    .where(eq(introductions.jobListingId, job.id))
    .orderBy(desc(introductions.updatedAt));

  return (
    <main>
      <Container className="grid gap-6 py-10">
        <Link
          href="/employer/jobs"
          className="text-sm text-teal hover:underline"
        >
          ← My jobs
        </Link>
        <PageHeader
          eyebrow={`${job.sector} · ${job.location}`}
          title={job.roleTitle}
          actions={
            <>
              <JobStatusButtons
                action={setEmployerJobStatus}
                jobId={job.id}
                status={job.status}
              />
              <ButtonLink
                href={`/employer/jobs/${job.id}/edit`}
                variant="secondary"
              >
                Edit
              </ButtonLink>
            </>
          }
        />
        <Card>
          <DefinitionList
            items={[
              ["Status", <StatusBadge key="s" value={job.status} />],
              ["Urgency", <StatusBadge key="u" value={job.urgency} />],
              ["Salary", formatSalary(job)],
              ["Openings", job.headcount],
              ["Work pass", formatPasses(job.passTracksAccepted)],
              ["Posted", formatDate(job.createdAt)],
            ]}
          />
          {job.description ? (
            <p className="mt-5 whitespace-pre-line border-t border-ink/10 pt-4 text-sm text-graphite">
              {job.description}
            </p>
          ) : null}
        </Card>

        <section className="grid gap-3">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-xl font-bold">Candidates</h2>
            <Link
              href="/employer/browse"
              className="text-sm text-teal hover:underline"
            >
              Browse more talent →
            </Link>
          </div>
          <p className="text-sm text-graphite">
            Pinnacle screens every candidate. Names and contact details are
            shared once Pinnacle makes the introduction.
          </p>
          {candidates.length === 0 ? (
            <EmptyState title="No candidates yet">
              Applications will appear here as workers apply.
            </EmptyState>
          ) : (
            <div className="grid gap-3">
              {candidates.map(({ intro, worker }) => {
                const revealed = REVEALED_STAGES.includes(intro.stage);
                return (
                  <Card key={intro.id} className="grid gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-mono text-sm text-amber">
                          {worker.initials}
                        </span>
                        <div>
                          <p className="font-semibold">
                            {revealed
                              ? worker.fullName
                              : `Candidate ${worker.initials}`}
                          </p>
                          <p className="text-sm text-graphite">
                            {worker.roleTitle} · {worker.yearsExperience} yrs ·{" "}
                            {worker.originCountry}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone="teal">{worker.passTrack}</Badge>
                        <StageBadge stage={intro.stage} />
                      </div>
                    </div>
                    {revealed ? (
                      <p className="flex flex-wrap gap-x-3 text-sm text-graphite">
                        <span>{worker.email ?? "No email"}</span>
                        <span>{worker.phone ?? "No phone"}</span>
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
                      </p>
                    ) : null}
                    {worker.summary ? (
                      <p className="line-clamp-3 text-sm text-graphite">
                        {worker.summary}
                      </p>
                    ) : null}
                    <p className="font-mono text-[11px] uppercase tracking-wide text-graphite/60">
                      {intro.initiatedBy === "employer"
                        ? "You requested this introduction"
                        : intro.initiatedBy === "pinnacle"
                          ? "Recommended by Pinnacle"
                          : "Applied"}{" "}
                      · {formatDate(intro.createdAt)}
                    </p>
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
