import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { admins, employers, workers } from "@/db/schema";
import { isUserRole, type UserRole } from "@/lib/auth/roles";
import { initialsFromName } from "@/lib/format";
import {
  PENDING_COMPANY,
  PENDING_COUNTRY,
  PENDING_ROLE_TITLE,
} from "@/lib/profile";

/**
 * Resolve the signed-in user's role from the session token, falling back to
 * Clerk's publicMetadata when the custom session claim is not configured.
 */
export async function getCurrentRole(): Promise<UserRole | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const claimRole = sessionClaims?.metadata?.role;
  if (isUserRole(claimRole)) return claimRole;

  const user = await currentUser();
  const metaRole = user?.publicMetadata?.role;
  return isUserRole(metaRole) ? metaRole : null;
}

async function requireRole(role: UserRole) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const current = await getCurrentRole();
  if (current !== role) redirect("/after-auth");

  return userId;
}

async function clerkProfile() {
  const user = await currentUser();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "New User";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  return { name, email };
}

/**
 * The Clerk webhook normally creates profile rows, but it may be missing
 * (local dev, delayed delivery), so pages create the row on first visit.
 */
export async function requireWorker() {
  const userId = await requireRole("worker");

  const existing = await db.query.workers.findFirst({
    where: eq(workers.clerkUserId, userId),
  });
  if (existing) return existing;

  const { name, email } = await clerkProfile();
  const [created] = await db
    .insert(workers)
    .values({
      clerkUserId: userId,
      fullName: name,
      initials: initialsFromName(name),
      email: email || null,
      roleTitle: PENDING_ROLE_TITLE,
      sector: "Construction",
      originCountry: PENDING_COUNTRY,
      originCountryCode: "XXX",
      yearsExperience: 0,
      passTrack: "In Verification",
    })
    .onConflictDoNothing()
    .returning();

  return (
    created ??
    (await db.query.workers.findFirst({
      where: eq(workers.clerkUserId, userId),
    }))!
  );
}

export async function requireEmployer() {
  const userId = await requireRole("employer");

  const existing = await db.query.employers.findFirst({
    where: eq(employers.clerkUserId, userId),
  });
  if (existing) return existing;

  const { name, email } = await clerkProfile();
  const [created] = await db
    .insert(employers)
    .values({
      clerkUserId: userId,
      companyName: PENDING_COMPANY,
      industry: "Pending",
      contactName: name,
      contactEmail: email || "pending@example.com",
    })
    .onConflictDoNothing()
    .returning();

  return (
    created ??
    (await db.query.employers.findFirst({
      where: eq(employers.clerkUserId, userId),
    }))!
  );
}

export async function requireAdmin() {
  const userId = await requireRole("admin");

  const existing = await db.query.admins.findFirst({
    where: eq(admins.clerkUserId, userId),
  });
  if (existing) return existing;

  const { name } = await clerkProfile();
  const [created] = await db
    .insert(admins)
    .values({ clerkUserId: userId, name, role: "Pinnacle Staff" })
    .onConflictDoNothing()
    .returning();

  return (
    created ??
    (await db.query.admins.findFirst({
      where: eq(admins.clerkUserId, userId),
    }))!
  );
}
