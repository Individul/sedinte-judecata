"use client";

import { Button } from "@/components/ui/button";
import { REPORT_HEADERS, buildReportRows, totalsRow } from "@/lib/report";
import type { DailySession } from "@/lib/types";

const DIACRITICS: Record<string, string> = {
  ș: "s", Ș: "S", ş: "s", Ş: "S",
  ț: "t", Ț: "T", ţ: "t", Ţ: "T",
  ă: "a", Ă: "A", â: "a", Â: "A", î: "i", Î: "I",
};

/** jsPDF's built-in fonts lack Romanian glyphs, so normalize to ASCII for PDF. */
function deaccent(s: string): string {
  return s.replace(/[șȘşŞțȚţŢăĂâÂîÎ]/g, (c) => DIACRITICS[c] ?? c);
}

export function ExportButtons({
  sessions,
  title,
  subtitle,
}: {
  sessions: DailySession[];
  title: string;
  subtitle: string;
}) {
  const dataRows = buildReportRows(sessions);
  const totals = totalsRow(sessions);
  const disabled = sessions.length === 0;

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function fileName(ext: string) {
    return `raport-sedinte-${new Date().toISOString().slice(0, 10)}.${ext}`;
  }

  function exportCSV() {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [REPORT_HEADERS, ...dataRows, totals];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
    // Prepend BOM so Excel opens UTF-8 diacritics correctly.
    download(
      new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" }),
      fileName("csv"),
    );
  }

  async function exportXLSX() {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Raport");

    ws.addRow([title]).font = { bold: true, size: 14 };
    ws.addRow([subtitle]).font = { color: { argb: "FF64748B" } };
    ws.addRow([]);

    const header = ws.addRow(REPORT_HEADERS);
    header.font = { bold: true };
    header.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFF6FF" },
      };
    });

    dataRows.forEach((r) => ws.addRow(r));
    const tr = ws.addRow(totals);
    tr.font = { bold: true };
    ws.columns.forEach((c) => (c.width = 15));

    const buf = await wb.xlsx.writeBuffer();
    download(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName("xlsx"),
    );
  }

  async function exportPDF() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(deaccent(title), 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(deaccent(subtitle), 14, 22);

    autoTable(doc, {
      head: [REPORT_HEADERS.map(deaccent)],
      body: dataRows.map((r) => r.map((c) => deaccent(String(c)))),
      foot: [totals.map((c) => deaccent(String(c)))],
      startY: 28,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: 20,
        fontStyle: "bold",
      },
    });

    doc.save(fileName("pdf"));
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={exportCSV} disabled={disabled}>
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportXLSX} disabled={disabled}>
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportPDF} disabled={disabled}>
        PDF
      </Button>
    </div>
  );
}
