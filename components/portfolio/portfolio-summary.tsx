"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { PortfolioTotals } from "@/lib/portfolio";

type Props = { totals: PortfolioTotals; loading?: boolean };

export function PortfolioSummary({ totals, loading }: Props) {
  const items = [
    {
      label: "Total Value",
      value: totals.totalValue,
      pct: null,
      tone: "primary" as const,
    },
    {
      label: "Total P/L",
      value: totals.totalPL,
      pct: totals.totalPLPct,
      tone: totals.totalPL >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Day Change",
      value: totals.dayChange,
      pct: totals.dayChangePct,
      tone: totals.dayChange >= 0 ? ("up" as const) : ("down" as const),
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="glass relative overflow-hidden p-5">
          {it.tone === "primary" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent"
            />
          )}
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {it.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={cn(
                  "font-mono text-3xl font-semibold tracking-tight",
                  it.tone === "up" && "text-[#10b981]",
                  it.tone === "down" && "text-[#ef4444]"
                )}
              >
                {loading ? (
                  "—"
                ) : (
                  <AnimatedNumber
                    value={it.value}
                    format={(n) =>
                      `${it.tone !== "primary" && n > 0 ? "+" : ""}${formatCurrency(n)}`
                    }
                  />
                )}
              </span>
              {it.pct != null && !loading && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-xs font-medium",
                    it.tone === "up" ? "text-[#10b981]" : "text-[#ef4444]"
                  )}
                >
                  {it.tone === "up" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {formatPercent(it.pct)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
