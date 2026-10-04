"use client";

import { Field } from "@/components/form";

export const RESUME_ACCEPT =
  "application/pdf,.pdf,.doc,.docx,image/jpeg,image/png,image/webp";
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";

export function FileField({
  label,
  name,
  accept,
  hasExisting,
  existingHref,
  error,
  hint,
}: {
  label: string;
  name: string;
  accept: string;
  hasExisting: boolean;
  existingHref?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <Field
      label={label}
      name={name}
      error={error}
      hint={
        hasExisting
          ? "Already on file. Choose a new file only to replace it."
          : hint
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={name}
          name={name}
          type="file"
          accept={accept}
          className="min-w-0 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-ink/15"
        />
        {hasExisting && existingHref ? (
          <a
            href={existingHref}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-teal hover:underline"
          >
            View current
          </a>
        ) : null}
      </div>
    </Field>
  );
}
