"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

import {
  isSignupRole,
  isUserRole,
  type UserRole,
} from "@/lib/auth/roles";

export async function ensureRoleMetadata(): Promise<UserRole | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const publicRole = user.publicMetadata?.role;
  if (isUserRole(publicRole)) return publicRole;

  // Never promote admin from client-writable unsafeMetadata.
  const unsafeRole = user.unsafeMetadata?.role;
  if (!isSignupRole(unsafeRole)) return null;

  const client = await clerkClient();
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: { role: unsafeRole },
  });

  return unsafeRole;
}
