"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { isUuid } from "@/db/queries";
import { employers, introductions, jobListings, workers } from "@/db/schema";
import { parseJobForm } from "@/lib/jobs";
import { JOB_STATUSES } from "@/lib/options";
import { notifyStageChange } from "@/lib/notify";
import { requireAdmin } from "@/lib/session";
import { deleteUpload, hasFile, saveUpload, UploadError } from "@/lib/storage";
import {
  employerProfileSchema,
  fieldErrors,
  formObject,
  introductionUpdateSchema,
  workerStatusSchema,
  type FormState,
} from "@/lib/validation";

function revalidateEverything() {
  revalidatePath("/", "layout");
}

export async function saveAdminJob(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const employerId = String(formData.get("employerId") ?? "");
  const employer = isUuid(employerId)
    ? await db.query.employers.findFirst({
        where: eq(employers.id, employerId),
      })
    : undefined;
  if (!employer) {
    return {
      message: "Please fix the highlighted fields.",
      fieldErrors: { employerId: "Choose the client company" },
    };
  }

  const result = parseJobForm(formData);
  if (result.error) return result.error;

  const id = String(formData.get("id") ?? "");
  if (id && !isUuid(id)) return { message: "Job not found." };
  const existing = id
    ? await db.query.jobListings.findFirst({ where: eq(jobListings.id, id) })
    : undefined;
  if (id && !existing) return { message: "Job not found." };

  if (result.data.jobCode) {
    const clash = await db.query.jobListings.findFirst({
      columns: { id: true },
      where: eq(jobListings.jobCode, result.data.jobCode),
    });
    if (clash && clash.id !== id) {
      return {
        message: "Please fix the highlighted fields.",
        fieldErrors: { jobCode: "Another job already uses this code" },
      };
    }
  }

  let posterKey = existing?.posterKey ?? null;
  const poster = formData.get("poster");
  if (hasFile(poster)) {
    try {
      posterKey = await saveUpload(poster, "poster");
    } catch (error) {
      if (!(error instanceof UploadError)) throw error;
      return {
        message: "Please fix the highlighted fields.",
        fieldErrors: { poster: error.message },
      };
    }
  } else if (formData.get("removePoster") === "on") {
    posterKey = null;
  }

  const values = { ...result.data, employerId, posterKey };
  if (existing) {
    await db.update(jobListings).set(values).where(eq(jobListings.id, id));
  } else {
    await db.insert(jobListings).values(values);
  }
  if (existing?.posterKey && existing.posterKey !== posterKey) {
    await deleteUpload(existing.posterKey);
  }

  revalidateEverything();
  redirect(existing ? `/admin/jobs/${existing.id}` : "/admin/jobs");
}

export async function setAdminJobStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!isUuid(id) || !(JOB_STATUSES as readonly string[]).includes(status)) {
    return;
  }
  await db
    .update(jobListings)
    .set({ status: status as (typeof JOB_STATUSES)[number] })
    .where(eq(jobListings.id, id));
  revalidateEverything();
}

export async function createClientEmployer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = employerProfileSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  await db.insert(employers).values({ ...parsed.data, clerkUserId: null });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${parsed.data.companyName} added.` };
}

export async function updateIntroduction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = introductionUpdateSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const { id, ...values } = parsed.data;
  const before = await db.query.introductions.findFirst({
    columns: { stage: true },
    where: eq(introductions.id, id),
  });
  if (!before) return { message: "Introduction not found." };

  const [updated] = await db
    .update(introductions)
    .set(values)
    .where(eq(introductions.id, id))
    .returning();
  if (!updated) return { message: "Introduction not found." };

  await notifyStageChange({
    workerId: updated.workerId,
    jobListingId: updated.jobListingId,
    from: before.stage,
    to: updated.stage,
  });

  if (updated.stage === "Placed") {
    await db
      .update(workers)
      .set({ status: "Placed" })
      .where(eq(workers.id, updated.workerId));
  }

  revalidateEverything();
  return { ok: true, message: "Saved." };
}

export async function updateWorkerStatus(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = workerStatusSchema.safeParse(formObject(formData));
  if (!parsed.success) return { message: "Invalid status." };

  const { id, ...values } = parsed.data;
  await db.update(workers).set(values).where(eq(workers.id, id));
  revalidateEverything();
  return { ok: true, message: "Saved." };
}

/** Staff put a worker forward for a job themselves. */
export async function addToPipeline(formData: FormData) {
  await requireAdmin();
  const workerId = String(formData.get("workerId") ?? "");
  const jobListingId = String(formData.get("jobListingId") ?? "");
  if (!isUuid(workerId) || !isUuid(jobListingId)) return;

  await db
    .insert(introductions)
    .values({
      workerId,
      jobListingId,
      initiatedBy: "pinnacle",
      stage: "Pinnacle Review",
    })
    .onConflictDoNothing();

  revalidateEverything();
}
