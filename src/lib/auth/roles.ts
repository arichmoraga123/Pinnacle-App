export const USER_ROLES = ["employer", "worker", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const SIGNUP_ROLES = ["employer", "worker"] as const;

export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const ROLE_HOME: Record<UserRole, string> = {
  employer: "/employer/browse",
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
