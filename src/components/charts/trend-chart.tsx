"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/periods";
import { formatNumber } from "@/lib/format";

export function TrendChart({ data }: { data: ChartPoint[] }) {
  if (!data.length) {
    return (
      <div className="grid h-[280px] place-items-center text-sm text-slate-400">
        Nu există date pentru intervalul selectat.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="trendTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          minTickGap={20}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={36}
        />
        <Tooltip
          formatter={(value) => formatNumber(Number(value))}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: 13,
          }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
        <Area
          type="monotone"
          dataKey="total"
          name="Total"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#trendTotal)"
        />
        <Line
          type="monotone"
          dataKey="amanate"
          name="Amânate"
          stroke="#d97706"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
