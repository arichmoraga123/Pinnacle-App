import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { isUuid } from "@/db/queries";
import { employers, introductions, jobListings, workers } from "@/db/schema";
import { REVEALED_STAGES } from "@/lib/options";
import { getCurrentRole } from "@/lib/session";
import { contentTypeForKey, readUpload } from "@/lib/storage";

async function canView(workerId: string, workerClerkId: string | null) {
  const { userId } = await auth();
  if (!userId) return false;

  const role = await getCurrentRole();
  if (role === "admin") return true;
  if (role === "worker") return workerClerkId === userId;
  if (role !== "employer") return false;

  // Employers only once Pinnacle has introduced this worker for one of their jobs.
  const [match] = await db
    .select({ id: introductions.id })
    .from(introductions)
    .innerJoin(jobListings, eq(introductions.jobListingId, jobListings.id))
    .innerJoin(employers, eq(jobListings.employerId, employers.id))
    .where(
      and(
        eq(introductions.workerId, workerId),
        eq(employers.clerkUserId, userId),
        inArray(introductions.stage, [...REVEALED_STAGES]),
      ),
    )
    .limit(1);
  return Boolean(match);
}

export async function GET(
  _req: Request,
  { params }: { params: { workerId: string; kind: string } },
) {
  const notFound = () => new Response("Not found", { status: 404 });
  if (!isUuid(params.workerId)) return notFound();
  if (params.kind !== "resume" && params.kind !== "photo") return notFound();

  const worker = await db.query.workers.findFirst({
    where: eq(workers.id, params.workerId),
  });
  if (!worker) return notFound();
  if (!(await canView(worker.id, worker.clerkUserId))) return notFound();

  const key = params.kind === "resume" ? worker.resumeKey : worker.photoKey;
  if (!key) return notFound();

  const body = await readUpload(key);
  if (!body) return notFound();

  const ext = key.split(".").pop();
  const safeName = worker.fullName.replace(/[^\w\- ]+/g, "").trim() || "worker";
  return new Response(body, {
    headers: {
      "Content-Type": contentTypeForKey(key),
      "Content-Disposition": `inline; filename="${safeName} ${params.kind}.${ext}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
