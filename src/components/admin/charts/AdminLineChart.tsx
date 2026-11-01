"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate, formatNumber } from "@/lib/format";

type Point = { date: string; value: number };

type Props = {
  data: Point[];
  valueLabel: string;
  formatValue?: (value: number) => string;
};

function ChartTooltip({ active, payload, label, valueLabel, formatValue }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  valueLabel: string;
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-3.5 py-2.5 shadow-lift ring-1 ring-soft">
      <p className="text-xs font-semibold text-navy/50">{formatDate(label ?? "")}</p>
      <p className="mt-0.5 text-sm font-bold text-navy">
        {formatValue(payload[0].value)} <span className="font-medium text-navy/50">{valueLabel}</span>
      </p>
    </div>
  );
}

export function AdminLineChart({ data, valueLabel, formatValue = formatNumber }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="adminLineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2875fb" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#2875fb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#c3d7fc" strokeOpacity={0.6} />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatDate(v).replace(/,.*/, "")}
          tick={{ fill: "#030e50", opacity: 0.45, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: "#030e50", opacity: 0.45, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={52}
          tickFormatter={(v: number) => formatNumber(v)}
        />
        <Tooltip content={<ChartTooltip valueLabel={valueLabel} formatValue={formatValue} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#2875fb"
          strokeWidth={2}
          fill="url(#adminLineFill)"
          dot={false}
          activeDot={{ r: 4, fill: "#2875fb", strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
