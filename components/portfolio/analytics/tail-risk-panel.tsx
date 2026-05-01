"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsResponse } from "./types";

type Props = {
  varStats: AnalyticsResponse["var"];
};

export function TailRiskPanel({ varStats }: Props) {
  const [confidence, setConfidence] = React.useState<95 | 99>(95);
  const [method, setMethod] = React.useState<"historical" | "parametric">("historical");

  const v =
    confidence === 95
      ? method === "historical"
        ? varStats.var95Hist
        : varStats.var95Param
      : method === "historical"
      ? varStats.var99Hist
      : varStats.var99Param;
  const cv = confidence === 95 ? varStats.cvar95 : varStats.cvar99;

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-sm font-medium tracking-tight">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Tail Risk
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            One-day downside loss at chosen confidence
          </p>
        </div>

        {/* Confidence toggle */}
        <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
          {([95, 99] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setConfidence(c)}
              className={cn(
                "relative rounded-md px-2.5 py-1 font-mono text-[10px] font-medium transition-colors",
                confidence === c ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {confidence === c && (
                <motion.span
                  layoutId="conf-active"
                  className="absolute inset-0 rounded-md bg-card shadow-sm ring-1 ring-inset ring-border/60"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative">{c}%</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric
          label={`VaR (${confidence}%)`}
          value={v}
          hint="Worst loss expected with stated confidence"
        />
        <Metric
          label={`CVaR (${confidence}%)`}
          value={cv}
          hint="Average loss in the worst tail beyond VaR"
          severe
        />
      </div>

      {/* Method toggle */}
      <div className="mt-4 flex items-center gap-2 border-t border-border/40 pt-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Method
        </span>
        <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
          {(["historical", "parametric"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "relative rounded-md px-2.5 py-1 text-[10px] font-medium capitalize transition-colors",
                method === m ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {method === m && (
                <motion.span
                  layoutId="method-active"
                  className="absolute inset-0 rounded-md bg-card shadow-sm ring-1 ring-inset ring-border/60"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative">{m}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={method}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="mt-2 text-[11px] leading-relaxed text-muted-foreground"
        >
          {method === "historical"
            ? "Empirical: percentile of actual past returns. No distributional assumptions."
            : "Gaussian: assumes returns are normally distributed. Useful when history is limited; underestimates true tails."}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  severe,
}: {
  label: string;
  value: number;
  hint: string;
  severe?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-semibold tabular-nums",
          severe ? "text-destructive" : "text-amber-400"
        )}
      >
        −{(value * 100).toFixed(2)}%
      </p>
      <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{hint}</p>
    </div>
  );
}
