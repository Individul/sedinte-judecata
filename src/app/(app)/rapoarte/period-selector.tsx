"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { PERIODS, PERIOD_LABELS, type Period } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PeriodSelector({
  period,
  refDate,
  from,
  to,
}: {
  period: Period;
  refDate: string;
  from: string | null;
  to: string | null;
}) {
  const router = useRouter();
  const custom = Boolean(from && to);
  const [cFrom, setCFrom] = useState(from ?? "");
  const [cTo, setCTo] = useState(to ?? "");

  function push(params: Record<string, string>) {
    router.push(`/rapoarte?${new URLSearchParams(params).toString()}`);
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => push({ period: p, ref: refDate })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              !custom && period === p
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
        {!custom && (
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-slate-500 sm:inline">
              Data de referință
            </span>
            <Input
              type="date"
              className="w-44"
              defaultValue={refDate}
              onChange={(e) =>
                e.target.value && push({ period, ref: e.target.value })
              }
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-sm text-slate-500">Interval personalizat:</span>
        <Input
          type="date"
          className="w-40"
          value={cFrom}
          onChange={(e) => setCFrom(e.target.value)}
        />
        <span className="text-slate-400">–</span>
        <Input
          type="date"
          className="w-40"
          value={cTo}
          onChange={(e) => setCTo(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cFrom && cTo && push({ from: cFrom, to: cTo })}
        >
          Aplică
        </Button>
        {custom && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => push({ period: "luna", ref: refDate })}
          >
            Revino la perioade
          </Button>
        )}
      </div>
    </div>
  );
}
