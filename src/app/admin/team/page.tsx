import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { asc } from "drizzle-orm";
import type { Metadata } from "next";

import { addAdminEmail, removeAdminEmail } from "@/app/admin/actions";
import { AddAdminForm } from "@/components/add-admin-form";
import { Container } from "@/components/container";
import { SubmitButton } from "@/components/form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { adminEmails } from "@/db/schema";
import { normalizeEmail, verifiedEmailsOf } from "@/lib/auth/admin-emails";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Team" };

export default async function AdminTeamPage() {
  await requireAdmin();
  const rows = await db
    .select()
    .from(adminEmails)
    .orderBy(asc(adminEmails.createdAt));

  // Which listed emails already belong to a verified account (one API call).
  const client = await clerkClient();
  const { data: users } = rows.length
    ? await client.users.getUserList({
        emailAddress: rows.map((r) => r.email),
        limit: 100,
      })
    : { data: [] };
  const signedUp = new Set(
    users.flatMap((u) => verifiedEmailsOf(u).map(normalizeEmail)),
  );

  const me = await currentUser();
  const myEmails = new Set(me ? verifiedEmailsOf(me).map(normalizeEmail) : []);

  return (
    <main>
      <Container className="grid max-w-4xl gap-6 py-10">
        <PageHeader
          eyebrow="Pinnacle staff"
          title="Admin team"
          description="Everyone on this list gets full Pinnacle staff access: the pipeline, all jobs, employers and worker details. They sign up normally with this email and become an admin automatically."
        />
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wide text-graphite/70">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((row) => {
                  const isMe = myEmails.has(row.email);
                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold">
                          {row.email}
                          {isMe ? (
                            <span className="font-normal text-graphite">
                              {" "}
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-graphite/70">
                          Added {formatDate(row.createdAt)}
                          {row.addedBy ? ` by ${row.addedBy}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {signedUp.has(row.email) ? (
                          <Badge tone="teal">Active</Badge>
                        ) : (
                          <Badge tone="amber">Not signed up yet</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isMe && rows.length > 1 ? (
                          <form action={removeAdminEmail}>
                            <input type="hidden" name="id" value={row.id} />
                            <SubmitButton
                              variant="danger"
                              pendingLabel="Removing…"
                              className="px-3 py-1 text-xs"
                            >
                              Remove
                            </SubmitButton>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Card className="h-fit">
            <h2 className="font-display text-lg font-semibold">Add an admin</h2>
            <p className="mt-1 text-sm text-graphite">
              Only add people you trust: admins can see every worker&apos;s
              documents and contact details.
            </p>
            <div className="mt-4">
              <AddAdminForm action={addAdminEmail} />
            </div>
          </Card>
        </div>
      </Container>
    </main>
  );
}
