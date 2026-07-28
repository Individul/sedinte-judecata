import Link from "next/link";
import { subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getSessionByDate, getSessionsInRange } from "@/lib/data";
import { aggregate } from "@/lib/calc";
import {
  formatDateRo,
  groupForChart,
  rangeForPeriod,
  toISODate,
} from "@/lib/periods";
import { StatTile } from "@/components/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/charts/trend-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  const today = new Date();
  const todayISO = toISODate(today);
  const month = rangeForPeriod("luna", today);
  const last30From = toISODate(subDays(today, 29));

  const [todaySession, monthSessions, last30] = await Promise.all([
    getSessionByDate(todayISO),
    getSessionsInRange(toISODate(month.from), toISODate(month.to)),
    getSessionsInRange(last30From, todayISO),
  ]);

  const todayInd = aggregate(todaySession ? [todaySession] : []);
  const monthInd = aggregate(monthSessions);
  const trend = groupForChart(last30, "luna");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Panou</h1>
          <p className="text-sm text-slate-500">{formatDateRo(today)}</p>
        </div>
        {canEdit && (
          <Link
            href="/introducere"
            className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Introdu ziua de azi
          </Link>
        )}
      </div>

      {!todaySession && canEdit && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
          Nu ai introdus încă ședințele de astăzi.{" "}
          <Link href="/introducere" className="font-semibold underline">
            Completează acum
          </Link>
          .
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Astăzi
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total" value={todayInd.total} tone="blue" />
          <StatTile label="Petrecute" value={todayInd.petrecute} tone="green" />
          <StatTile label="Amânate" value={todayInd.amanate} tone="amber" />
          <StatTile
            label="La sediul judecătoriei"
            value={todayInd.laSediu}
            tone="slate"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Luna curentă
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total" value={monthInd.total} tone="blue" />
          <StatTile label="Petrecute" value={monthInd.petrecute} tone="green" />
          <StatTile label="Amânate" value={monthInd.amanate} tone="amber" />
          <StatTile
            label="La sediul judecătoriei"
            value={monthInd.laSediu}
            tone="slate"
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evoluție — ultimele 30 de zile</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Structura lunii — după categorie</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              teleconferinta={monthInd.tcTotal}
              instanta={monthInd.ijTotal}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
