import { createClient } from "@/lib/supabase/server";
import type { DailySession } from "./types";

/** Fetch the single row for a given day, or null if none exists yet. */
export async function getSessionByDate(
  date: string,
): Promise<DailySession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_sessions")
    .select("*")
    .eq("session_date", date)
    .maybeSingle();
  return (data as DailySession | null) ?? null;
}

/** Fetch all rows in an inclusive [from, to] date range, ascending. */
export async function getSessionsInRange(
  from: string,
  to: string,
): Promise<DailySession[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_sessions")
    .select("*")
    .gte("session_date", from)
    .lte("session_date", to)
    .order("session_date", { ascending: true });
  return (data as DailySession[] | null) ?? [];
}
