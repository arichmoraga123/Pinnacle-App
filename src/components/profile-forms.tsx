"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";

import {
  FileField,
  PHOTO_ACCEPT,
  RESUME_ACCEPT,
} from "@/components/file-input";
import {
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/form";
import type { Employer, Worker } from "@/db/schema";
import { workerFileUrl } from "@/lib/format";
import type { FormState } from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function WorkerProfileForm({
  action,
  worker,
  sectors,
  passTracks,
  countries,
  isNew,
}: {
  action: Action;
  worker: Worker;
  sectors: readonly string[];
  passTracks: readonly string[];
  countries: ReadonlyArray<{ code: string; name: string }>;
  isNew: boolean;
}) {
  const [state, formAction] = useFormState(action, {});
  const err = state.fieldErrors ?? {};
  const knownCountry = countries.some(
    (c) => c.code === worker.originCountryCode,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="fullName" error={err.fullName}>
          <TextInput name="fullName" defaultValue={worker.fullName} required />
        </Field>
        <Field
          label="Country of origin"
          name="originCountryCode"
          error={err.originCountryCode}
        >
          <Select
            name="originCountryCode"
            defaultValue={knownCountry ? worker.originCountryCode : ""}
            placeholder="Select…"
            options={countries.map((c) => ({ value: c.code, label: c.name }))}
            required
          />
        </Field>
        <Field label="Email" name="email" error={err.email}>
          <TextInput
            name="email"
            type="email"
            defaultValue={worker.email ?? ""}
          />
        </Field>
        <Field
          label="Phone / WhatsApp"
          name="phone"
          error={err.phone}
          hint="Include country code, e.g. +63 917 123 4567"
        >
          <TextInput name="phone" defaultValue={worker.phone ?? ""} />
        </Field>
        <Field
          label="Your trade or role"
          name="roleTitle"
          error={err.roleTitle}
        >
          <TextInput
            name="roleTitle"
            defaultValue={isNew ? "" : worker.roleTitle}
            placeholder="e.g. Welder, Nurse, Chef"
            required
          />
        </Field>
        <Field label="Sector" name="sector" error={err.sector}>
          <Select
            name="sector"
            defaultValue={isNew ? "" : worker.sector}
            placeholder="Select…"
            options={sectors}
            required
          />
        </Field>
        <Field
          label="Years of experience"
          name="yearsExperience"
          error={err.yearsExperience}
        >
          <TextInput
            name="yearsExperience"
            type="number"
            min={0}
            max={60}
            defaultValue={worker.yearsExperience}
            required
          />
        </Field>
        <Field
          label="Work pass"
          name="passTrack"
          error={err.passTrack}
          hint={
            isNew
              ? "Not sure? Choose “In Verification” and Pinnacle will advise."
              : "Pinnacle updates this after verifying your documents."
          }
        >
          <Select
            name="passTrack"
            defaultValue={worker.passTrack}
            options={passTracks}
            disabled={!isNew}
            required
          />
        </Field>
      </div>
      <Field
        label="About you"
        name="summary"
        error={err.summary}
        hint="Skills, certifications, languages, previous employers."
      >
        <TextArea name="summary" rows={5} defaultValue={worker.summary ?? ""} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <FileField
          label="Resume / CV"
          name="resume"
          accept={RESUME_ACCEPT}
          hasExisting={Boolean(worker.resumeKey)}
          existingHref={workerFileUrl(worker.id, "resume")}
          error={err.resume}
          hint="PDF, Word or a photo of it. Max 4 MB."
        />
        <FileField
          label="Recent photo"
          name="photo"
          accept={PHOTO_ACCEPT}
          hasExisting={Boolean(worker.photoKey)}
          existingHref={workerFileUrl(worker.id, "photo")}
          error={err.photo}
          hint="A clear, recent photo. Max 4 MB."
        />
      </div>
      <FormMessage state={state} />
      <div>
        <SubmitButton>Save profile</SubmitButton>
      </div>
    </form>
  );
}

export function EmployerProfileForm({
  action,
  employer,
  submitLabel = "Save company details",
  resetOnSuccess = false,
}: {
  action: Action;
  employer?: Employer;
  submitLabel?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useFormState(action, {});
  const err = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  const isPending = employer?.companyName === "Company pending";

  useEffect(() => {
    if (resetOnSuccess && state.ok) formRef.current?.reset();
  }, [resetOnSuccess, state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company name" name="companyName" error={err.companyName}>
          <TextInput
            name="companyName"
            defaultValue={isPending ? "" : employer?.companyName}
            required
          />
        </Field>
        <Field label="Industry" name="industry" error={err.industry}>
          <TextInput
            name="industry"
            defaultValue={isPending ? "" : employer?.industry}
            placeholder="e.g. Construction"
            required
          />
        </Field>
        <Field label="Contact name" name="contactName" error={err.contactName}>
          <TextInput
            name="contactName"
            defaultValue={employer?.contactName}
            required
          />
        </Field>
        <Field
          label="Contact email"
          name="contactEmail"
          error={err.contactEmail}
        >
          <TextInput
            name="contactEmail"
            type="email"
            defaultValue={
              employer?.contactEmail === "pending@example.com"
                ? ""
                : employer?.contactEmail
            }
            required
          />
        </Field>
      </div>
      <FormMessage state={state} />
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
