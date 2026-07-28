import { aggregate, computeIndicators } from "./calc";
import { formatDateShortRo } from "./periods";
import type { DailySession } from "./types";

/** Column headers shared by the on-screen table and all export formats. */
export const REPORT_HEADERS = [
  "Data",
  "TC Prezenți",
  "TC Amânate",
  "TC Total",
  "IJ Prezenți",
  "IJ Amânate",
  "IJ Total",
  "Total general",
  "Petrecute",
  "Amânate",
  "La sediu",
];

/** One row per day, columns aligned with REPORT_HEADERS. */
export function buildReportRows(
  sessions: DailySession[],
): (string | number)[][] {
  return sessions.map((s) => {
    const i = computeIndicators(s);
    return [
      formatDateShortRo(s.session_date),
      i.tcPrezenti,
      i.tcAmanate,
      i.tcTotal,
      i.ijPrezenti,
      i.ijAmanate,
      i.ijTotal,
      i.total,
      i.petrecute,
      i.amanate,
      i.laSediu,
    ];
  });
}

/** Grand-total row across all sessions in the report. */
export function totalsRow(sessions: DailySession[]): (string | number)[] {
  const a = aggregate(sessions);
  return [
    "TOTAL",
    a.tcPrezenti,
    a.tcAmanate,
    a.tcTotal,
    a.ijPrezenti,
    a.ijAmanate,
    a.ijTotal,
    a.total,
    a.petrecute,
    a.amanate,
    a.laSediu,
  ];
}
