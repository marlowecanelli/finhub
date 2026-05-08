"use client";

import { AnimatedNumber } from "./animated-number";
import { cn, formatCompact, formatCurrency, formatPercent } from "@/lib/utils";
import type { TickerSummary } from "@/lib/yahoo";

type Props = {
  stats: TickerSummary["stats"];
  currency: string;
};

type Badge = { label: string; color: "green" | "yellow" | "red" | "blue" };

function getBadge(key: string, value: number | null): Badge | null {
  if (value == null) return null;
  if (key === "peRatio") {
    if (value < 0) return { label: "Neg", color: "red" };
    if (value < 15) return { label: "Low", color: "green" };
    if (value > 40) return { label: "High", color: "yellow" };
  }
  if (key === "beta") {
    if (value < 0.5) return { label: "Stable", color: "green" };
    if (value > 1.5) return { label: "High Vol", color: "yellow" };
    if (value > 2.5) return { label: "Very High", color: "red" };
  }
  if (key === "profitMargin") {
    if (value < 0) return { label: "Neg", color: "red" };
    if (value > 0.25) return { label: "Strong", color: "green" };
  }
  if (key === "dividendYield") {
    if (value > 0.04) return { label: "High Yield", color: "green" };
  }
  return null;
}

function StatBadge({ badge }: { badge: Badge }) {
  const colors: Record<Badge["color"], string> = {
    green: "bg-[#10b981]/10 text-[#10b981] ring-[#10b981]/25",
    yellow: "bg-amber-500/10 text-amber-400 ring-amber-500/25",
    red: "bg-destructive/10 text-destructive ring-destructive/25",
    blue: "bg-primary/10 text-primary ring-primary/25",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ring-1 ring-inset", colors[badge.color])}>
      {badge.label}
    </span>
  );
}

export function KeyStats({ stats, currency }: Props) {
  type StatItem = { key: string; label: string; value: React.ReactNode; rawValue: number | null };

  const items: StatItem[] = [
    {
      key: "marketCap",
      label: "Market Cap",
      rawValue: stats.marketCap,
      value: <AnimatedNumber value={stats.marketCap} format={formatCompact} decimals={2} />,
    },
    {
      key: "peRatio",
      label: "P/E Ratio",
      rawValue: stats.peRatio,
      value: <AnimatedNumber value={stats.peRatio} decimals={2} />,
    },
    {
      key: "eps",
      label: "EPS (TTM)",
      rawValue: stats.eps,
      value: <AnimatedNumber value={stats.eps} format={(n) => formatCurrency(n, currency)} />,
    },
    {
      key: "dividendYield",
      label: "Div. Yield",
      rawValue: stats.dividendYield,
      value: <AnimatedNumber value={stats.dividendYield != null ? stats.dividendYield * 100 : null} format={formatPercent} />,
    },
    {
      key: "week52High",
      label: "52W High",
      rawValue: stats.week52High,
      value: <AnimatedNumber value={stats.week52High} format={(n) => formatCurrency(n, currency)} />,
    },
    {
      key: "week52Low",
      label: "52W Low",
      rawValue: stats.week52Low,
      value: <AnimatedNumber value={stats.week52Low} format={(n) => formatCurrency(n, currency)} />,
    },
    {
      key: "beta",
      label: "Beta",
      rawValue: stats.beta,
      value: <AnimatedNumber value={stats.beta} decimals={2} />,
    },
    {
      key: "avgVolume",
      label: "Avg Volume",
      rawValue: stats.avgVolume,
      value: <AnimatedNumber value={stats.avgVolume} format={formatCompact} decimals={0} />,
    },
    {
      key: "revenueTTM",
      label: "Revenue TTM",
      rawValue: stats.revenueTTM,
      value: <AnimatedNumber value={stats.revenueTTM} format={formatCompact} decimals={2} />,
    },
    {
      key: "profitMargin",
      label: "Profit Margin",
      rawValue: stats.profitMargin,
      value: <AnimatedNumber value={stats.profitMargin != null ? stats.profitMargin * 100 : null} format={formatPercent} />,
    },
    {
      key: "returnOnEquity",
      label: "ROE",
      rawValue: stats.returnOnEquity,
      value: <AnimatedNumber value={stats.returnOnEquity != null ? stats.returnOnEquity * 100 : null} format={formatPercent} />,
    },
    {
      key: "debtToEquity",
      label: "Debt / Equity",
      rawValue: stats.debtToEquity,
      value: <AnimatedNumber value={stats.debtToEquity} decimals={2} />,
    },
  ];

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Section</span>
        <h2 className="font-display text-xl font-medium tracking-tight">Key statistics</h2>
      </div>
      <div className="glass grid grid-cols-2 divide-x divide-y divide-border/40 overflow-hidden md:grid-cols-3 lg:grid-cols-4 [&>*]:p-4">
        {items.map((it) => {
          const badge = getBadge(it.key, it.rawValue);
          return (
            <div key={it.label} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {it.label}
                </span>
                {badge && <StatBadge badge={badge} />}
              </div>
              <span className="font-mono text-base font-semibold tabular-nums text-foreground">
                {it.value}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
