import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { saveAdminJob } from "@/app/admin/actions";
import { Container } from "@/components/container";
import { JobForm } from "@/components/job-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { isUuid } from "@/db/queries";
import { employers, jobListings } from "@/db/schema";
import { JOB_FORM_OPTIONS } from "@/lib/job-form-options";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Edit job" };

export default async function AdminEditJobPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  if (!isUuid(params.id)) notFound();
  const [job, companies] = await Promise.all([
    db.query.jobListings.findFirst({ where: eq(jobListings.id, params.id) }),
    db
      .select({ id: employers.id, companyName: employers.companyName })
      .from(employers)
      .orderBy(asc(employers.companyName)),
  ]);
  if (!job) notFound();

  return (
    <main>
      <Container className="grid max-w-3xl gap-6 py-10">
        <Link href="/admin/jobs" className="text-sm text-teal hover:underline">
          ← All jobs
        </Link>
        <PageHeader eyebrow="Edit job" title={job.roleTitle} />
        <Card>
          <JobForm
            action={saveAdminJob}
            job={job}
            employers={companies}
            options={JOB_FORM_OPTIONS}
            submitLabel="Save changes"
          />
        </Card>
      </Container>
    </main>
  );
}
