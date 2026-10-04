/**
 * Promote an existing Clerk user to Pinnacle staff (admin).
 *
 *   npm run make-admin -- someone@example.com
 *
 * The person must have signed up first. Their admins row is created on their
 * next visit to /admin.
 */
import { createClerkClient } from "@clerk/backend";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const email = process.argv[2]?.trim();
  if (!email) {
    throw new Error("Usage: npm run make-admin -- someone@example.com");
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not set in .env.local");

  const clerk = createClerkClient({ secretKey });
  const { data: users } = await clerk.users.getUserList({
    emailAddress: [email],
  });
  const user = users[0];
  if (!user) {
    throw new Error(`No Clerk user with email ${email}. Sign up first.`);
  }

  await clerk.users.updateUserMetadata(user.id, {
    publicMetadata: { role: "admin" },
  });

  console.log(
    `${email} is now Pinnacle staff. Sign out and back in to pick up the new role.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
