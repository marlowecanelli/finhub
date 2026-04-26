"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { formatCompact } from "@/lib/utils";
import type { TickerSummary } from "@/lib/yahoo";

type Props = {
  data: TickerSummary["financialsQuarterly"];
  currency: string;
};

type Row = {
  quarter: string;
  revenue: number;
  netIncome: number;
  margin: number;
};

export function FinancialHighlights({ data, currency }: Props) {
  const rows: Row[] = data
    .filter((d) => d.revenue != null && d.netIncome != null)
    .map((d) => ({
      quarter: d.quarter,
      revenue: d.revenue as number,
      netIncome: d.netIncome as number,
      margin: d.profitMargin ?? 0,
    }));

  return (
    <section className="glass p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">
            Financial highlights
          </h2>
          <p className="text-xs text-muted-foreground/80">
            Last 4 quarters · {currency}
          </p>
        </div>
        <Legend />
      </div>

      {rows.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          Financial statements unavailable.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.4}
              />
              <XAxis
                dataKey="quarter"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatCompact(v)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                content={<FinancialsTooltip currency={currency} />}
              />
              <Bar
                dataKey="revenue"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                isAnimationActive
                animationDuration={700}
              />
              <Bar
                dataKey="netIncome"
                radius={[6, 6, 0, 0]}
                isAnimationActive
                animationDuration={800}
              >
                {rows.map((r, i) => (
                  <Cell
                    key={i}
                    fill={r.netIncome >= 0 ? "#10b981" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Revenue
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" /> Net income
      </span>
    </div>
  );
}

function FinancialsTooltip({
  active,
  payload,
  currency,
}: TooltipProps<number, string> & { currency: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]!.payload as Row;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 p-3 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-medium text-foreground">{datum.quarter}</p>
      <div className="mt-2 space-y-1">
        <Row label="Revenue" value={`${formatCompact(datum.revenue)} ${currency}`} dot="#3b82f6" />
        <Row
          label="Net income"
          value={`${formatCompact(datum.netIncome)} ${currency}`}
          dot={datum.netIncome >= 0 ? "#10b981" : "#ef4444"}
        />
        <Row label="Margin" value={`${datum.margin.toFixed(1)}%`} dot="hsl(var(--muted-foreground))" />
      </div>
    </div>
  );
}

function Row({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className="h-2 w-2 rounded-sm" style={{ background: dot }} />
        {label}
      </span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}
