export const USER_ROLES = ["employer", "worker", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const SIGNUP_ROLES = ["employer", "worker"] as const;

export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const ROLE_HOME: Record<UserRole, string> = {
  employer: "/employer/jobs",
  worker: "/worker/browse",
  admin: "/admin/pipeline",
};

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

export function isSignupRole(value: unknown): value is SignupRole {
  return (
    typeof value === "string" &&
    (SIGNUP_ROLES as readonly string[]).includes(value)
  );
}

export function getRoleHome(role: UserRole): string {
  return ROLE_HOME[role];
}

/**
 * Where to send someone after sign-in/up when they started from a job
 * (e.g. tapped a poster). Only same-site job pages are allowed.
 */
export function safeNextPath(value: string | null | undefined) {
  if (!value || !/^\/jobs\/[0-9a-f-]{36}(#apply)?$/i.test(value)) return null;
  return value;
}

export function afterAuthUrl(next: string | null | undefined) {
  const safe = safeNextPath(next);
  return safe ? `/after-auth?next=${encodeURIComponent(safe)}` : "/after-auth";
}
