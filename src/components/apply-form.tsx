"use client";

import { useFormState } from "react-dom";

import { Field, FormMessage, SubmitButton, TextArea } from "@/components/form";
import type { FormState } from "@/lib/validation";

export function ApplyForm({
  action,
  jobListingId,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  jobListingId: string;
}) {
  const [state, formAction] = useFormState(action, {});

  if (state.ok) return <FormMessage state={state} />;

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="jobListingId" value={jobListingId} />
      <Field
        label="Message to Pinnacle (optional)"
        name="message"
        hint="Why you're a good fit, availability, anything we should know."
      >
        <TextArea name="message" rows={4} />
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
