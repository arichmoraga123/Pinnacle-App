import { asc, count, eq } from "drizzle-orm";
import type { Metadata } from "next";

import { createClientEmployer } from "@/app/admin/actions";
import { Container } from "@/components/container";
import { EmployerProfileForm } from "@/components/profile-forms";
import { Badge, Card, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { employers, jobListings } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Employers" };

export default async function AdminEmployersPage() {
  await requireAdmin();
  const rows = await db
    .select({
      employer: employers,
      jobs: count(jobListings.id),
    })
    .from(employers)
    .leftJoin(jobListings, eq(jobListings.employerId, employers.id))
    .groupBy(employers.id)
    .orderBy(asc(employers.companyName));

  return (
    <main>
      <Container className="grid max-w-6xl gap-6 py-10">
        <PageHeader
          eyebrow="Pinnacle staff"
          title="Client companies"
          description="Companies that signed up themselves, plus clients you manage on their behalf."
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wide text-graphite/70">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Jobs</th>
                  <th className="px-4 py-3">Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map(({ employer, jobs }) => (
                  <tr key={employer.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{employer.companyName}</p>
                      <p className="text-xs text-graphite/70">
                        {employer.industry} · since{" "}
                        {formatDate(employer.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{employer.contactName}</p>
                      <a
                        href={`mailto:${employer.contactEmail}`}
                        className="text-xs text-teal hover:underline"
                      >
                        {employer.contactEmail}
                      </a>
                    </td>
                    <td className="px-4 py-3">{jobs}</td>
                    <td className="px-4 py-3">
                      {employer.clerkUserId ? (
                        <Badge tone="teal">Self-serve</Badge>
                      ) : (
                        <Badge>Managed</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card className="h-fit">
            <h2 className="font-display text-lg font-semibold">
              Add a client company
            </h2>
            <p className="mt-1 text-sm text-graphite">
              For clients who send you roles directly. They don&apos;t need a
              login.
            </p>
            <div className="mt-4">
              <EmployerProfileForm
                action={createClientEmployer}
                submitLabel="Add company"
                resetOnSuccess
              />
            </div>
          </Card>
        </div>
      </Container>
    </main>
  );
}
