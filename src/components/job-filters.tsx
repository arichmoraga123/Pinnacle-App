import { buttonClass } from "@/components/ui";
import { PASS_TRACKS, SECTORS } from "@/lib/options";

const selectClass =
  "rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none";

/** Plain GET form so filtering works without client JavaScript. */
export function JobFilters({
  action,
  values,
  showSearch = true,
  placeholder = "Search role, location or job code…",
}: {
  action: string;
  values: { q?: string; sector?: string; passTrack?: string };
  showSearch?: boolean;
  placeholder?: string;
}) {
  return (
    <form
      action={action}
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
    >
      {showSearch ? (
        <input
          type="search"
          name="q"
          defaultValue={values.q ?? ""}
          placeholder={placeholder}
          aria-label="Search"
          className={`${selectClass} sm:min-w-64 sm:flex-1`}
        />
      ) : null}
      <select
        name="sector"
        defaultValue={values.sector ?? ""}
        aria-label="Sector"
        className={selectClass}
      >
        <option value="">All sectors</option>
        {SECTORS.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <select
        name="passTrack"
        defaultValue={values.passTrack ?? ""}
        aria-label="Pass type"
        className={selectClass}
      >
        <option value="">Any pass type</option>
        {PASS_TRACKS.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <button type="submit" className={buttonClass.secondary}>
        Filter
      </button>
    </form>
  );
}

export function pickFilters(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };
  return { q: get("q"), sector: get("sector"), passTrack: get("passTrack") };
}
