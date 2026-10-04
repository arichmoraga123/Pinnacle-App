import { SubmitButton } from "@/components/form";

/** Small inline forms to pause, close or reactivate a listing. */
export function JobStatusButtons({
  action,
  jobId,
  status,
}: {
  action: (formData: FormData) => Promise<void>;
  jobId: string;
  status: string;
}) {
  const targets =
    status === "Active"
      ? [
          { status: "Paused", label: "Pause" },
          { status: "Closed", label: "Close" },
        ]
      : [{ status: "Active", label: "Reactivate" }];

  return (
    <div className="flex gap-2">
      {targets.map((t) => (
        <form key={t.status} action={action}>
          <input type="hidden" name="id" value={jobId} />
          <input type="hidden" name="status" value={t.status} />
          <SubmitButton
            variant={t.status === "Closed" ? "danger" : "secondary"}
            pendingLabel="…"
            className="px-3 py-1 text-xs"
          >
            {t.label}
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}
