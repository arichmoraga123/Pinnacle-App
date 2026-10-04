import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { saveEmployerJob } from "@/app/employer/actions";
import { Container } from "@/components/container";
import { JobForm } from "@/components/job-form";
import { Card, PageHeader } from "@/components/ui";
import { JOB_FORM_OPTIONS } from "@/lib/job-form-options";
import { isEmployerProfileComplete } from "@/lib/profile";
import { requireEmployer } from "@/lib/session";

export const metadata: Metadata = { title: "Post a job" };

export default async function NewEmployerJobPage() {
  const employer = await requireEmployer();
  if (!isEmployerProfileComplete(employer)) redirect("/employer/profile");

  return (
    <main>
      <Container className="grid max-w-3xl gap-6 py-10">
        <PageHeader
          eyebrow={employer.companyName}
          title="Post a job"
          description="Your company name is kept private. Workers see the role, your industry and the terms below; Pinnacle handles introductions."
        />
        <Card>
          <JobForm
            action={saveEmployerJob}
            options={JOB_FORM_OPTIONS}
            submitLabel="Publish job"
          />
        </Card>
      </Container>
    </main>
  );
}
