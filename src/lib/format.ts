export function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatSalary(listing: {
  salaryRangeMin: number | null;
  salaryRangeMax: number | null;
  currency: string;
}) {
  const fmt = new Intl.NumberFormat("en-SG");
  const { salaryRangeMin: min, salaryRangeMax: max, currency } = listing;
  if (min != null && max != null && min !== max) {
    return `${currency} ${fmt.format(min)}–${fmt.format(max)} / mo`;
  }
  if (min != null && (max == null || max === min)) {
    return max === min
      ? `${currency} ${fmt.format(min)} / mo`
      : `From ${currency} ${fmt.format(min)} / mo`;
  }
  if (max != null) return `Up to ${currency} ${fmt.format(max)} / mo`;
  return "Attractive salary package";
}

export function formatPasses(passes: readonly string[]) {
  return passes.length ? passes.join(" / ") : "—";
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMoney(amount: string | null, currency = "SGD") {
  if (amount == null) return "—";
  return `${currency} ${new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount))}`;
}

export function posterUrl(posterKey: string) {
  return `/files/${posterKey}`;
}

export function workerFileUrl(workerId: string, kind: "resume" | "photo") {
  return `/files/workers/${workerId}/${kind}`;
}

/** wa.me click-to-chat link, or null when the number is unusable. */
export function whatsappUrl(phone: string | null, text?: string) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (digits.length < 8) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}
