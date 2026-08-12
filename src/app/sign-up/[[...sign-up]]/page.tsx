"use client";

import { SignUp } from "@clerk/nextjs";
import { useState } from "react";

import type { SignupRole } from "@/lib/auth/roles";

const ROLE_OPTIONS: Array<{
  role: SignupRole;
  title: string;
  description: string;
}> = [
  {
    role: "employer",
    title: "Employer",
    description: "Hire verified talent for your Singapore operations.",
  },
  {
    role: "worker",
    title: "Worker",
    description: "Create a profile and get introduced to employers.",
  },
];

export default function SignUpPage() {
  const [role, setRole] = useState<SignupRole | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-paper px-4 py-12">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-teal">
          Create account
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          Join Pinnacle
        </h1>
        <p className="mt-2 text-sm text-graphite">
          {role
            ? `Signing up as ${role === "employer" ? "an employer" : "a worker"}.`
            : "Choose how you will use Pinnacle. Admin accounts are provisioned by Pinnacle staff."}
        </p>
      </div>

      {!role ? (
        <div className="grid w-full max-w-md gap-3">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.role}
              type="button"
              onClick={() => setRole(option.role)}
              className="rounded-lg border border-ink/10 bg-white px-5 py-4 text-left transition hover:border-teal/40 hover:bg-teal/5"
            >
              <span className="block font-display text-lg font-semibold text-ink">
                {option.title}
              </span>
              <span className="mt-1 block text-sm text-graphite">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => setRole(null)}
            className="text-sm text-teal underline-offset-2 hover:underline"
          >
            Change role
          </button>
          <SignUp
            forceRedirectUrl="/after-auth"
            fallbackRedirectUrl="/after-auth"
            signInUrl="/sign-in"
            unsafeMetadata={{ role }}
          />
        </div>
      )}
    </main>
  );
}
