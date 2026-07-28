import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";
import { ro } from "date-fns/locale";
import { computeIndicators } from "./calc";
import type { DailySession, Period } from "./types";

export interface DateRange {
  from: Date;
  to: Date;
}

/** Compute the [from, to] date range for a period, relative to `ref`. */
export function rangeForPeriod(period: Period, ref: Date = new Date()): DateRange {
  switch (period) {
    case "zi":
      return { from: startOfDay(ref), to: endOfDay(ref) };
    case "saptamana":
      return {
        from: startOfWeek(ref, { weekStartsOn: 1 }),
        to: endOfWeek(ref, { weekStartsOn: 1 }),
      };
    case "luna":
      return { from: startOfMonth(ref), to: endOfMonth(ref) };
    case "trimestru":
      return { from: startOfQuarter(ref), to: endOfQuarter(ref) };
    case "semestru": {
      const y = ref.getFullYear();
      const firstHalf = ref.getMonth() < 6;
      return firstHalf
        ? { from: new Date(y, 0, 1), to: endOfMonth(new Date(y, 5, 1)) }
        : { from: new Date(y, 6, 1), to: endOfMonth(new Date(y, 11, 1)) };
    }
    case "an":
      return { from: startOfYear(ref), to: endOfYear(ref) };
  }
}

/** Local-time YYYY-MM-DD (never shifts the day the way toISOString can). */
export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Parse a YYYY-MM-DD string as a local date (noon avoids TZ edge cases). */
export function parseISODate(s: string): Date {
  return new Date(`${s}T12:00:00`);
}

export function formatDateRo(d: Date | string): string {
  const date = typeof d === "string" ? parseISODate(d) : d;
  return format(date, "d MMMM yyyy", { locale: ro });
}

export function formatDateShortRo(d: Date | string): string {
  const date = typeof d === "string" ? parseISODate(d) : d;
  return format(date, "d MMM yyyy", { locale: ro });
}

export function rangeLabelRo(range: DateRange): string {
  return `${formatDateRo(range.from)} – ${formatDateRo(range.to)}`;
}

export interface ChartPoint {
  key: string;
  label: string;
  total: number;
  petrecute: number;
  amanate: number;
  teleconferinta: number;
  instanta: number;
}

/**
 * Bucket sessions for the trend chart. Long periods (semester, year) are
 * grouped by month; everything else stays daily.
 */
export function groupForChart(
  sessions: DailySession[],
  period: Period,
): ChartPoint[] {
  const byMonth = period === "an" || period === "semestru";
  const buckets = new Map<string, ChartPoint>();

  for (const s of sessions) {
    const d = parseISODate(s.session_date);
    const key = byMonth ? format(d, "yyyy-MM") : s.session_date;
    const label = byMonth
      ? format(d, "LLL yyyy", { locale: ro })
      : format(d, "d MMM", { locale: ro });

    const ind = computeIndicators(s);
    const cur =
      buckets.get(key) ??
      ({
        key,
        label,
        total: 0,
        petrecute: 0,
        amanate: 0,
        teleconferinta: 0,
        instanta: 0,
      } satisfies ChartPoint);

    cur.total += ind.total;
    cur.petrecute += ind.petrecute;
    cur.amanate += ind.amanate;
    cur.teleconferinta += ind.tcTotal;
    cur.instanta += ind.ijTotal;
    buckets.set(key, cur);
  }

  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
}
