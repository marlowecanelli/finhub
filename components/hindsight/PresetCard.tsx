"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Preset } from "@/lib/hindsight/presets";
import { cn } from "@/lib/utils";

type Props = {
  preset: Preset;
  amount?: number;
  onPick: (preset: Preset) => void;
};

export function PresetCard({ preset, amount = 1000, onPick }: Props) {
  const [teaser, setTeaser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchTeaser() {
    if (teaser || loading) return;
    setLoading(true);
    try {
      const r = await fetch("/api/hindsight/timemachine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: preset.ticker,
          date: preset.date,
          amount,
          reinvestDividends: true,
        }),
      });
      const j = await r.json();
      if (j.finalValue) {
        const formatted = new Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(j.finalValue);
        setTeaser(`Worth $${formatted}`);
      }
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => onPick(preset)}
      onMouseEnter={fetchTeaser}
      onFocus={fetchTeaser}
      className={cn(
        "group relative flex flex-col rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-5 text-left",
        "transition-all duration-500 hover:border-hindsight-gain/30 hover:from-hindsight-gain/[0.08]",
        "hover:-translate-y-0.5"
      )}
      style={{
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-hindsight-gain/80">
            {preset.ticker}
          </div>
          <div className="mt-1 font-display text-xl text-white">
            {preset.label}
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-white/30 transition-all group-hover:text-hindsight-gain group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>

      <div className="mt-3 text-sm text-white/50">{preset.blurb}</div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="font-mono text-[11px] text-white/40">
          $1,000 on {preset.date}
        </span>
        <span className="font-mono text-[11px] text-hindsight-gain transition-opacity">
          {teaser ?? (loading ? "…" : "Hover to reveal")}
        </span>
      </div>
    </button>
  );
}
