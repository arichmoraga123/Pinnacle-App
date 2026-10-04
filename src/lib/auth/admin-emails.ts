import "server-only";

import { inArray } from "drizzle-orm";

import { db } from "@/db";
import { adminEmails } from "@/db/schema";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * True when any of the given (already verified) addresses is on the admin
 * list. Callers must only pass verified emails, or anyone could claim one.
 */
export async function hasAdminEmail(verifiedEmails: string[]) {
  const emails = verifiedEmails.map(normalizeEmail).filter(Boolean);
  if (emails.length === 0) return false;
  const [match] = await db
    .select({ id: adminEmails.id })
    .from(adminEmails)
    .where(inArray(adminEmails.email, emails))
    .limit(1);
  return Boolean(match);
}

/** Verified addresses from a Clerk backend `User`. */
export function verifiedEmailsOf(user: {
  emailAddresses: Array<{
    emailAddress: string;
    verification: { status: string } | null;
  }>;
}) {
  return user.emailAddresses
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress);
}

/** Verified addresses from a Clerk webhook payload. */
export function verifiedEmailsOfPayload(data: {
  email_addresses: Array<{
    email_address: string;
    verification: { status: string } | null;
  }>;
}) {
  return data.email_addresses
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.email_address);
}
