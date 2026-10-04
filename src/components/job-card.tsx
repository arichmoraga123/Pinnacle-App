import Link from "next/link";
import type { ReactNode } from "react";

import { Badge, StatusBadge } from "@/components/ui";
import type { PublicJob } from "@/db/queries";
import { formatSalary } from "@/lib/format";

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
      className="group block rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:border-teal/40 hover:shadow"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-ink group-hover:text-teal">
            {job.roleTitle}
          </h3>
          <p className="mt-0.5 text-sm text-graphite">
            {job.industry} · {job.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.urgency === "Urgent" ? <StatusBadge value="Urgent" /> : null}
          {aside}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-mono font-medium text-ink">
          {formatSalary(job)}
        </span>
        <Badge>{job.sector}</Badge>
        <Badge tone="teal">{job.passTrackRequired}</Badge>
        <span className="text-graphite/80">
          {job.headcount} {job.headcount === 1 ? "opening" : "openings"}
        </span>
      </div>
    </Link>
  );
}
