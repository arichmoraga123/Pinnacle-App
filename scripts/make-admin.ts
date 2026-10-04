/**
 * Add someone to the Pinnacle admin list from the command line:
 *
 *   npm run make-admin -- someone@example.com
 *
 * Same as Admin → Team in the app. If they already have an account they are
 * promoted now; otherwise they become an admin when they sign up.
 */
import { createClerkClient } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";

import { adminEmails } from "../src/db/schema";

config({ path: ".env.local" });

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Usage: npm run make-admin -- someone@example.com");
  }

  const { DATABASE_URL, CLERK_SECRET_KEY } = process.env;
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not set in .env.local");
  if (!CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY is not set in .env.local");
  }

  const db = drizzle(neon(DATABASE_URL));
  await db
    .insert(adminEmails)
    .values({ email, addedBy: "make-admin script" })
    .onConflictDoNothing();

  const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
  const { data: users } = await clerk.users.getUserList({
    emailAddress: [email],
  });
  const verified = users.filter((u) =>
    u.emailAddresses.some(
      (e) =>
        e.emailAddress.toLowerCase() === email &&
        e.verification?.status === "verified",
    ),
  );

  for (const user of verified) {
    await clerk.users.updateUserMetadata(user.id, {
      publicMetadata: { role: "admin" },
    });
  }

  console.log(
    verified.length > 0
      ? `${email} is now Pinnacle staff. Sign out and back in to pick up the role.`
      : `${email} added to the admin list. They become an admin when they sign up.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
