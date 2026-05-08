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
import { cn, formatCompact } from "@/lib/utils";
import type { TickerSummary } from "@/lib/yahoo";

type Props = {
  data: TickerSummary["financialsQuarterly"];
  currency: string;
};

type ChartRow = {
  quarter: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  margin: number;
};

export function FinancialHighlights({ data, currency }: Props) {
  const rows: ChartRow[] = data
    .filter((d) => d.revenue != null)
    .map((d) => ({
      quarter: d.quarter,
      revenue: d.revenue as number,
      netIncome: d.netIncome ?? 0,
      grossProfit: d.grossProfit ?? 0,
      margin: d.profitMargin ?? 0,
    }));

  return (
    <section className="glass p-6 md:p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Section</span>
          <div>
            <h2 className="font-display text-xl font-medium tracking-tight">Financials</h2>
            <p className="text-xs text-muted-foreground">Last 4 quarters · {currency}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#3b82f6]" /> Revenue</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#8b5cf6]" /> Gross Profit</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" /> Net Income</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          Financial statements unavailable.
        </div>
      ) : (
        <>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="24%">
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.4} />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => formatCompact(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={56} />
                <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} content={<FinancialsTooltip currency={currency} />} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} />
                <Bar dataKey="grossProfit" fill="#8b5cf6" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={750} />
                <Bar dataKey="netIncome" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800}>
                  {rows.map((r, i) => <Cell key={i} fill={r.netIncome >= 0 ? "#10b981" : "#ef4444"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Data table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40">
                  {["Quarter", "Revenue", "Gross Profit", "Net Income", "EPS", "Margin"].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground last:pr-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const origRow = data[i];
                  return (
                    <tr key={r.quarter} className="border-b border-border/20 last:border-0">
                      <td className="py-2.5 pr-4 font-mono font-medium text-foreground">{r.quarter}</td>
                      <td className="py-2.5 pr-4 font-mono tabular-nums text-foreground/80">{formatCompact(r.revenue)}</td>
                      <td className="py-2.5 pr-4 font-mono tabular-nums text-foreground/80">{r.grossProfit ? formatCompact(r.grossProfit) : "—"}</td>
                      <td className={cn("py-2.5 pr-4 font-mono tabular-nums", r.netIncome >= 0 ? "text-[#10b981]" : "text-destructive")}>
                        {formatCompact(r.netIncome)}
                      </td>
                      <td className="py-2.5 pr-4 font-mono tabular-nums text-foreground/80">
                        {origRow?.eps != null ? origRow.eps.toFixed(2) : "—"}
                      </td>
                      <td className={cn("py-2.5 font-mono tabular-nums", r.margin >= 0 ? "text-foreground/80" : "text-destructive")}>
                        {r.margin.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function FinancialsTooltip({ active, payload, currency }: TooltipProps<number, string> & { currency: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]!.payload as ChartRow;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 p-3 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-mono font-medium text-foreground">{datum.quarter}</p>
      <div className="mt-2 space-y-1">
        <TooltipRow label="Revenue" value={`${formatCompact(datum.revenue)} ${currency}`} dot="#3b82f6" />
        <TooltipRow label="Gross Profit" value={datum.grossProfit ? `${formatCompact(datum.grossProfit)} ${currency}` : "—"} dot="#8b5cf6" />
        <TooltipRow label="Net Income" value={`${formatCompact(datum.netIncome)} ${currency}`} dot={datum.netIncome >= 0 ? "#10b981" : "#ef4444"} />
        <TooltipRow label="Margin" value={`${datum.margin.toFixed(1)}%`} dot="hsl(var(--muted-foreground))" />
      </div>
    </div>
  );
}

function TooltipRow({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className="h-2 w-2 rounded-sm" style={{ background: dot }} />{label}
      </span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}
