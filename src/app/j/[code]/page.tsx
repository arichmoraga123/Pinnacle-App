import { notFound, redirect } from "next/navigation";

import { getPublicJobByCode } from "@/db/queries";

/** Short link for posters and social posts: /j/PS0015 → the application. */
export default async function JobCodeRedirect({
  params,
}: {
  params: { code: string };
}) {
  const job = await getPublicJobByCode(decodeURIComponent(params.code));
  if (!job) notFound();
  redirect(`/jobs/${job.id}#apply`);
}
