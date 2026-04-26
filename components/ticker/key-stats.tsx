"use client";

import { AnimatedNumber } from "./animated-number";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/utils";
import type { TickerSummary } from "@/lib/yahoo";

type Props = {
  stats: TickerSummary["stats"];
  currency: string;
};

export function KeyStats({ stats, currency }: Props) {
  const items: { label: string; value: React.ReactNode }[] = [
    {
      label: "Market Cap",
      value: (
        <AnimatedNumber
          value={stats.marketCap}
          format={(n) => formatCompact(n)}
          decimals={2}
        />
      ),
    },
    {
      label: "P/E",
      value: <AnimatedNumber value={stats.peRatio} decimals={2} />,
    },
    {
      label: "EPS",
      value: (
        <AnimatedNumber
          value={stats.eps}
          format={(n) => formatCurrency(n, currency)}
        />
      ),
    },
    {
      label: "Dividend Yield",
      value: (
        <AnimatedNumber
          value={stats.dividendYield != null ? stats.dividendYield * 100 : null}
          format={(n) => formatPercent(n)}
        />
      ),
    },
    {
      label: "52W High",
      value: (
        <AnimatedNumber
          value={stats.week52High}
          format={(n) => formatCurrency(n, currency)}
        />
      ),
    },
    {
      label: "52W Low",
      value: (
        <AnimatedNumber
          value={stats.week52Low}
          format={(n) => formatCurrency(n, currency)}
        />
      ),
    },
    {
      label: "Beta",
      value: <AnimatedNumber value={stats.beta} decimals={2} />,
    },
    {
      label: "Volume",
      value: (
        <AnimatedNumber
          value={stats.volume}
          format={(n) => formatCompact(n)}
          decimals={0}
        />
      ),
    },
    {
      label: "Avg Volume",
      value: (
        <AnimatedNumber
          value={stats.avgVolume}
          format={(n) => formatCompact(n)}
          decimals={0}
        />
      ),
    },
  ];

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Key statistics
      </h2>
      <div className="glass grid grid-cols-2 divide-x divide-y divide-border/40 overflow-hidden md:grid-cols-3 lg:grid-cols-5 [&>*]:p-4">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {it.label}
            </span>
            <span className="text-base font-semibold text-foreground">
              {it.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
