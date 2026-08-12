import type { UserRole } from "@/lib/auth/roles";

export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: UserRole;
    };
  }

  interface UserPublicMetadata {
    role?: UserRole;
  }

  interface UserUnsafeMetadata {
    role?: UserRole;
  }
}
