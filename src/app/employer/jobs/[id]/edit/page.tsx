import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { saveEmployerJob } from "@/app/employer/actions";
import { Container } from "@/components/container";
import { JobForm } from "@/components/job-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/db";
import { isUuid } from "@/db/queries";
import { jobListings } from "@/db/schema";
import { JOB_FORM_OPTIONS } from "@/lib/job-form-options";
import { requireEmployer } from "@/lib/session";

export const metadata: Metadata = { title: "Edit job" };

export default async function EditEmployerJobPage({
  params,
}: {
  params: { id: string };
}) {
  const employer = await requireEmployer();
  if (!isUuid(params.id)) notFound();
  const job = await db.query.jobListings.findFirst({
    where: and(
      eq(jobListings.id, params.id),
      eq(jobListings.employerId, employer.id),
    ),
  });
  if (!job) notFound();

  return (
    <main>
      <Container className="grid max-w-3xl gap-6 py-10">
        <PageHeader eyebrow="Edit job" title={job.roleTitle} />
        <Card>
          <JobForm
            action={saveEmployerJob}
            job={job}
            options={JOB_FORM_OPTIONS}
            submitLabel="Save changes"
          />
        </Card>
      </Container>
    </main>
  );
}
