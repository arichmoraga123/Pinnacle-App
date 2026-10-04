"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { isUuid } from "@/db/queries";
import { employers, introductions, jobListings, workers } from "@/db/schema";
import { parseJobForm } from "@/lib/jobs";
import { JOB_STATUSES } from "@/lib/options";
import { requireAdmin } from "@/lib/session";
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
  if (id) {
    if (!isUuid(id)) return { message: "Job not found." };
    await db
      .update(jobListings)
      .set({ ...result.data, employerId })
      .where(eq(jobListings.id, id));
  } else {
    await db.insert(jobListings).values({ ...result.data, employerId });
  }

  revalidateEverything();
  redirect("/admin/jobs");
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
  const [updated] = await db
    .update(introductions)
    .set(values)
    .where(eq(introductions.id, id))
    .returning();
  if (!updated) return { message: "Introduction not found." };

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
