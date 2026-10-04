"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/validation";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  className,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: keyof typeof buttonClass;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonClass[variant], className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

const inputClass =
  "w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-graphite/40 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20";

export function Field({
  label,
  name,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={name}
        className="font-mono text-[11px] uppercase tracking-wide text-graphite"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-stampRed">{error}</p>
      ) : hint ? (
        <p className="text-xs text-graphite/70">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { name: string },
) {
  return (
    <input
      id={props.name}
      {...props}
      className={cn(inputClass, props.className)}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string },
) {
  return (
    <textarea
      id={props.name}
      rows={4}
      {...props}
      className={cn(inputClass, props.className)}
    />
  );
}

export function Select({
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  name: string;
  options: ReadonlyArray<string | { value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <select
      id={props.name}
      {...props}
      className={cn(inputClass, props.className)}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={cn(
        "rounded-md px-3 py-2 text-sm",
        state.ok ? "bg-teal/10 text-teal" : "bg-stampRed/10 text-stampRed",
      )}
    >
      {state.message}
    </p>
  );
}
