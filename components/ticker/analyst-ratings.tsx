"use client";

import { cn, formatCurrency } from "@/lib/utils";
import type { AnalystRatings } from "@/lib/yahoo";

type Props = {
  ratings: AnalystRatings;
  currentPrice: number | null;
  currency: string;
};

const REC_LABEL: Record<string, { label: string; color: string }> = {
  strong_buy:  { label: "Strong Buy",  color: "text-[#10b981] bg-[#10b981]/10 ring-[#10b981]/30" },
  buy:         { label: "Buy",         color: "text-[#10b981] bg-[#10b981]/10 ring-[#10b981]/25" },
  hold:        { label: "Hold",        color: "text-amber-400 bg-amber-400/10 ring-amber-400/25" },
  sell:        { label: "Sell",        color: "text-destructive bg-destructive/10 ring-destructive/25" },
  strong_sell: { label: "Strong Sell", color: "text-destructive bg-destructive/10 ring-destructive/30" },
};

export function AnalystRatings({ ratings, currentPrice, currency }: Props) {
  const recKey = ratings.recommendationKey?.toLowerCase() ?? "";
  const rec = REC_LABEL[recKey] ?? { label: recKey, color: "text-foreground bg-muted ring-border" };

  const total =
    (ratings.strongBuy ?? 0) +
    (ratings.buy ?? 0) +
    (ratings.hold ?? 0) +
    (ratings.sell ?? 0) +
    (ratings.strongSell ?? 0);

  const bars: { label: string; count: number | null; color: string }[] = [
    { label: "Strong Buy",  count: ratings.strongBuy,  color: "#10b981" },
    { label: "Buy",         count: ratings.buy,         color: "#34d399" },
    { label: "Hold",        count: ratings.hold,        color: "#f59e0b" },
    { label: "Sell",        count: ratings.sell,        color: "#f87171" },
    { label: "Strong Sell", count: ratings.strongSell,  color: "#ef4444" },
  ];

  const upside =
    currentPrice && ratings.targetMeanPrice
      ? ((ratings.targetMeanPrice - currentPrice) / currentPrice) * 100
      : null;

  return (
    <section className="glass p-6 md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Section</span>
        <h2 className="font-display text-xl font-medium tracking-tight">Analyst Ratings</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr_auto]">
        {/* Consensus badge */}
        <div className="flex flex-col items-center justify-center gap-2 md:min-w-[120px]">
          <span className={cn("rounded-full px-4 py-2 text-base font-semibold ring-1 ring-inset", rec.color)}>
            {rec.label}
          </span>
          <p className="text-center text-xs text-muted-foreground">
            Wall St. Consensus
          </p>
        </div>

        {/* Distribution bars */}
        <div className="space-y-2">
          {bars.map(({ label, count, color }) => {
            const pct = total > 0 && count != null ? (count / total) * 100 : 0;
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}55` }}
                  />
                </div>
                <span className="w-6 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {count ?? 0}
                </span>
              </div>
            );
          })}
          <p className="pt-1 text-right font-mono text-[10px] text-muted-foreground/60">
            Based on {ratings.numberOfAnalysts ?? total} analysts
          </p>
        </div>

        {/* Price targets */}
        {ratings.targetMeanPrice && (
          <div className="flex flex-col gap-3 md:min-w-[160px] md:border-l md:border-border/50 md:pl-6">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Mean Target</p>
              <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
                {formatCurrency(ratings.targetMeanPrice, currency)}
              </p>
              {upside !== null && (
                <p className={cn("font-mono text-sm font-medium", upside >= 0 ? "text-[#10b981]" : "text-destructive")}>
                  {upside >= 0 ? "+" : ""}{upside.toFixed(1)}% upside
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {ratings.targetHighPrice && (
                <div>
                  <p className="text-[10px] text-muted-foreground">High</p>
                  <p className="font-mono text-sm font-medium text-[#10b981]">{formatCurrency(ratings.targetHighPrice, currency)}</p>
                </div>
              )}
              {ratings.targetLowPrice && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Low</p>
                  <p className="font-mono text-sm font-medium text-destructive">{formatCurrency(ratings.targetLowPrice, currency)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
