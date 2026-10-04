import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { db } from "@/db";
import { admins, employers, workers } from "@/db/schema";
import { isSignupRole, isUserRole, type UserRole } from "@/lib/auth/roles";
import {
  hasAdminEmail,
  verifiedEmailsOfPayload,
} from "@/lib/auth/admin-emails";
import { initialsFromName } from "@/lib/format";
import {
  PENDING_COMPANY,
  PENDING_COUNTRY,
  PENDING_ROLE_TITLE,
} from "@/lib/profile";

function displayName(data: {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}) {
  const name = [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || data.username || "New User";
}

async function resolveRole(data: {
  public_metadata: Record<string, unknown> | null;
  unsafe_metadata: Record<string, unknown> | null;
  email_addresses: Array<{
    email_address: string;
    verification: { status: string } | null;
  }>;
}): Promise<UserRole | null> {
  // Staff: a verified email on the admin list (managed at /admin/team).
  if (await hasAdminEmail(verifiedEmailsOfPayload(data))) return "admin";

  // Admins can also be provisioned with publicMetadata.role already set.
  const publicRole = data.public_metadata?.role;
  if (isUserRole(publicRole)) return publicRole;

  // Self-signup may only choose employer/worker via unsafeMetadata.
  const unsafeRole = data.unsafe_metadata?.role;
  if (isSignupRole(unsafeRole)) return unsafeRole;

  return null;
}

async function ensureProfileRow(
  role: UserRole,
  clerkUserId: string,
  data: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    email_addresses: Array<{ id: string; email_address: string }>;
    primary_email_address_id: string | null;
  },
) {
  const name = displayName(data);
  const email =
    data.email_addresses.find((e) => e.id === data.primary_email_address_id)
      ?.email_address ??
    data.email_addresses[0]?.email_address ??
    "";

  if (role === "employer") {
    const existing = await db.query.employers.findFirst({
      where: eq(employers.clerkUserId, clerkUserId),
    });
    if (existing) return;

    await db.insert(employers).values({
      clerkUserId,
      companyName: PENDING_COMPANY,
      industry: "Pending",
      contactName: name,
      contactEmail: email || "pending@example.com",
    });
    return;
  }

  if (role === "worker") {
    const existing = await db.query.workers.findFirst({
      where: eq(workers.clerkUserId, clerkUserId),
    });
    if (existing) return;

    await db.insert(workers).values({
      clerkUserId,
      fullName: name,
      initials: initialsFromName(name),
      email: email || null,
      roleTitle: PENDING_ROLE_TITLE,
      sector: "Construction",
      originCountry: PENDING_COUNTRY,
      originCountryCode: "XXX",
      yearsExperience: 0,
      passTrack: "In Verification",
      status: "Available",
    });
    return;
  }

  const existing = await db.query.admins.findFirst({
    where: eq(admins.clerkUserId, clerkUserId),
  });
  if (existing) return;

  await db.insert(admins).values({
    clerkUserId,
    name,
    role: "Pinnacle Staff",
  });
}

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created") {
      const role = await resolveRole(evt.data);

      if (!role) {
        console.warn(
          `Clerk user.created for ${evt.data.id} had no role in metadata; skipping profile creation.`,
        );
        return new Response("No role on user", { status: 200 });
      }

      await ensureProfileRow(role, evt.data.id, evt.data);

      const client = await clerkClient();
      await client.users.updateUserMetadata(evt.data.id, {
        publicMetadata: { role },
      });
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying Clerk webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
