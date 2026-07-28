import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ro } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getSessionsInRange } from "@/lib/data";
import { parseISODate, toISODate } from "@/lib/periods";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card, CardContent } from "@/components/ui/card";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

const MONTH_RE = /^\d{4}-\d{2}$/;
const WEEKDAYS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const ref =
    sp.month && MONTH_RE.test(sp.month)
      ? parseISODate(`${sp.month}-01`)
      : new Date();

  const monthStart = startOfMonth(ref);
  const monthEnd = endOfMonth(ref);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const role = (profile?.role ?? "viewer") as Role;
  const canEdit = role === "admin" || role === "operator";

  const sessions = await getSessionsInRange(
    toISODate(monthStart),
    toISODate(monthEnd),
  );
  const totalByDate = new Map<string, number>();
  for (const s of sessions) totalByDate.set(s.session_date, s.total_general);

  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const prevMonth = format(addMonths(ref, -1), "yyyy-MM");
  const nextMonth = format(addMonths(ref, 1), "yyyy-MM");
  const monthLabel = format(ref, "LLLL yyyy", { locale: ro });

  const navBtn =
    "grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500 capitalize">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${prevMonth}`}
            className={navBtn}
            aria-label="Luna anterioară"
          >
            ←
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            Azi
          </Link>
          <Link
            href={`/calendar?month=${nextMonth}`}
            className={navBtn}
            aria-label="Luna următoare"
          >
            →
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const iso = toISODate(day);
              const inMonth = isSameMonth(day, ref);
              const total = totalByDate.get(iso);
              const has = total !== undefined;
              const weekend = day.getDay() === 0 || day.getDay() === 6;

              const cell = (
                <div
                  className={cn(
                    "flex h-20 flex-col rounded-lg border p-2",
                    inMonth
                      ? "border-slate-200 bg-white"
                      : "border-transparent bg-slate-50/40",
                    has && inMonth && "border-blue-200 bg-blue-50/60",
                    isToday(day) && inMonth && "ring-2 ring-blue-400",
                    inMonth &&
                      (canEdit || has) &&
                      "transition-colors hover:border-blue-300",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs",
                      !inMonth
                        ? "text-slate-300"
                        : weekend
                          ? "text-slate-400"
                          : "text-slate-500",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {inMonth && has && (
                    <span className="mt-auto text-lg font-semibold text-blue-700 tabular-nums">
                      {formatNumber(total!)}
                    </span>
                  )}
                  {inMonth && !has && canEdit && (
                    <span className="mt-auto text-xs text-slate-300">+</span>
                  )}
                </div>
              );

              if (inMonth && (canEdit || has)) {
                const href = canEdit
                  ? `/introducere?date=${iso}`
                  : `/rapoarte?from=${iso}&to=${iso}`;
                return (
                  <Link key={iso} href={href}>
                    {cell}
                  </Link>
                );
              }
              return <div key={iso}>{cell}</div>;
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border border-blue-200 bg-blue-50" />
          zi cu date (numărul = total ședințe)
        </span>
        <span>
          {sessions.length}{" "}
          {sessions.length === 1 ? "zi completată" : "zile completate"} luna
          aceasta
        </span>
        {canEdit && <span>Apasă pe o zi pentru a introduce / edita.</span>}
      </div>
    </div>
  );
}
