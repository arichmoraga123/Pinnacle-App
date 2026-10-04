"use client";

import { useFormState } from "react-dom";

import {
  FileField,
  PHOTO_ACCEPT,
  RESUME_ACCEPT,
} from "@/components/file-input";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/form";
import type { FormState } from "@/lib/validation";

export function ApplyForm({
  action,
  jobListingId,
  hasResume,
  hasPhoto,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  jobListingId: string;
  hasResume: boolean;
  hasPhoto: boolean;
}) {
  const [state, formAction] = useFormState(action, {});
  const err = state.fieldErrors ?? {};

  if (state.ok) return <FormMessage state={state} />;

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="jobListingId" value={jobListingId} />
      <FileField
        label="Resume / CV"
        name="resume"
        accept={RESUME_ACCEPT}
        hasExisting={hasResume}
        error={err.resume}
        hint="PDF, Word or a photo of it. Max 4 MB."
      />
      <FileField
        label="Recent photo"
        name="photo"
        accept={PHOTO_ACCEPT}
        hasExisting={hasPhoto}
        error={err.photo}
        hint="A clear, recent photo of yourself. Max 4 MB."
      />
      <Field
        label="Message to Pinnacle (optional)"
        name="message"
        hint="Why you're a good fit, availability, anything we should know."
      >
        <TextArea name="message" rows={3} />
      </Field>
      <FormMessage state={state} />
      <div>
        <SubmitButton variant="accent" pendingLabel="Sending…">
          Apply for this job
        </SubmitButton>
      </div>
    </form>
  );
}
