"use client";

import { TrendingUp, Activity, Gauge, Anchor } from "lucide-react";
import type { AnalyticsResponse } from "./types";

type Props = {
  factor: AnalyticsResponse["factor"];
  summary: AnalyticsResponse["summary"];
  benchmark: string;
  ratesProxy: string;
};

export function FactorPanel({ factor, summary, benchmark, ratesProxy }: Props) {
  const rateInterpretation =
    factor.rateBeta > 0.2
      ? "Long duration — benefits from falling rates"
      : factor.rateBeta < -0.2
      ? "Short duration — benefits from rising rates"
      : "Rate-neutral";

  const betaInterpretation =
    Math.abs(factor.beta - 1) < 0.1
      ? "Tracks the market closely"
      : factor.beta > 1
      ? `${((factor.beta - 1) * 100).toFixed(0)}% more sensitive than market`
      : factor.beta < 0.5
      ? "Largely uncorrelated to market"
      : `${((1 - factor.beta) * 100).toFixed(0)}% less sensitive than market`;

  const items = [
    {
      icon: Gauge,
      label: `Beta vs ${benchmark}`,
      value: factor.beta.toFixed(2),
      caption: betaInterpretation,
      tone: Math.abs(factor.beta - 1) < 0.15 ? "neutral" : factor.beta > 1.3 ? "warning" : "positive",
    },
    {
      icon: TrendingUp,
      label: "Alpha (CAPM)",
      value: `${(factor.alpha * 100).toFixed(2)}%`,
      caption: factor.alpha > 0 ? "Generating excess return" : "Underperforming risk-adjusted",
      tone: factor.alpha > 0 ? "positive" : "negative",
    },
    {
      icon: Activity,
      label: "Tracking Error",
      value: `${(factor.trackingError * 100).toFixed(2)}%`,
      caption:
        factor.trackingError < 0.05
          ? "Closet indexer — hugs the benchmark"
          : factor.trackingError > 0.15
          ? "High active risk"
          : "Moderate active risk",
      tone: "neutral",
    },
    {
      icon: TrendingUp,
      label: "Information Ratio",
      value: factor.informationRatio.toFixed(2),
      caption:
        factor.informationRatio > 0.5
          ? "Skilled active management"
          : factor.informationRatio > 0
          ? "Modest skill"
          : "No active alpha",
      tone: factor.informationRatio > 0 ? "positive" : "negative",
    },
    {
      icon: Anchor,
      label: `Rate Beta (${ratesProxy})`,
      value: factor.rateBeta.toFixed(2),
      caption: rateInterpretation,
      tone: "neutral",
    },
  ] as const;

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl">
      <h3 className="font-display text-sm font-medium tracking-tight">Factor Exposure</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        How your portfolio responds to market and rate moves
      </p>

      <ul className="mt-4 space-y-3">
        {items.map(({ icon: Icon, label, value, caption, tone }) => (
          <li key={label} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/40 ring-1 ring-inset ring-border/50">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-foreground/80">{label}</p>
                <p
                  className={`font-mono text-sm font-semibold tabular-nums ${
                    tone === "positive"
                      ? "text-[#10b981]"
                      : tone === "negative"
                      ? "text-destructive"
                      : tone === "warning"
                      ? "text-amber-400"
                      : "text-foreground"
                  }`}
                >
                  {value}
                </p>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{caption}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        Calculated against {benchmark} ({summary.benchSharpe.toFixed(2)} Sharpe). Risk-free rate
        anchors CAPM regression.
      </div>
    </div>
  );
}
