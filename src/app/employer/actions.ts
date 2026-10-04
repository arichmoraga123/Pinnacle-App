"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { isUuid } from "@/db/queries";
import { employers, introductions, jobListings, workers } from "@/db/schema";
import { parseJobForm } from "@/lib/jobs";
import { JOB_STATUSES } from "@/lib/options";
import { notifyIntroductionRequested, notifyJobPosted } from "@/lib/notify";
import { isEmployerProfileComplete } from "@/lib/profile";
import { requireEmployer } from "@/lib/session";
import {
  employerProfileSchema,
  fieldErrors,
  formObject,
  type FormState,
} from "@/lib/validation";

export async function saveEmployerProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const employer = await requireEmployer();
  const parsed = employerProfileSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  await db
    .update(employers)
    .set(parsed.data)
    .where(eq(employers.id, employer.id));

  revalidatePath("/employer", "layout");
  return { ok: true, message: "Company details saved." };
}

export async function saveEmployerJob(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const employer = await requireEmployer();
  if (!isEmployerProfileComplete(employer)) {
    return { message: "Add your company details before posting a job." };
  }

  const result = parseJobForm(formData);
  if (result.error) return result.error;
  // Job codes are Pinnacle's own references; only staff set them.
  const values = { ...result.data, jobCode: undefined };

  const id = String(formData.get("id") ?? "");
  let jobId: string;

  if (id) {
    if (!isUuid(id)) return { message: "Job not found." };
    const updated = await db
      .update(jobListings)
      .set(values)
      .where(
        and(eq(jobListings.id, id), eq(jobListings.employerId, employer.id)),
      )
      .returning({ id: jobListings.id });
    if (updated.length === 0) return { message: "Job not found." };
    jobId = id;
  } else {
    const [created] = await db
      .insert(jobListings)
      .values({ ...values, employerId: employer.id })
      .returning({ id: jobListings.id });
    jobId = created.id;
    await notifyJobPosted(jobId);
  }

  revalidatePath("/employer", "layout");
  revalidatePath("/jobs", "layout");
  redirect(`/employer/jobs/${jobId}`);
}

export async function setEmployerJobStatus(formData: FormData) {
  const employer = await requireEmployer();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!isUuid(id) || !(JOB_STATUSES as readonly string[]).includes(status)) {
    return;
  }

  await db
    .update(jobListings)
    .set({ status: status as (typeof JOB_STATUSES)[number] })
    .where(
      and(eq(jobListings.id, id), eq(jobListings.employerId, employer.id)),
    );

  revalidatePath("/employer", "layout");
  revalidatePath("/jobs", "layout");
}

export async function requestIntroduction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const employer = await requireEmployer();
  const workerId = String(formData.get("workerId") ?? "");
  const jobListingId = String(formData.get("jobListingId") ?? "");
  const message = String(formData.get("message") ?? "")
    .trim()
    .slice(0, 2000);

  if (!isUuid(workerId) || !isUuid(jobListingId)) {
    return { message: "Choose one of your active jobs." };
  }

  const job = await db.query.jobListings.findFirst({
    where: and(
      eq(jobListings.id, jobListingId),
      eq(jobListings.employerId, employer.id),
    ),
  });
  if (!job || job.status !== "Active") {
    return { message: "Choose one of your active jobs." };
  }

  const worker = await db.query.workers.findFirst({
    where: eq(workers.id, workerId),
  });
  if (!worker || worker.status === "Placed" || worker.status === "Inactive") {
    return { message: "This candidate is no longer available." };
  }

  const inserted = await db
    .insert(introductions)
    .values({
      workerId,
      jobListingId,
      initiatedBy: "employer",
      applicantMessage: message || null,
    })
    .onConflictDoNothing()
    .returning({ id: introductions.id });

  if (inserted.length === 0) {
    return {
      message: "This candidate is already in the pipeline for that job.",
    };
  }

  if (worker.status === "Available") {
    await db
      .update(workers)
      .set({ status: "Introduction Requested" })
      .where(eq(workers.id, workerId));
  }

  await notifyIntroductionRequested({
    workerId,
    jobListingId,
    message: message || null,
  });

  revalidatePath("/employer", "layout");
  return {
    ok: true,
    message: "Introduction requested. Pinnacle will be in touch shortly.",
  };
}
