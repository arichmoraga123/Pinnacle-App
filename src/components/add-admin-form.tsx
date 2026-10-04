"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";

import { Field, FormMessage, SubmitButton, TextInput } from "@/components/form";
import type { FormState } from "@/lib/validation";

export function AddAdminForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useFormState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="grid gap-3">
      <Field
        label="Email address"
        name="email"
        error={state.fieldErrors?.email}
      >
        <TextInput
          name="email"
          type="email"
          placeholder="name@pinnaclerecruit.sg"
          required
        />
      </Field>
      <FormMessage state={state} />
      <div>
        <SubmitButton pendingLabel="Adding…">Add admin</SubmitButton>
      </div>
    </form>
  );
}
