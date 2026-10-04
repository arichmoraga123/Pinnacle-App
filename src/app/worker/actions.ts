"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { getPublicJob } from "@/db/queries";
import { introductions, workers, type Worker } from "@/db/schema";
import { initialsFromName } from "@/lib/format";
import { COUNTRIES } from "@/lib/options";
import { isWorkerProfileComplete } from "@/lib/profile";
import { notifyNewApplication } from "@/lib/notify";
import { requireWorker } from "@/lib/session";
import { deleteUpload, hasFile, saveUpload, UploadError } from "@/lib/storage";
import {
  applicationSchema,
  fieldErrors,
  formObject,
  workerProfileSchema,
  type FormState,
} from "@/lib/validation";

/**
 * Store any resume/photo included in the form on the worker's profile,
 * replacing (and deleting) the previous files.
 */
async function saveWorkerFiles(
  worker: Worker,
  formData: FormData,
): Promise<FormState | null> {
  const updates: Partial<Pick<Worker, "resumeKey" | "photoKey">> = {};
  const fields = [
    ["resume", "resumeKey"],
    ["photo", "photoKey"],
  ] as const;

  for (const [field, column] of fields) {
    const file = formData.get(field);
    if (!hasFile(file)) continue;
    try {
      updates[column] = await saveUpload(file, field);
    } catch (error) {
      if (!(error instanceof UploadError)) throw error;
      await Promise.all(Object.values(updates).map((k) => deleteUpload(k)));
      return {
        message: "Please fix the highlighted fields.",
        fieldErrors: { [field]: error.message },
      };
    }
  }

  if (Object.keys(updates).length === 0) return null;
  await db.update(workers).set(updates).where(eq(workers.id, worker.id));
  for (const [, column] of fields) {
    if (updates[column] && worker[column]) await deleteUpload(worker[column]);
  }
  return null;
}

export async function saveWorkerProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const worker = await requireWorker();
  const parsed = workerProfileSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const fileError = await saveWorkerFiles(worker, formData);
  if (fileError) return fileError;

  const data = parsed.data;
  const country = COUNTRIES.find((c) => c.code === data.originCountryCode)!;

  await db
    .update(workers)
    .set({
      fullName: data.fullName,
      initials: initialsFromName(data.fullName),
      email: data.email,
      phone: data.phone,
      roleTitle: data.roleTitle,
      sector: data.sector,
      originCountry: country.name,
      originCountryCode: country.code,
      yearsExperience: data.yearsExperience,
      // Workers choose a pass track once during onboarding; after that only
      // Pinnacle staff change it, once they have verified it.
      ...(isWorkerProfileComplete(worker) || !data.passTrack
        ? {}
        : { passTrack: data.passTrack }),
      summary: data.summary,
    })
    .where(eq(workers.id, worker.id));

  revalidatePath("/worker", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function applyToJob(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const worker = await requireWorker();
  if (!isWorkerProfileComplete(worker)) {
    return { message: "Complete your profile before applying." };
  }

  const parsed = applicationSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { message: "Something went wrong. Please try again." };
  }

  const job = await getPublicJob(parsed.data.jobListingId);
  if (!job || job.urgency === "Filled") {
    return { message: "This job is no longer accepting applications." };
  }

  const fileError = await saveWorkerFiles(worker, formData);
  if (fileError) return fileError;

  const inserted = await db
    .insert(introductions)
    .values({
      workerId: worker.id,
      jobListingId: job.id,
      initiatedBy: "worker",
      applicantMessage: parsed.data.message,
    })
    .onConflictDoNothing()
    .returning({ id: introductions.id });

  if (inserted.length === 0) {
    return { message: "You have already applied for this job." };
  }

  await notifyNewApplication({
    workerId: worker.id,
    jobListingId: job.id,
    message: parsed.data.message,
  });

  revalidatePath(`/jobs/${job.id}`);
  revalidatePath("/worker", "layout");
  return {
    ok: true,
    message:
      "Application sent. Pinnacle will review it and contact you about next steps.",
  };
}

export async function withdrawApplication(formData: FormData) {
  const worker = await requireWorker();
  const id = String(formData.get("id") ?? "");

  // Only withdraw before Pinnacle has introduced the worker to the employer.
  await db
    .delete(introductions)
    .where(
      and(
        eq(introductions.id, id),
        eq(introductions.workerId, worker.id),
        inArray(introductions.stage, ["Requested", "Pinnacle Review"]),
      ),
    );

  revalidatePath("/worker", "layout");
  revalidatePath("/jobs", "layout");
}
