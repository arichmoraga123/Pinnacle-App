import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { updateIntroduction } from "@/app/admin/actions";
import { IntroductionEditor } from "@/components/admin-forms";
import { Container } from "@/components/container";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  StageBadge,
  Stat,
} from "@/components/ui";
import { db } from "@/db";
import { employers, introductions, jobListings, workers } from "@/db/schema";
import { formatDate, formatMoney } from "@/lib/format";
import {
  COMMISSION_STATUSES,
  INTRODUCTION_STAGES,
  OPEN_STAGES,
  type IntroductionStage,
} from "@/lib/options";
import { requireAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipeline" };

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: { stage?: string };
}) {
  await requireAdmin();
  const stageFilter = (INTRODUCTION_STAGES as readonly string[]).includes(
    searchParams.stage ?? "",
  )
    ? (searchParams.stage as IntroductionStage)
    : undefined;

  const [rows, stageCounts, [money]] = await Promise.all([
    db
      .select({
        intro: introductions,
        worker: workers,
        job: jobListings,
        companyName: employers.companyName,
        contactEmail: employers.contactEmail,
      })
      .from(introductions)
      .innerJoin(workers, eq(introductions.workerId, workers.id))
      .innerJoin(jobListings, eq(introductions.jobListingId, jobListings.id))
      .innerJoin(employers, eq(jobListings.employerId, employers.id))
      .where(stageFilter ? eq(introductions.stage, stageFilter) : undefined)
      .orderBy(
        sql`case when ${introductions.stage} = 'Requested' then 0 else 1 end`,
        desc(introductions.updatedAt),
      )
      .limit(200),
    db
      .select({
        stage: introductions.stage,
        n: sql<number>`count(*)::int`,
      })
      .from(introductions)
      .groupBy(introductions.stage),
    db
      .select({
        pending: sql<string>`coalesce(sum(${introductions.commissionAmount}) filter (where ${introductions.commissionStatus} in ('Pending', 'Invoiced')), 0)::text`,
        paid: sql<string>`coalesce(sum(${introductions.commissionAmount}) filter (where ${introductions.commissionStatus} = 'Paid'), 0)::text`,
      })
      .from(introductions),
  ]);

  const countByStage = new Map(stageCounts.map((r) => [r.stage, r.n]));
  const openCount = OPEN_STAGES.reduce(
    (n, s) => n + (countByStage.get(s) ?? 0),
    0,
  );

  return (
    <main>
      <Container className="grid max-w-6xl gap-6 py-10">
        <PageHeader
          eyebrow="Pinnacle staff"
          title="Introduction pipeline"
          description="Every application and introduction request lands here. Move candidates through stages, keep notes, and track commission."
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="New requests"
            value={countByStage.get("Requested") ?? 0}
          />
          <Stat label="In progress" value={openCount} />
          <Stat
            label="Commission outstanding"
            value={formatMoney(money.pending)}
          />
          <Stat label="Commission paid" value={formatMoney(money.paid)} />
        </div>

        <nav className="flex flex-wrap gap-1.5 text-sm">
          {[undefined, ...INTRODUCTION_STAGES].map((stage) => {
            const active = stage === stageFilter;
            const count = stage
              ? (countByStage.get(stage) ?? 0)
              : Array.from(countByStage.values()).reduce((a, b) => a + b, 0);
            return (
              <Link
                key={stage ?? "all"}
                href={
                  stage
                    ? `/admin/pipeline?stage=${encodeURIComponent(stage)}`
                    : "/admin/pipeline"
                }
                className={cn(
                  "rounded-full border px-3 py-1",
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-ink/15 bg-white text-graphite hover:border-teal/40",
                )}
              >
                {stage ?? "All"}{" "}
                <span className="font-mono text-xs opacity-70">{count}</span>
              </Link>
            );
          })}
        </nav>

        {rows.length === 0 ? (
          <EmptyState title="Nothing here yet">
            Applications from workers and introduction requests from employers
            will appear here.
          </EmptyState>
        ) : (
          <div className="grid gap-4">
            {rows.map(({ intro, worker, job, companyName, contactEmail }) => (
              <Card key={intro.id} className="grid gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <p className="font-display text-lg font-semibold">
                      {worker.fullName}
                      <span className="font-sans text-sm font-normal text-graphite">
                        {" "}
                        → {job.roleTitle} at {companyName}
                      </span>
                    </p>
                    <p className="text-sm text-graphite">
                      {worker.roleTitle} · {worker.yearsExperience} yrs ·{" "}
                      {worker.originCountry} · {worker.email ?? "no email"} ·{" "}
                      {worker.phone ?? "no phone"}
                    </p>
                    <p className="text-xs text-graphite/70">
                      Employer contact: {contactEmail}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge>
                      {intro.initiatedBy === "worker"
                        ? "Worker applied"
                        : "Employer requested"}
                    </Badge>
                    <Badge tone="teal">{worker.passTrack}</Badge>
                    <StageBadge stage={intro.stage} />
                  </div>
                </div>
                {intro.applicantMessage ? (
                  <blockquote className="border-l-2 border-amber pl-3 text-sm text-graphite">
                    {intro.applicantMessage}
                  </blockquote>
                ) : null}
                <IntroductionEditor
                  action={updateIntroduction}
                  introduction={intro}
                  stages={INTRODUCTION_STAGES}
                  commissionStatuses={COMMISSION_STATUSES}
                />
                <p className="font-mono text-[11px] uppercase tracking-wide text-graphite/60">
                  Created {formatDate(intro.createdAt)} · Updated{" "}
                  {formatDate(intro.updatedAt)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
