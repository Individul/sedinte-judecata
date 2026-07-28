"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatNumber } from "@/lib/format";

const COLORS = ["#2563eb", "#0ea5e9"];

export function DonutChart({
  teleconferinta,
  instanta,
}: {
  teleconferinta: number;
  instanta: number;
}) {
  const total = teleconferinta + instanta;
  if (!total) {
    return (
      <div className="grid h-[240px] place-items-center text-sm text-slate-400">
        Fără date.
      </div>
    );
  }

  const data = [
    { name: "Teleconferință", value: teleconferinta },
    { name: "Instanța de judecată", value: instanta },
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatNumber(Number(value))}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: 13,
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={28}
          iconType="circle"
          wrapperStyle={{ fontSize: 13 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
