import type { Metadata } from "next";

import { saveWorkerProfile } from "@/app/worker/actions";
import { Container } from "@/components/container";
import { WorkerProfileForm } from "@/components/profile-forms";
import { ButtonLink, Card, Notice, PageHeader } from "@/components/ui";
import { COUNTRIES, PASS_TRACKS, SECTORS } from "@/lib/options";
import { isWorkerProfileComplete } from "@/lib/profile";
import { requireWorker } from "@/lib/session";

export const metadata: Metadata = { title: "My profile" };

export default async function WorkerProfilePage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const worker = await requireWorker();
  const complete = isWorkerProfileComplete(worker);
  const next = searchParams.next?.startsWith("/jobs/")
    ? searchParams.next
    : undefined;

  return (
    <main>
      <Container className="grid max-w-3xl gap-6 py-10">
        <PageHeader
          eyebrow="Worker profile"
          title={complete ? "My profile" : "Complete your profile"}
          description="Pinnacle uses this to match you with employers. Employers see only your initials, trade, experience and country until Pinnacle introduces you."
        />
        {complete && next ? (
          <Notice tone="teal">
            Profile complete.{" "}
            <ButtonLink href={next} variant="accent">
              Continue to the job
            </ButtonLink>
          </Notice>
        ) : null}
        <Card>
          <WorkerProfileForm
            action={saveWorkerProfile}
            worker={worker}
            sectors={SECTORS}
            passTracks={PASS_TRACKS}
            countries={COUNTRIES}
            isNew={!complete}
          />
        </Card>
      </Container>
    </main>
  );
}
