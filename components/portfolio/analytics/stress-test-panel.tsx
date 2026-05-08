"use client";

import { motion } from "framer-motion";
import { AlertOctagon } from "lucide-react";

type Props = {
  scenarios: Array<{
    name: string;
    period: string;
    description: string;
    benchShock: number;
    estimatedReturn: number;
  }>;
  portfolioBeta: number;
};

export function StressTestPanel({ scenarios, portfolioBeta }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <AlertOctagon className="h-4 w-4 text-amber-400" />
        <h3 className="font-display text-sm font-medium tracking-tight">Historical Stress Tests</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Beta-weighted estimate (β = {portfolioBeta.toFixed(2)}) of portfolio response to historical
        crisis windows. Indicative — does not account for sector dispersion or factor crowding.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((s, i) => {
          const severe = s.estimatedReturn < -0.15;
          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="rounded-lg border border-border/40 bg-background/30 p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-sm font-medium tracking-tight">{s.name}</p>
                <p className={"font-mono text-base font-semibold tabular-nums " + (severe ? "text-destructive" : "text-amber-400")}>
                  {(s.estimatedReturn * 100).toFixed(1)}%
                </p>
              </div>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.period}
              </p>
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                {s.description}
              </p>
              <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-1.5 font-mono text-[9px] text-muted-foreground">
                <span>SPY: {(s.benchShock * 100).toFixed(1)}%</span>
                <span>Est. P&amp;L on 100k: ${Math.round(s.estimatedReturn * 100000).toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
