const nf = new Intl.NumberFormat("ro-RO");

export function formatNumber(n: number): string {
  return nf.format(n);
}

/** Share of `part` in `whole` as a Romanian-formatted percentage. */
export function pct(part: number, whole: number): string {
  if (!whole) return "0%";
  return new Intl.NumberFormat("ro-RO", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(part / whole);
}

/** Format a UTC timestamp as Chișinău-local date and time. */
export function formatDateTimeRo(iso: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Chisinau",
  }).format(new Date(iso));
}
