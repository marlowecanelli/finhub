"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { DividendYearRow } from "@/lib/calculators";

type Props = { rows: DividendYearRow[]; reinvest: boolean };

type CompareDatum = {
  year: number;
  reinvested: number;
  notReinvested: number;
};

export function DividendChart({ rows, reinvest }: Props) {
  if (rows.length === 0) return <Placeholder />;
  const data = rows.map((r) => ({
    year: r.year,
    value: r.portfolioValue,
    contributions: r.contributions,
  }));
  const colorKey = reinvest ? "reinvested" : "cash";
  return (
    <div className="glass p-5">
      <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
        Portfolio value over time
      </h3>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${colorKey}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tickFormatter={(y: number) => `Y${y}`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v).replace(".00", "")}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip content={<ValueTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground) / 0.4)" }} />
            <Area
              type="monotone"
              dataKey="contributions"
              stroke="hsl(var(--muted-foreground) / 0.6)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              fill="none"
              isAnimationActive
              animationDuration={500}
              name="Contributions"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill={`url(#fill-${colorKey})`}
              isAnimationActive
              animationDuration={600}
              name="Portfolio value"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CompareChart({ rows }: { rows: DividendYearRow[] }) {
  if (rows.length === 0) return null;
  const data: CompareDatum[] = rows.map((r) => ({
    year: r.year,
    reinvested: r.reinvestedValue,
    notReinvested: r.notReinvestedValue,
  }));

  return (
    <div className="glass p-5">
      <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
        Reinvested vs not reinvested
      </h3>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tickFormatter={(y: number) => `Y${y}`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v).replace(".00", "")}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip content={<CompareTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="reinvested"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={600}
              name="Reinvested"
            />
            <Line
              type="monotone"
              dataKey="notReinvested"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive
              animationDuration={600}
              name="Not reinvested"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="glass flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      Enter inputs to project growth.
    </div>
  );
}

function ValueTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-medium">Year {label}</p>
      {payload.map((p) => (
        <div key={p.dataKey as string} className="mt-1 flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-mono">{formatCurrency(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

function CompareTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-medium">Year {label}</p>
      {payload.map((p) => (
        <div key={p.dataKey as string} className="mt-1 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: p.color }}
            />
            {p.name}
          </span>
          <span className="font-mono">{formatCurrency(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}
