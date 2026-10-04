"use client";

import { useFormState } from "react-dom";

import {
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/form";
import type { FormState } from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function IntroductionEditor({
  action,
  introduction,
  stages,
  commissionStatuses,
}: {
  action: Action;
  introduction: {
    id: string;
    stage: string;
    commissionStatus: string;
    commissionAmount: string | null;
    notes: string | null;
  };
  stages: readonly string[];
  commissionStatuses: readonly string[];
}) {
  const [state, formAction] = useFormState(action, {});
  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="id" value={introduction.id} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Stage" name={`stage-${introduction.id}`}>
          <Select
            name="stage"
            id={`stage-${introduction.id}`}
            defaultValue={introduction.stage}
            options={stages}
          />
        </Field>
        <Field
          label="Commission (SGD)"
          name={`amount-${introduction.id}`}
          error={err.commissionAmount}
        >
          <TextInput
            name="commissionAmount"
            id={`amount-${introduction.id}`}
            inputMode="decimal"
            defaultValue={introduction.commissionAmount ?? ""}
            placeholder="0.00"
          />
        </Field>
        <Field label="Commission status" name={`cs-${introduction.id}`}>
          <Select
            name="commissionStatus"
            id={`cs-${introduction.id}`}
            defaultValue={introduction.commissionStatus}
            options={commissionStatuses}
          />
        </Field>
      </div>
      <Field label="Internal notes" name={`notes-${introduction.id}`}>
        <TextArea
          name="notes"
          id={`notes-${introduction.id}`}
          rows={2}
          defaultValue={introduction.notes ?? ""}
          placeholder="Only Pinnacle staff can see these notes."
        />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton variant="secondary">Update</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function WorkerStatusForm({
  action,
  worker,
  statuses,
  passTracks,
}: {
  action: Action;
  worker: { id: string; status: string; passTrack: string };
  statuses: readonly string[];
  passTracks: readonly string[];
}) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={worker.id} />
      <Select
        name="status"
        id={`status-${worker.id}`}
        aria-label="Worker status"
        defaultValue={worker.status}
        options={statuses}
        className="w-auto"
      />
      <Select
        name="passTrack"
        id={`pass-${worker.id}`}
        aria-label="Pass track"
        defaultValue={worker.passTrack}
        options={passTracks}
        className="w-auto"
      />
      <SubmitButton variant="secondary" className="px-3 py-1.5">
        Save
      </SubmitButton>
      {state.message ? (
        <span
          className={state.ok ? "text-xs text-teal" : "text-xs text-stampRed"}
        >
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
