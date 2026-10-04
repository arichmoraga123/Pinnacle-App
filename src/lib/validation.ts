import { z } from "zod";

import {
  COMMISSION_STATUSES,
  COUNTRIES,
  CURRENCIES,
  INTRODUCTION_STAGES,
  JOB_STATUSES,
  JOB_URGENCIES,
  PASS_TRACKS,
  SECTORS,
  WORKER_STATUSES,
} from "@/lib/options";

export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} is too long`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

const intField = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

export const jobListingSchema = z
  .object({
    roleTitle: trimmed(2, 120, "Role title"),
    description: z.string().trim().max(5000, "Description is too long"),
    location: trimmed(2, 120, "Location"),
    sector: z.enum(SECTORS, { error: "Choose a sector" }),
    passTrackRequired: z.enum(PASS_TRACKS, { error: "Choose a pass type" }),
    salaryRangeMin: intField("Minimum salary", 0, 1_000_000),
    salaryRangeMax: intField("Maximum salary", 0, 1_000_000),
    currency: z.enum(CURRENCIES),
    headcount: intField("Headcount", 1, 1000),
    urgency: z.enum(JOB_URGENCIES),
    status: z.enum(JOB_STATUSES),
  })
  .refine((v) => v.salaryRangeMax >= v.salaryRangeMin, {
    path: ["salaryRangeMax"],
    message: "Maximum must be at least the minimum",
  });

export const workerProfileSchema = z.object({
  fullName: trimmed(2, 120, "Full name"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
  phone: optionalText(40),
  roleTitle: trimmed(2, 120, "Role / trade"),
  sector: z.enum(SECTORS, { error: "Choose a sector" }),
  originCountryCode: z.enum(
    COUNTRIES.map((c) => c.code) as [string, ...string[]],
    { error: "Choose a country" },
  ),
  yearsExperience: intField("Years of experience", 0, 60),
  // Omitted once Pinnacle has taken over verification (field is disabled).
  passTrack: z.enum(PASS_TRACKS, { error: "Choose a pass type" }).optional(),
  summary: optionalText(2000),
});

export const employerProfileSchema = z.object({
  companyName: trimmed(2, 160, "Company name"),
  industry: trimmed(2, 120, "Industry"),
  contactName: trimmed(2, 120, "Contact name"),
  contactEmail: z.string().trim().email("Enter a valid email"),
});

export const applicationSchema = z.object({
  jobListingId: z.string().uuid(),
  message: optionalText(2000),
});

export const introductionUpdateSchema = z.object({
  id: z.string().uuid(),
  stage: z.enum(INTRODUCTION_STAGES),
  commissionStatus: z.enum(COMMISSION_STATUSES),
  commissionAmount: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || /^\d{1,10}(\.\d{1,2})?$/.test(v), {
      message: "Enter an amount like 1500 or 1500.00",
    }),
  notes: optionalText(5000),
});

export const workerStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(WORKER_STATUSES),
  passTrack: z.enum(PASS_TRACKS),
});

/** Turn a zod error into the first message per field. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export function formObject(formData: FormData) {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}
