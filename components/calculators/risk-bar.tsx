"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

type Props = {
  entry: number;
  stop: number;
  target: number | null;
  long: boolean;
};

export function RiskBar({ entry, stop, target, long }: Props) {
  // Build a 1D number line from the lowest to highest of the three points.
  const points = [stop, entry, ...(target != null ? [target] : [])];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1e-9, max - min);
  const pos = (v: number) => ((v - min) / span) * 100;

  const stopPos = pos(stop);
  const entryPos = pos(entry);
  const targetPos = target != null ? pos(target) : null;

  // Risk zone = between stop and entry. Reward zone = between entry and target.
  const riskLeft = Math.min(stopPos, entryPos);
  const riskWidth = Math.abs(entryPos - stopPos);

  const rewardLeft = targetPos != null ? Math.min(entryPos, targetPos) : null;
  const rewardWidth = targetPos != null ? Math.abs(targetPos - entryPos) : 0;

  return (
    <div className="space-y-3">
      <div className="relative h-12 w-full">
        {/* Track */}
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted/50" />

        {/* Risk zone (red) */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            left: `${riskLeft}%`,
            width: `${riskWidth}%`,
            transformOrigin: long ? "right" : "left",
          }}
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#ef4444]/70 ring-1 ring-inset ring-[#ef4444]/40"
        />

        {/* Reward zone (green) */}
        {rewardLeft != null && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            style={{
              left: `${rewardLeft}%`,
              width: `${rewardWidth}%`,
              transformOrigin: long ? "left" : "right",
            }}
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#10b981]/70 ring-1 ring-inset ring-[#10b981]/40"
          />
        )}

        {/* Markers */}
        <Marker left={stopPos} label="Stop" sub={formatCurrency(stop)} color="#ef4444" align="below" />
        <Marker left={entryPos} label="Entry" sub={formatCurrency(entry)} color="hsl(var(--foreground))" align="above" />
        {targetPos != null && (
          <Marker
            left={targetPos}
            label="Target"
            sub={formatCurrency(target!)}
            color="#10b981"
            align="below"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-[#ef4444]/70" />
          <span className="text-muted-foreground">Risk zone</span>
        </span>
        {target != null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-[#10b981]/70" />
            <span className="text-muted-foreground">Reward zone</span>
          </span>
        )}
      </div>
    </div>
  );
}

function Marker({
  left,
  label,
  sub,
  color,
  align,
}: {
  left: number;
  label: string;
  sub: string;
  color: string;
  align: "above" | "below";
}) {
  return (
    <div
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${left}%` }}
    >
      <span
        className="block h-4 w-0.5"
        style={{ background: color }}
      />
      <div
        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center ${
          align === "above" ? "-top-7" : "top-4"
        }`}
      >
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="font-mono text-[11px] font-semibold" style={{ color }}>
          {sub}
        </div>
      </div>
    </div>
  );
}
