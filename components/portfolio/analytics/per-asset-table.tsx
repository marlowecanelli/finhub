"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Row = {
  symbol: string;
  weight: number;
  annualReturn: number;
  annualVol: number;
  sharpe: number;
  beta: number;
  correlationToPortfolio: number;
  riskContributionPct: number;
  maxDrawdown: number;
};

type Props = { rows: Row[] };

export function PerAssetTable({ rows }: Props) {
  const sorted = [...rows].sort((a, b) => b.weight - a.weight);

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl">
      <h3 className="font-display text-sm font-medium tracking-tight">Per-Asset Detail</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Click a symbol to drill into its ticker page
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40 text-left">
              {["Symbol", "Weight", "Risk %", "Annual Ret", "Vol", "Sharpe", "Beta", "Corr", "Max DD"].map((h) => (
                <th key={h} className="pb-2 pr-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.symbol} className="border-b border-border/20 last:border-0">
                <td className="py-2 pr-3">
                  <Link href={"/ticker/" + r.symbol} className="font-mono font-semibold text-foreground hover:text-primary">
                    {r.symbol}
                  </Link>
                </td>
                <td className="py-2 pr-3 font-mono tabular-nums text-foreground/80">{(r.weight * 100).toFixed(1)}%</td>
                <td className={cn("py-2 pr-3 font-mono tabular-nums", r.riskContributionPct > r.weight * 1.2 ? "text-amber-400" : "text-foreground/80")}>
                  {(r.riskContributionPct * 100).toFixed(1)}%
                </td>
                <td className={cn("py-2 pr-3 font-mono tabular-nums", r.annualReturn >= 0 ? "text-[#10b981]" : "text-destructive")}>
                  {(r.annualReturn * 100).toFixed(1)}%
                </td>
                <td className="py-2 pr-3 font-mono tabular-nums text-foreground/80">{(r.annualVol * 100).toFixed(1)}%</td>
                <td className={cn("py-2 pr-3 font-mono tabular-nums", r.sharpe >= 1 ? "text-[#10b981]" : r.sharpe >= 0 ? "text-foreground/80" : "text-destructive")}>
                  {r.sharpe.toFixed(2)}
                </td>
                <td className="py-2 pr-3 font-mono tabular-nums text-foreground/80">{r.beta.toFixed(2)}</td>
                <td className="py-2 pr-3 font-mono tabular-nums text-foreground/80">{r.correlationToPortfolio.toFixed(2)}</td>
                <td className="py-2 pr-3 font-mono tabular-nums text-destructive/90">{(r.maxDrawdown * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
