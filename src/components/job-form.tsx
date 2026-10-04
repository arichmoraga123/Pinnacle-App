"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";

import {
  Field,
  FormMessage,
  MultiSelect,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/form";
import type { JobListing } from "@/db/schema";
import { posterUrl } from "@/lib/format";
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
  /**
   * Admin only: choose which client company the job belongs to, and show the
   * job code and poster fields.
   */
  employers?: Array<{ id: string; companyName: string }>;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, {});
  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5">
      {job ? <input type="hidden" name="id" value={job.id} /> : null}

      {employers ? (
        <>
          <PosterField job={job} error={err.poster} />
          <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
            <Field
              label="Client company"
              name="employerId"
              error={err.employerId}
            >
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
            <Field
              label="Job code"
              name="jobCode"
              error={err.jobCode}
              hint="As on the poster, e.g. PS0015"
            >
              <TextInput
                name="jobCode"
                defaultValue={job?.jobCode ?? ""}
                placeholder="PS0015"
                className="uppercase"
              />
            </Field>
          </div>
        </>
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
          label="Work passes accepted"
          name="passTracksAccepted"
          error={err.passTracksAccepted}
          hint="Tick every pass this role can be hired under."
        >
          <MultiSelect
            name="passTracksAccepted"
            options={options.passTracks}
            defaultValue={job?.passTracksAccepted ?? []}
            placeholder="Select passes…"
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
          hint="Leave blank for “attractive package”"
          error={err.salaryRangeMin}
        >
          <TextInput
            name="salaryRangeMin"
            type="number"
            min={0}
            defaultValue={job?.salaryRangeMin ?? ""}
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
            defaultValue={job?.salaryRangeMax ?? ""}
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

function PosterField({ job, error }: { job?: JobListing; error?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const current = job?.posterKey && !remove ? posterUrl(job.posterKey) : null;
  const shown = preview ?? current;

  return (
    <Field
      label="Poster image"
      name="poster"
      error={error}
      hint="JPG, PNG or WebP up to 4 MB. Shown on the job board; clicking it opens the application."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="grid aspect-[4/5] w-40 shrink-0 place-items-center overflow-hidden rounded-md border border-dashed border-ink/20 bg-paper">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt="Poster preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="px-3 text-center text-xs text-graphite/60">
              No poster
            </span>
          )}
        </div>
        <div className="grid gap-2">
          <input
            id="poster"
            name="poster"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-graphite"
          />
          {job?.posterKey ? (
            <label className="flex items-center gap-2 text-sm text-graphite">
              <input
                type="checkbox"
                name="removePoster"
                checked={remove}
                onChange={(e) => setRemove(e.target.checked)}
              />
              Remove current poster
            </label>
          ) : null}
        </div>
      </div>
    </Field>
  );
}
