import Link from "next/link";
import type { ReactNode } from "react";

import { Badge, StatusBadge } from "@/components/ui";
import type { PublicJob } from "@/db/queries";
import { formatSalary, posterUrl } from "@/lib/format";

/**
 * A job on the board. Jobs with a poster show the poster itself; the whole
 * card links straight to the application.
 */
export function JobCard({
  job,
  href,
  aside,
}: {
  job: PublicJob;
  href: string;
  aside?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm transition hover:border-teal/40 hover:shadow-md"
    >
      {job.posterKey ? (
        <div className="relative bg-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl(job.posterKey)}
            alt={`${job.roleTitle} job poster`}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover object-top transition group-hover:opacity-95"
          />
          {aside ? (
            <div className="absolute right-2 top-2 flex gap-1.5 rounded bg-white/90 p-1">
              {aside}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {job.jobCode ? (
              <p className="font-mono text-[11px] uppercase tracking-wide text-graphite/70">
                {job.jobCode}
              </p>
            ) : null}
            <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-teal">
              {job.roleTitle}
            </h3>
            <p className="mt-0.5 text-sm text-graphite">
              {job.industry} · {job.location}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {job.urgency === "Urgent" ? <StatusBadge value="Urgent" /> : null}
            {!job.posterKey ? aside : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="font-mono font-medium text-ink">
            {formatSalary(job)}
          </span>
          <Badge>{job.sector}</Badge>
          <Badge tone="teal">{job.passTrackRequired}</Badge>
        </div>
        <span className="mt-auto pt-1 text-sm font-semibold text-teal">
          Apply now →
        </span>
      </div>
    </Link>
  );
}
