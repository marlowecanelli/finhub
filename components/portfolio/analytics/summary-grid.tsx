"use client";

import { cn } from "@/lib/utils";
import type { AnalyticsResponse } from "./types";

type Props = {
  summary: AnalyticsResponse["summary"];
  factor: AnalyticsResponse["factor"];
  composition: AnalyticsResponse["composition"];
};

export function SummaryGrid({ summary, factor, composition }: Props) {
  const pct = (x: number, digits = 2) => `${(x * 100).toFixed(digits)}%`;
  const num = (x: number, digits = 2) => x.toFixed(digits);

  const cards: Array<{
    label: string;
    value: string;
    sub?: string;
    tone?: "positive" | "negative" | "neutral" | "warning";
    hint?: string;
  }> = [
    {
      label: "Annual Return",
      value: pct(summary.annualReturn),
      sub: `vs ${pct(summary.benchAnnualReturn)} bench`,
      tone: summary.annualReturn >= summary.benchAnnualReturn ? "positive" : "negative",
      hint: "Annualized arithmetic return from daily data",
    },
    {
      label: "Annual Volatility",
      value: pct(summary.annualVol),
      sub: `vs ${pct(summary.benchAnnualVol)} bench`,
      tone: summary.annualVol > summary.benchAnnualVol * 1.2 ? "warning" : "neutral",
      hint: "Annualized standard deviation of daily returns",
    },
    {
      label: "Sharpe Ratio",
      value: num(summary.sharpe),
      sub: `vs ${num(summary.benchSharpe)} bench`,
      tone: summary.sharpe >= 1 ? "positive" : summary.sharpe >= 0.5 ? "neutral" : "warning",
      hint: "Excess return per unit of total risk",
    },
    {
      label: "Sortino Ratio",
      value: num(summary.sortino),
      tone: summary.sortino >= 1 ? "positive" : summary.sortino >= 0.5 ? "neutral" : "warning",
      hint: "Like Sharpe but only penalizes downside volatility",
    },
    {
      label: "Max Drawdown",
      value: pct(summary.maxDrawdown),
      sub: summary.benchMaxDrawdown ? `vs ${pct(summary.benchMaxDrawdown)} bench` : undefined,
      tone: summary.maxDrawdown < -0.3 ? "negative" : "neutral",
      hint: "Largest peak-to-trough decline",
    },
    {
      label: "Calmar Ratio",
      value: num(summary.calmar),
      tone: summary.calmar >= 0.5 ? "positive" : "neutral",
      hint: "Return / |max drawdown|",
    },
    {
      label: "Beta",
      value: num(factor.beta),
      tone:
        Math.abs(factor.beta - 1) < 0.15
          ? "neutral"
          : factor.beta > 1
          ? "warning"
          : "positive",
      hint: "Sensitivity to S&P 500 (1.0 = same)",
    },
    {
      label: "Alpha",
      value: pct(factor.alpha),
      tone: factor.alpha > 0 ? "positive" : "negative",
      hint: "Annualized excess return after adjusting for beta",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border/60 sm:grid-cols-4 lg:grid-cols-8">
      {cards.map((c) => (
        <Card key={c.label} {...c} />
      ))}
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "positive" | "negative" | "neutral" | "warning";
  hint?: string;
}) {
  return (
    <div
      className="group relative bg-card/40 p-4 backdrop-blur-xl transition-colors hover:bg-card/70"
      title={hint}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight",
          tone === "positive" && "text-[#10b981]",
          tone === "negative" && "text-destructive",
          tone === "warning" && "text-amber-400",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
