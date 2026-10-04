import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { saveAdminJob } from "@/app/admin/actions";
import { Container } from "@/components/container";
import { JobForm } from "@/components/job-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { employers } from "@/db/schema";
import { JOB_FORM_OPTIONS } from "@/lib/job-form-options";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Post a job" };

export default async function AdminNewJobPage() {
  await requireAdmin();
  const companies = await db
    .select({ id: employers.id, companyName: employers.companyName })
    .from(employers)
    .orderBy(asc(employers.companyName));

  return (
    <main>
      <Container className="grid max-w-3xl gap-6 py-10">
        <PageHeader
          eyebrow="Pinnacle staff"
          title="Post a job for a client"
          description={
            <>
              Client company not listed?{" "}
              <Link href="/admin/employers" className="text-teal underline">
                Add it first
              </Link>
              .
            </>
          }
        />
        <Card>
          <JobForm
            action={saveAdminJob}
            employers={companies}
            options={JOB_FORM_OPTIONS}
            submitLabel="Publish job"
          />
        </Card>
      </Container>
    </main>
  );
}
