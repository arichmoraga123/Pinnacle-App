import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { db } from "@/db";
import { admins, employers, workers } from "@/db/schema";
import {
  isSignupRole,
  isUserRole,
  type UserRole,
} from "@/lib/auth/roles";

function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function displayName(data: {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}) {
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  return name || data.username || "New User";
}

function resolveRole(data: {
  public_metadata: Record<string, unknown> | null;
  unsafe_metadata: Record<string, unknown> | null;
}): UserRole | null {
  // Admins are provisioned manually with publicMetadata.role already set.
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
      companyName: "Company pending",
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
      roleTitle: "Profile pending",
      sector: "Construction",
      originCountry: "Pending",
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
      const role = resolveRole(evt.data);

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
