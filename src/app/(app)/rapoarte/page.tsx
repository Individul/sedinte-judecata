import { differenceInCalendarDays } from "date-fns";
import { getSessionsInRange } from "@/lib/data";
import { aggregate } from "@/lib/calc";
import {
  formatDateShortRo,
  groupForChart,
  parseISODate,
  rangeForPeriod,
  rangeLabelRo,
  toISODate,
} from "@/lib/periods";
import { PERIODS, type Period } from "@/lib/types";
import { formatNumber, pct } from "@/lib/format";
import { REPORT_HEADERS, buildReportRows, totalsRow } from "@/lib/report";
import { StatTile } from "@/components/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/charts/trend-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { PeriodSelector } from "./period-selector";
import { ExportButtons } from "@/components/reports/export-buttons";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function RapoartePage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    ref?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const sp = await searchParams;
  const custom = !!(sp.from && sp.to && ISO.test(sp.from) && ISO.test(sp.to));
  const period = (PERIODS as readonly string[]).includes(sp.period ?? "")
    ? (sp.period as Period)
    : "luna";
  const refDate = sp.ref && ISO.test(sp.ref) ? sp.ref : toISODate(new Date());

  let fromISO: string;
  let toISO: string;
  let label: string;

  if (custom) {
    fromISO = sp.from!;
    toISO = sp.to!;
    label = `${formatDateShortRo(fromISO)} – ${formatDateShortRo(toISO)}`;
  } else {
    const r = rangeForPeriod(period, parseISODate(refDate));
    fromISO = toISODate(r.from);
    toISO = toISODate(r.to);
    label = rangeLabelRo(r);
  }

  const sessions = await getSessionsInRange(fromISO, toISO);
  const ind = aggregate(sessions);

  const spanDays = differenceInCalendarDays(
    parseISODate(toISO),
    parseISODate(fromISO),
  );
  const chartGranularity: Period = custom
    ? spanDays > 92
      ? "an"
      : "luna"
    : period;
  const trend = groupForChart(sessions, chartGranularity);

  const rows = buildReportRows(sessions);
  const totals = totalsRow(sessions);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Rapoarte</h1>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
        <ExportButtons
          sessions={sessions}
          title="Raport ședințe de judecată"
          subtitle={label}
        />
      </div>

      <PeriodSelector
        period={period}
        refDate={refDate}
        from={custom ? fromISO : null}
        to={custom ? toISO : null}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total" value={ind.total} tone="blue" />
        <StatTile
          label="Petrecute"
          value={ind.petrecute}
          tone="green"
          hint={pct(ind.petrecute, ind.total) + " din total"}
        />
        <StatTile
          label="Amânate"
          value={ind.amanate}
          tone="amber"
          hint={pct(ind.amanate, ind.total) + " din total"}
        />
        <StatTile
          label="La sediul judecătoriei"
          value={ind.laSediu}
          tone="slate"
          hint="Instanța de judecată"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evoluție în perioadă</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>După categorie</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              teleconferinta={ind.tcTotal}
              instanta={ind.ijTotal}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <BreakdownCard
          title="Teleconferință"
          prezenti={ind.tcPrezenti}
          examinati={ind.tcExaminatiLipsa}
          amanate={ind.tcAmanate}
          petrecute={ind.tcPetrecute}
          total={ind.tcTotal}
        />
        <BreakdownCard
          title="Instanța de judecată"
          prezenti={ind.ijPrezenti}
          examinati={ind.ijExaminatiLipsa}
          amanate={ind.ijAmanate}
          petrecute={ind.ijPetrecute}
          total={ind.ijTotal}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detaliu pe zile</CardTitle>
          <span className="text-xs text-slate-400">
            {sessions.length}{" "}
            {sessions.length === 1 ? "zi cu date" : "zile cu date"}
          </span>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Nu există date introduse în această perioadă.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    {REPORT_HEADERS.map((h, i) => (
                      <th
                        key={h}
                        className={
                          i === 0
                            ? "py-2 pr-3 font-medium"
                            : "py-2 pr-3 text-right font-medium"
                        }
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, ri) => (
                    <tr
                      key={ri}
                      className="border-b border-slate-100 last:border-0"
                    >
                      {r.map((c, ci) => (
                        <td
                          key={ci}
                          className={
                            ci === 0
                              ? "py-2 pr-3 whitespace-nowrap text-slate-700"
                              : "py-2 pr-3 text-right tabular-nums text-slate-600"
                          }
                        >
                          {typeof c === "number" ? formatNumber(c) : c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-semibold text-slate-800">
                    {totals.map((c, ci) => (
                      <td
                        key={ci}
                        className={
                          ci === 0
                            ? "py-2 pr-3"
                            : "py-2 pr-3 text-right tabular-nums"
                        }
                      >
                        {typeof c === "number" ? formatNumber(c) : c}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BreakdownCard({
  title,
  prezenti,
  examinati,
  amanate,
  petrecute,
  total,
}: {
  title: string;
  prezenti: number;
  examinati: number;
  amanate: number;
  petrecute: number;
  total: number;
}) {
  const line = (label: string, value: number, strong = false) => (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={strong ? "font-medium text-slate-700" : "text-slate-500"}>
        {label}
      </span>
      <span
        className={
          strong
            ? "font-semibold text-slate-900 tabular-nums"
            : "text-slate-700 tabular-nums"
        }
      >
        {formatNumber(value)}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-slate-100">
        {line("Prezenți", prezenti)}
        {line("Examinați în lipsa lor", examinati)}
        {line("Amânate", amanate)}
        {line("Petrecute", petrecute, true)}
        {line("Total ședințe", total, true)}
      </CardContent>
    </Card>
  );
}
