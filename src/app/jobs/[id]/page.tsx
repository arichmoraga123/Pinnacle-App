import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplyForm } from "@/components/apply-form";
import { Container } from "@/components/container";
import {
  Badge,
  ButtonLink,
  Card,
  DefinitionList,
  Notice,
  StageBadge,
  StatusBadge,
} from "@/components/ui";
import { applyToJob } from "@/app/worker/actions";
import { db } from "@/db";
import { getPublicJob } from "@/db/queries";
import { introductions } from "@/db/schema";
import { formatDate, formatSalary } from "@/lib/format";
import { isWorkerProfileComplete } from "@/lib/profile";
import { getCurrentRole, requireWorker } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const job = await getPublicJob(params.id);
  return { title: job ? job.roleTitle : "Job not found" };
}

async function ApplyPanel({ jobId }: { jobId: string }) {
  const role = await getCurrentRole();

  if (!role) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-graphite">
          Create a free worker profile to apply. It only takes a few minutes.
        </p>
        <ButtonLink href={`/sign-up?role=worker`} variant="accent">
          Sign up to apply
        </ButtonLink>
        <p className="text-xs text-graphite">
          Already registered?{" "}
          <Link href="/sign-in" className="text-teal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  if (role !== "worker") {
    return (
      <p className="text-sm text-graphite">
        You are signed in as{" "}
        {role === "admin" ? "Pinnacle staff" : "an employer"}. Only worker
        accounts can apply.
      </p>
    );
  }

  const worker = await requireWorker();
  const existing = await db.query.introductions.findFirst({
    where: and(
      eq(introductions.workerId, worker.id),
      eq(introductions.jobListingId, jobId),
    ),
  });

  if (existing) {
    return (
      <div className="grid gap-2 text-sm">
        <p className="text-graphite">
          You applied on {formatDate(existing.createdAt)}.
        </p>
        <div>
          <StageBadge stage={existing.stage} />
        </div>
        <Link href="/worker/applications" className="text-teal hover:underline">
          View my applications →
        </Link>
      </div>
    );
  }

  if (!isWorkerProfileComplete(worker)) {
    return (
      <div className="grid gap-3">
        <Notice>
          Finish your profile first so Pinnacle can match you to this role.
        </Notice>
        <ButtonLink href={`/worker/profile?next=/jobs/${jobId}`}>
          Complete profile
        </ButtonLink>
      </div>
    );
  }

  return <ApplyForm action={applyToJob} jobListingId={jobId} />;
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const job = await getPublicJob(params.id);
  if (!job) notFound();

  return (
    <main>
      <Container className="grid gap-6 py-10">
        <Link href="/jobs" className="text-sm text-teal hover:underline">
          ← All jobs
        </Link>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid content-start gap-6">
            <div>
              <div className="flex flex-wrap gap-1.5">
                <Badge>{job.sector}</Badge>
                <Badge tone="teal">{job.passTrackRequired}</Badge>
                {job.urgency === "Urgent" ? (
                  <StatusBadge value="Urgent" />
                ) : null}
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold">
                {job.roleTitle}
              </h1>
              <p className="mt-1 text-graphite">
                {job.industry} company · {job.location}
              </p>
            </div>
            <Card>
              <DefinitionList
                items={[
                  ["Salary", formatSalary(job)],
                  ["Openings", job.headcount],
                  ["Work pass", job.passTrackRequired],
                  ["Posted", formatDate(job.createdAt)],
                ]}
              />
            </Card>
            <Card>
              <h2 className="font-display text-lg font-semibold">
                About the role
              </h2>
              {job.description ? (
                <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-graphite">
                  {job.description}
                </div>
              ) : (
                <p className="mt-3 text-sm text-graphite">
                  Pinnacle will share full details with shortlisted candidates.
                </p>
              )}
            </Card>
          </div>
          <aside className="grid content-start gap-4">
            <Card>
              <h2 className="font-display text-lg font-semibold">Apply</h2>
              <div className="mt-3">
                <ApplyPanel jobId={job.id} />
              </div>
            </Card>
            <p className="px-1 text-xs leading-relaxed text-graphite/80">
              Pinnacle reviews every application and introduces shortlisted
              candidates to the employer. Workers are never charged a fee to
              apply.
            </p>
          </aside>
        </div>
      </Container>
    </main>
  );
}
