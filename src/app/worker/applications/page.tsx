import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { withdrawApplication } from "@/app/worker/actions";
import { Container } from "@/components/container";
import { SubmitButton } from "@/components/form";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  StageBadge,
} from "@/components/ui";
import { db } from "@/db";
import { employers, introductions, jobListings } from "@/db/schema";
import { formatDate, formatSalary } from "@/lib/format";
import { requireWorker } from "@/lib/session";

export const metadata: Metadata = { title: "My applications" };

const STAGE_HELP: Record<string, string> = {
  Requested: "Received. Pinnacle will review it soon.",
  "Pinnacle Review": "Pinnacle is reviewing your profile for this role.",
  Introduced:
    "You've been introduced to the employer. Expect contact from Pinnacle.",
  Interview: "Interview stage. Pinnacle will share the details with you.",
  Offer: "An offer is being prepared. Congratulations!",
  Placed: "You've been placed in this role.",
  Declined: "This application did not progress. Keep applying!",
};

export default async function WorkerApplicationsPage() {
  const worker = await requireWorker();
  const rows = await db
    .select({
      intro: introductions,
      job: jobListings,
      industry: employers.industry,
    })
    .from(introductions)
    .innerJoin(jobListings, eq(introductions.jobListingId, jobListings.id))
    .innerJoin(employers, eq(jobListings.employerId, employers.id))
    .where(eq(introductions.workerId, worker.id))
    .orderBy(desc(introductions.updatedAt));

  return (
    <main>
      <Container className="grid gap-6 py-10">
        <PageHeader
          eyebrow="Track progress"
          title="My applications"
          actions={
            <ButtonLink href="/worker/browse">Find more jobs</ButtonLink>
          }
        />
        {rows.length === 0 ? (
          <EmptyState title="No applications yet">
            <Link href="/worker/browse" className="text-teal hover:underline">
              Browse open jobs
            </Link>{" "}
            and apply in a few clicks.
          </EmptyState>
        ) : (
          <div className="grid gap-4">
            {rows.map(({ intro, job, industry }) => (
              <Card key={intro.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-display text-lg font-semibold hover:text-teal"
                    >
                      {job.roleTitle}
                    </Link>
                    <p className="text-sm text-graphite">
                      {industry} · {job.location} · {formatSalary(job)}
                    </p>
                  </div>
                  <StageBadge stage={intro.stage} />
                </div>
                <p className="mt-3 text-sm text-graphite">
                  {intro.initiatedBy === "employer"
                    ? "An employer asked Pinnacle to introduce you for this role. "
                    : intro.initiatedBy === "pinnacle"
                      ? "Pinnacle put you forward for this role. "
                      : null}
                  {STAGE_HELP[intro.stage]}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-graphite/70">
                  <span>
                    Applied {formatDate(intro.createdAt)} · Updated{" "}
                    {formatDate(intro.updatedAt)}
                  </span>
                  {intro.initiatedBy === "worker" &&
                  (intro.stage === "Requested" ||
                    intro.stage === "Pinnacle Review") ? (
                    <form action={withdrawApplication}>
                      <input type="hidden" name="id" value={intro.id} />
                      <SubmitButton
                        variant="danger"
                        pendingLabel="Withdrawing…"
                        className="px-3 py-1 text-xs"
                      >
                        Withdraw
                      </SubmitButton>
                    </form>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
