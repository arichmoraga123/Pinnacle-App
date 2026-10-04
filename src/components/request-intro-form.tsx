"use client";

import { useFormState } from "react-dom";

import {
  FormMessage,
  Select,
  SubmitButton,
  TextInput,
} from "@/components/form";
import type { FormState } from "@/lib/validation";

export function RequestIntroForm({
  action,
  workerId,
  jobs,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  workerId: string;
  jobs: Array<{ id: string; roleTitle: string }>;
}) {
  const [state, formAction] = useFormState(action, {});

  if (state.ok) return <FormMessage state={state} />;

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="workerId" value={workerId} />
      <Select
        name="jobListingId"
        aria-label="Job"
        placeholder="For which job?"
        options={jobs.map((j) => ({ value: j.id, label: j.roleTitle }))}
        required
      />
      <TextInput
        name="message"
        aria-label="Note to Pinnacle"
        placeholder="Note to Pinnacle (optional)"
      />
      <FormMessage state={state} />
      <SubmitButton variant="secondary" pendingLabel="Requesting…">
        Request introduction
      </SubmitButton>
    </form>
  );
}
