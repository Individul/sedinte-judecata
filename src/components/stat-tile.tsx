import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

type Tone = "blue" | "green" | "amber" | "slate";

const toneText: Record<Tone, string> = {
  blue: "text-blue-700",
  green: "text-emerald-700",
  amber: "text-amber-600",
  slate: "text-slate-900",
};

export function StatTile({
  label,
  value,
  hint,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", toneText[tone])}>
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
