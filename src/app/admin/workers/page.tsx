import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import type { Metadata } from "next";

import { updateWorkerStatus } from "@/app/admin/actions";
import { WorkerStatusForm } from "@/components/admin-forms";
import { Container } from "@/components/container";
import { JobFilters, pickFilters } from "@/components/job-filters";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { workers } from "@/db/schema";
import { formatDate, whatsappUrl, workerFileUrl } from "@/lib/format";
import {
  PASS_TRACKS,
  SECTORS,
  WORKER_STATUSES,
  type PassTrack,
  type Sector,
} from "@/lib/options";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Workers" };

export default async function AdminWorkersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAdmin();
  const filters = pickFilters(searchParams);

  const conditions: SQL[] = [];
  if (
    filters.sector &&
    (SECTORS as readonly string[]).includes(filters.sector)
  ) {
    conditions.push(eq(workers.sector, filters.sector as Sector));
  }
  if (
    filters.passTrack &&
    (PASS_TRACKS as readonly string[]).includes(filters.passTrack)
  ) {
    conditions.push(eq(workers.passTrack, filters.passTrack as PassTrack));
  }
  if (filters.q?.trim()) {
    const pattern = `%${filters.q.trim().replace(/[%_\\]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(workers.fullName, pattern),
        ilike(workers.roleTitle, pattern),
        ilike(workers.email, pattern),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(workers)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(workers.createdAt))
    .limit(300);

  return (
    <main>
      <Container className="grid max-w-6xl gap-6 py-10">
        <PageHeader
          eyebrow="Pinnacle staff"
          title="Workers"
          description="Full candidate details. Update availability and verify each worker's pass track after review."
        />
        <JobFilters
          action="/admin/workers"
          values={filters}
          placeholder="Search name, trade or email…"
        />
        {rows.length === 0 ? (
          <EmptyState title="No workers found" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wide text-graphite/70">
                <tr>
                  <th className="px-4 py-3">Worker</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Trade</th>
                  <th className="px-4 py-3">Status / pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 align-top">
                {rows.map((w) => (
                  <tr key={w.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{w.fullName}</p>
                      <p className="text-xs text-graphite/70">
                        {w.originCountry} · joined {formatDate(w.createdAt)}
                      </p>
                      {w.summary ? (
                        <p className="mt-1 line-clamp-2 max-w-xs text-xs text-graphite">
                          {w.summary}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {w.email ? (
                        <a
                          href={`mailto:${w.email}`}
                          className="text-teal hover:underline"
                        >
                          {w.email}
                        </a>
                      ) : (
                        <span className="text-graphite/60">no email</span>
                      )}
                      <p className="text-graphite">{w.phone ?? ""}</p>
                      <p className="mt-1 flex flex-wrap gap-x-2">
                        {whatsappUrl(w.phone) ? (
                          <a
                            href={whatsappUrl(w.phone)!}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal hover:underline"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                        {w.resumeKey ? (
                          <a
                            href={workerFileUrl(w.id, "resume")}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal hover:underline"
                          >
                            Resume
                          </a>
                        ) : null}
                        {w.photoKey ? (
                          <a
                            href={workerFileUrl(w.id, "photo")}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal hover:underline"
                          >
                            Photo
                          </a>
                        ) : null}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{w.roleTitle}</p>
                      <div className="mt-1 flex gap-1">
                        <Badge>{w.sector}</Badge>
                        <Badge>{w.yearsExperience} yrs</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <WorkerStatusForm
                        action={updateWorkerStatus}
                        worker={w}
                        statuses={WORKER_STATUSES}
                        passTracks={PASS_TRACKS}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </main>
  );
}
