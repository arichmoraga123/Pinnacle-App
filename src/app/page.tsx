import Link from "next/link";

import { Container } from "@/components/container";
import { JobCard } from "@/components/job-card";
import { ButtonLink } from "@/components/ui";
import { listPublicJobs } from "@/db/queries";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    n: "01",
    title: "Employers post roles",
    body: "Companies list openings with pay, pass type and headcount — or Pinnacle posts them on their behalf.",
  },
  {
    n: "02",
    title: "Workers apply online",
    body: "Candidates from across Asia build a profile once and apply to any open role in a few clicks.",
  },
  {
    n: "03",
    title: "Pinnacle makes the match",
    body: "We screen every application, introduce the right people, and guide both sides through work pass paperwork to placement.",
  },
];

export default async function Home() {
  const jobs = await listPublicJobs({}, 4);

  return (
    <main>
      <section className="bg-ink text-white">
        <Container className="grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-amber">
              Singapore work placements
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
              The right people for the job, introduced by people you trust.
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Pinnacle connects Singapore employers with skilled workers from
              across Asia, and handles every step in between.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/jobs"
                className="inline-flex items-center rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-ink hover:bg-amber/90"
              >
                I&apos;m looking for work
              </Link>
              <Link
                href="/sign-up?role=employer"
                className="inline-flex items-center rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                I&apos;m hiring
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <p className="font-mono text-xs text-amber">{step.n}</p>
                <p className="mt-1 font-display font-semibold">{step.title}</p>
                <p className="mt-1 text-sm text-white/70">{step.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-teal">
                Now hiring
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold">
                Latest openings
              </h2>
            </div>
            <Link
              href="/jobs"
              className="text-sm font-semibold text-teal hover:underline"
            >
              View all jobs →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} href={`/jobs/${job.id}`} />
            ))}
          </div>
          {jobs.length === 0 ? (
            <p className="mt-6 text-sm text-graphite">
              New openings are posted regularly. Check back soon.
            </p>
          ) : null}
        </Container>
      </section>

      <section className="border-t border-ink/10 bg-white">
        <Container className="grid gap-6 py-14 md:grid-cols-2">
          <div className="rounded-lg border border-ink/10 p-6">
            <h3 className="font-display text-xl font-bold">For employers</h3>
            <p className="mt-2 text-sm text-graphite">
              Post openings, browse vetted candidates and request introductions.
              Pinnacle handles screening and work pass coordination.
            </p>
            <div className="mt-4">
              <ButtonLink href="/sign-up?role=employer">
                Create employer account
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-lg border border-ink/10 p-6">
            <h3 className="font-display text-xl font-bold">For workers</h3>
            <p className="mt-2 text-sm text-graphite">
              Create one profile, apply to any role, and track your application.
              Pinnacle never charges workers to apply.
            </p>
            <div className="mt-4">
              <ButtonLink href="/sign-up?role=worker" variant="accent">
                Create worker profile
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
