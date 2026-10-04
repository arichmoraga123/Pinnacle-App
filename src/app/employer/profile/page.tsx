import type { Metadata } from "next";

import { saveEmployerProfile } from "@/app/employer/actions";
import { Container } from "@/components/container";
import { EmployerProfileForm } from "@/components/profile-forms";
import { Card, PageHeader } from "@/components/ui";
import { requireEmployer } from "@/lib/session";

export const metadata: Metadata = { title: "Company profile" };

export default async function EmployerProfilePage() {
  const employer = await requireEmployer();

  return (
    <main>
      <Container className="grid max-w-3xl gap-6 py-10">
        <PageHeader
          eyebrow="Employer"
          title="Company profile"
          description="Only Pinnacle sees your company name and contact details. Workers see your industry."
        />
        <Card>
          <EmployerProfileForm
            action={saveEmployerProfile}
            employer={employer}
          />
        </Card>
      </Container>
    </main>
  );
}
