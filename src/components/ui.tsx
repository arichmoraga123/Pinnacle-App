import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="font-mono text-xs uppercase tracking-widest text-teal">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-graphite">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-ink/10 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-ink/5 text-ink",
  teal: "bg-teal/10 text-teal",
  amber: "bg-amber/15 text-[#8a5a12]",
  red: "bg-stampRed/10 text-stampRed",
  solid: "bg-teal text-white",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

const STAGE_TONES: Record<string, BadgeTone> = {
  Requested: "amber",
  "Pinnacle Review": "neutral",
  Introduced: "teal",
  Interview: "teal",
  Offer: "teal",
  Placed: "solid",
  Declined: "red",
};

export function StageBadge({ stage }: { stage: string }) {
  return <Badge tone={STAGE_TONES[stage] ?? "neutral"}>{stage}</Badge>;
}

const JOB_TONES: Record<string, BadgeTone> = {
  Urgent: "red",
  Open: "teal",
  Filled: "neutral",
  Active: "teal",
  Paused: "amber",
  Closed: "neutral",
};

export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={JOB_TONES[value] ?? "neutral"}>{value}</Badge>;
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-ink/20 bg-white/60 px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {children ? (
        <div className="mt-2 text-sm text-graphite">{children}</div>
      ) : null}
    </div>
  );
}

export function Notice({
  children,
  tone = "amber",
}: {
  children: ReactNode;
  tone?: "amber" | "teal";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        tone === "amber"
          ? "border-amber/40 bg-amber/10 text-graphite"
          : "border-teal/30 bg-teal/5 text-graphite",
      )}
    >
      {children}
    </div>
  );
}

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-graphite disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal/40 hover:bg-teal/5 disabled:opacity-60",
  accent:
    "inline-flex items-center justify-center rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal/90 disabled:opacity-60",
  danger:
    "inline-flex items-center justify-center rounded-md border border-stampRed/30 bg-white px-4 py-2 text-sm font-semibold text-stampRed transition hover:bg-stampRed/5 disabled:opacity-60",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonClass;
}) {
  return (
    <Link href={href} className={buttonClass[variant]}>
      {children}
    </Link>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-wide text-graphite/70">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

export function DefinitionList({
  items,
}: {
  items: Array<[string, ReactNode]>;
}) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-graphite/70">
            {label}
          </dt>
          <dd className="mt-0.5 text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
