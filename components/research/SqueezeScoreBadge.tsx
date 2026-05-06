"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SqueezeScoreBreakdown } from "@/lib/types/research";

interface SqueezeScoreBadgeProps {
  score: number;
  breakdown?: SqueezeScoreBreakdown;
}

function scoreColor(score: number): string {
  if (score >= 65) return "#FF4545";
  if (score >= 40) return "#FFB347";
  return "#39FF14";
}

export function SqueezeScoreBadge({ score, breakdown }: SqueezeScoreBadgeProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const color = scoreColor(score);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowBreakdown(true)}
        onMouseLeave={() => setShowBreakdown(false)}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono font-bold transition-all"
        style={{
          background: `${color}18`,
          color,
          border: `1px solid ${color}35`,
        }}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
        />
        {score}
      </button>

      {showBreakdown && breakdown && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-56 rounded-lg p-3 shadow-2xl"
          style={{ background: "#0D0F14", border: "1px solid #1E2130" }}
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block mb-2">
            Score Breakdown
          </span>
          {[
            { label: "SI % Float",     val: breakdown.siPctScore,          max: 30 },
            { label: "Days to Cover",  val: breakdown.daysToCoverScore,    max: 25 },
            { label: "SI Trend",       val: breakdown.siTrendScore,        max: 20 },
            { label: "Borrow Rate",    val: breakdown.borrowRateScore,     max: 15 },
            { label: "Rel. Volume",    val: breakdown.relativeVolumeScore, max: 10 },
          ].map(({ label, val, max }) => (
            <div key={label} className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-[#717A94] w-24 flex-shrink-0">{label}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1E2130" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(val / max) * 100}%`, background: scoreColor(score) }}
                />
              </div>
              <span className="text-[10px] font-mono text-[#C8D0E7] w-10 text-right">
                {val.toFixed(1)}/{max}
              </span>
            </div>
          ))}
          <div
            className="flex items-center justify-between pt-2 mt-1 border-t"
            style={{ borderColor: "#1E2130" }}
          >
            <span className="text-[10px] font-mono text-[#717A94]">Total</span>
            <span className="text-[11px] font-mono font-bold" style={{ color }}>
              {breakdown.total}/100
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
