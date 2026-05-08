"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  perAsset: Array<{
    symbol: string;
    weight: number;
    riskContributionPct: number;
  }>;
  diversificationRatio: number;
  effectiveBets: number;
  herfindahl: number;
};

export function RiskContribution({ perAsset, diversificationRatio, effectiveBets, herfindahl }: Props) {
  const sorted = [...perAsset].sort((a, b) => b.riskContributionPct - a.riskContributionPct);

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl">
      <h3 className="font-display text-sm font-medium tracking-tight">Risk Contribution</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Each asset&apos;s share of total portfolio risk vs its capital weight
      </p>

      {/* Top stats row */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-border/40 bg-background/40 p-3">
        <Stat label="Diversification" value={diversificationRatio.toFixed(2)} hint=">1 = benefit" />
        <Stat label="Effective Bets" value={effectiveBets.toFixed(1)} hint="1/HHI" />
        <Stat label="Concentration" value={(herfindahl * 100).toFixed(0) + "%"} hint="HHI" />
      </div>

      {/* Bars */}
      <ul className="mt-4 space-y-2.5">
        {sorted.map((a, i) => {
          const risk = a.riskContributionPct;
          const weight = a.weight;
          const offset = risk - weight;
          return (
            <li key={a.symbol}>
              <div className="flex items-baseline justify-between font-mono text-[11px]">
                <span className="font-semibold text-foreground">{a.symbol}</span>
                <span className="tabular-nums text-muted-foreground">
                  {(risk * 100).toFixed(1)}% risk &nbsp;&middot;&nbsp; {(weight * 100).toFixed(1)}% wt
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted/40">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: Math.max(0, Math.min(1, risk)) * 100 + "%" }}
                  transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    offset > 0.05 ? "bg-amber-400" : offset < -0.05 ? "bg-[#10b981]" : "bg-primary"
                  )}
                />
              </div>
              {Math.abs(offset) > 0.05 && (
                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                  {offset > 0 ? "Contributes more risk than weight" : "Adds diversification"}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="text-center">
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{value}</p>
      <p className="font-mono text-[9px] text-muted-foreground/70">{hint}</p>
    </div>
  );
}
