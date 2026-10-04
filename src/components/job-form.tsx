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
import type { JobListing } from "@/db/schema";
import type { FormState } from "@/lib/validation";

export type JobFormOptions = {
  sectors: readonly string[];
  passTracks: readonly string[];
  urgencies: readonly string[];
  statuses: readonly string[];
  currencies: readonly string[];
};

export function JobForm({
  action,
  job,
  options,
  employers,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  job?: JobListing;
  options: JobFormOptions;
  /** Admin only: choose which client company the job belongs to. */
  employers?: Array<{ id: string; companyName: string }>;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, {});
  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5">
      {job ? <input type="hidden" name="id" value={job.id} /> : null}

      {employers ? (
        <Field label="Client company" name="employerId" error={err.employerId}>
          <Select
            name="employerId"
            defaultValue={job?.employerId ?? ""}
            placeholder="Select a company…"
            options={employers.map((e) => ({
              value: e.id,
              label: e.companyName,
            }))}
            required
          />
        </Field>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Role title" name="roleTitle" error={err.roleTitle}>
          <TextInput
            name="roleTitle"
            defaultValue={job?.roleTitle}
            placeholder="e.g. Senior Welder"
            required
          />
        </Field>
        <Field label="Location" name="location" error={err.location}>
          <TextInput
            name="location"
            defaultValue={job?.location ?? "Singapore"}
            placeholder="e.g. Jurong, Singapore"
            required
          />
        </Field>
        <Field label="Sector" name="sector" error={err.sector}>
          <Select
            name="sector"
            defaultValue={job?.sector ?? ""}
            placeholder="Select…"
            options={options.sectors}
            required
          />
        </Field>
        <Field
          label="Pass type"
          name="passTrackRequired"
          error={err.passTrackRequired}
          hint="The work pass this role will be hired under."
        >
          <Select
            name="passTrackRequired"
            defaultValue={job?.passTrackRequired ?? ""}
            placeholder="Select…"
            options={options.passTracks}
            required
          />
        </Field>
      </div>

      <Field
        label="Description"
        name="description"
        error={err.description}
        hint="Duties, requirements, working hours, accommodation, benefits."
      >
        <TextArea
          name="description"
          rows={8}
          defaultValue={job?.description}
          placeholder="Describe the role, requirements and benefits…"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-4">
        <Field label="Currency" name="currency" error={err.currency}>
          <Select
            name="currency"
            defaultValue={job?.currency ?? "SGD"}
            options={options.currencies}
          />
        </Field>
        <Field
          label="Salary min / month"
          name="salaryRangeMin"
          error={err.salaryRangeMin}
        >
          <TextInput
            name="salaryRangeMin"
            type="number"
            min={0}
            defaultValue={job?.salaryRangeMin}
            required
          />
        </Field>
        <Field
          label="Salary max / month"
          name="salaryRangeMax"
          error={err.salaryRangeMax}
        >
          <TextInput
            name="salaryRangeMax"
            type="number"
            min={0}
            defaultValue={job?.salaryRangeMax}
            required
          />
        </Field>
        <Field label="Openings" name="headcount" error={err.headcount}>
          <TextInput
            name="headcount"
            type="number"
            min={1}
            defaultValue={job?.headcount ?? 1}
            required
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Urgency" name="urgency" error={err.urgency}>
          <Select
            name="urgency"
            defaultValue={job?.urgency ?? "Open"}
            options={options.urgencies}
          />
        </Field>
        <Field
          label="Listing status"
          name="status"
          error={err.status}
          hint="Only active listings are shown to workers."
        >
          <Select
            name="status"
            defaultValue={job?.status ?? "Active"}
            options={options.statuses}
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
