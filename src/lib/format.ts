export function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatSalary(listing: {
  salaryRangeMin: number;
  salaryRangeMax: number;
  currency: string;
}) {
  const fmt = new Intl.NumberFormat("en-SG");
  return `${listing.currency} ${fmt.format(listing.salaryRangeMin)}–${fmt.format(listing.salaryRangeMax)} / mo`;
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
