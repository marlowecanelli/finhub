"use client";

import { motion } from "framer-motion";
import { RISK_DRAWDOWNS, RISK_LABELS } from "@/lib/builder";
import { cn } from "@/lib/utils";

type Props = {
  value: number; // 1-5
  onChange: (v: number) => void;
};

export function RiskSlider({ value, onChange }: Props) {
  const idx = value - 1;
  const current = RISK_DRAWDOWNS[idx]!;

  return (
    <div className="glass space-y-6 p-6">
      {/* Segmented track */}
      <div className="relative px-1">
        <div className="flex h-2 overflow-hidden rounded-full">
          {[0, 1, 2, 3, 4].map((i) => {
            const colors = ["bg-[#10b981]/70", "bg-[#22c55e]/70", "bg-amber-500/70", "bg-orange-500/70", "bg-[#ef4444]/70"];
            const inactive = i > idx;
            return (
              <div
                key={i}
                className={cn(
                  "h-full flex-1 transition-opacity",
                  colors[i],
                  inactive && "opacity-25"
                )}
              />
            );
          })}
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-x-0 top-0 h-2 w-full cursor-pointer opacity-0"
          aria-label="Risk tolerance"
        />
        <motion.div
          layout
          className="pointer-events-none absolute -top-2 h-6 w-6 rounded-full border-2 border-background bg-foreground shadow-lg"
          style={{ left: `calc(${(idx / 4) * 100}% - 12px)` }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>

      <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {RISK_LABELS.map((l, i) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(i + 1)}
            className={cn(
              "max-w-[20%] flex-1 truncate text-center transition-colors hover:text-foreground",
              i === idx && "text-foreground"
            )}
          >
            {l.split("-")[0]}
          </button>
        ))}
      </div>

      <motion.div
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-border/60 bg-card/40 p-4"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {current.label}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Typical drawdown
            </p>
            <p className="mt-0.5 font-mono text-base font-semibold text-[#ef4444]">
              {current.drawdown}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Expected annual return
            </p>
            <p className="mt-0.5 font-mono text-base font-semibold text-[#10b981]">
              {current.expected}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
