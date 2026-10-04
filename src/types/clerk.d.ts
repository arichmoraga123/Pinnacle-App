import type { UserRole } from "@/lib/auth/roles";

export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: UserRole;
    };
  }

  interface UserPublicMetadata {
    // null clears the role (Clerk removes keys set to null).
    role?: UserRole | null;
  }

  interface UserUnsafeMetadata {
    role?: UserRole;
  }
}
