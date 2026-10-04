import "server-only";

import { fieldErrors, formObject, jobListingSchema } from "@/lib/validation";

export function parseJobForm(formData: FormData) {
  const parsed = jobListingSchema.safeParse({
    ...formObject(formData),
    passTracksAccepted: formData.getAll("passTracksAccepted"),
  });
  if (!parsed.success) {
    return {
      error: {
        message: "Please fix the highlighted fields.",
        fieldErrors: fieldErrors(parsed.error),
      },
    } as const;
  }
  return { data: parsed.data } as const;
}
