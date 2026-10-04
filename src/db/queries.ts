import "server-only";

import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { employers, introductions, jobListings, workers } from "@/db/schema";
import {
  OPEN_STAGES,
  PASS_TRACKS,
  SECTORS,
  type PassTrack,
  type Sector,
} from "@/lib/options";

export type JobFilters = {
  q?: string;
  sector?: string;
  passTrack?: string;
};

function jobFilterConditions(filters: JobFilters): SQL[] {
  const conditions: SQL[] = [];
  if (
    filters.sector &&
    (SECTORS as readonly string[]).includes(filters.sector)
  ) {
    conditions.push(eq(jobListings.sector, filters.sector as Sector));
  }
  if (
    filters.passTrack &&
    (PASS_TRACKS as readonly string[]).includes(filters.passTrack)
  ) {
    conditions.push(
      eq(jobListings.passTrackRequired, filters.passTrack as PassTrack),
    );
  }
  const q = filters.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(jobListings.roleTitle, pattern),
        ilike(jobListings.description, pattern),
        ilike(jobListings.location, pattern),
      )!,
    );
  }
  return conditions;
}

/**
 * Columns safe to show workers and the public. The client company's name is
 * deliberately left out: Pinnacle brokers every introduction.
 */
const publicJobColumns = {
  id: jobListings.id,
  roleTitle: jobListings.roleTitle,
  description: jobListings.description,
  location: jobListings.location,
  sector: jobListings.sector,
  passTrackRequired: jobListings.passTrackRequired,
  salaryRangeMin: jobListings.salaryRangeMin,
  salaryRangeMax: jobListings.salaryRangeMax,
  currency: jobListings.currency,
  headcount: jobListings.headcount,
  urgency: jobListings.urgency,
  status: jobListings.status,
  createdAt: jobListings.createdAt,
  industry: employers.industry,
};

export type PublicJob = Awaited<ReturnType<typeof listPublicJobs>>[number];

export async function listPublicJobs(filters: JobFilters = {}, limit = 100) {
  return db
    .select(publicJobColumns)
    .from(jobListings)
    .innerJoin(employers, eq(jobListings.employerId, employers.id))
    .where(
      and(
        eq(jobListings.status, "Active"),
        sql`${jobListings.urgency} <> 'Filled'`,
        ...jobFilterConditions(filters),
      ),
    )
    .orderBy(
      sql`case when ${jobListings.urgency} = 'Urgent' then 0 else 1 end`,
      desc(jobListings.createdAt),
    )
    .limit(limit);
}

export async function getPublicJob(id: string) {
  if (!isUuid(id)) return null;
  const [job] = await db
    .select(publicJobColumns)
    .from(jobListings)
    .innerJoin(employers, eq(jobListings.employerId, employers.id))
    .where(and(eq(jobListings.id, id), eq(jobListings.status, "Active")))
    .limit(1);
  return job ?? null;
}

/** Applicant counts per job, split into in-progress and total. */
export async function applicantCounts(jobIds: string[]) {
  if (jobIds.length === 0)
    return new Map<string, { open: number; total: number }>();
  const rows = await db
    .select({
      jobListingId: introductions.jobListingId,
      total: sql<number>`count(*)::int`,
      open: sql<number>`count(*) filter (where ${inArray(introductions.stage, [...OPEN_STAGES])})::int`,
    })
    .from(introductions)
    .where(inArray(introductions.jobListingId, jobIds))
    .groupBy(introductions.jobListingId);
  return new Map(
    rows.map((r) => [r.jobListingId, { open: r.open, total: r.total }]),
  );
}

export async function listAllJobs(
  filters: JobFilters & { status?: string } = {},
) {
  const conditions = jobFilterConditions(filters);
  if (
    filters.status === "Active" ||
    filters.status === "Paused" ||
    filters.status === "Closed"
  ) {
    conditions.push(eq(jobListings.status, filters.status));
  }
  return db
    .select({
      job: jobListings,
      companyName: employers.companyName,
    })
    .from(jobListings)
    .innerJoin(employers, eq(jobListings.employerId, employers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(jobListings.createdAt));
}

export async function listAvailableWorkers(filters: {
  sector?: string;
  passTrack?: string;
}) {
  const conditions: SQL[] = [
    inArray(workers.status, ["Available", "Introduction Requested"]),
    sql`${workers.roleTitle} <> 'Profile pending'`,
  ];
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
  // Anonymised columns only: employers see names after Pinnacle introduces.
  return db
    .select({
      id: workers.id,
      initials: workers.initials,
      roleTitle: workers.roleTitle,
      sector: workers.sector,
      originCountry: workers.originCountry,
      yearsExperience: workers.yearsExperience,
      passTrack: workers.passTrack,
      summary: workers.summary,
    })
    .from(workers)
    .where(and(...conditions))
    .orderBy(desc(workers.yearsExperience));
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
