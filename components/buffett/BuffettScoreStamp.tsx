"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { BuffettScoreResponse, BuffettLabel } from "@/lib/buffett/types";
import { cn } from "@/lib/utils";

interface Props {
  ticker: string;
}

const LABEL_CFG: Record<
  BuffettLabel,
  { color: string; glow: string; chipBg: string; chipText: string; chipRing: string }
> = {
  "Highly Buffett-Worthy": {
    color: "#B08A3E",
    glow: "0 0 0 1px rgba(176,138,62,0.5), 0 0 40px rgba(176,138,62,0.15), 0 0 80px rgba(176,138,62,0.06)",
    chipBg: "bg-[#B08A3E]/15",
    chipText: "text-[#B08A3E]",
    chipRing: "ring-[#B08A3E]/40",
  },
  "Buffett-Worthy": {
    color: "#B08A3E",
    glow: "0 0 0 1px rgba(176,138,62,0.35), 0 0 30px rgba(176,138,62,0.10), 0 0 60px rgba(176,138,62,0.04)",
    chipBg: "bg-[#B08A3E]/10",
    chipText: "text-[#B08A3E]",
    chipRing: "ring-[#B08A3E]/30",
  },
  Neutral: {
    color: "#f59e0b",
    glow: "0 0 0 1px rgba(245,158,11,0.25), 0 0 30px rgba(245,158,11,0.08), 0 0 60px rgba(245,158,11,0.03)",
    chipBg: "bg-amber-500/10",
    chipText: "text-amber-400",
    chipRing: "ring-amber-400/30",
  },
  Avoid: {
    color: "#ef4444",
    glow: "0 0 0 1px rgba(239,68,68,0.3), 0 0 30px rgba(239,68,68,0.10), 0 0 60px rgba(239,68,68,0.04)",
    chipBg: "bg-[#ef4444]/10",
    chipText: "text-[#ef4444]",
    chipRing: "ring-[#ef4444]/30",
  },
  "Strongly Avoid": {
    color: "#ef4444",
    glow: "0 0 0 1px rgba(239,68,68,0.45), 0 0 40px rgba(239,68,68,0.15), 0 0 80px rgba(239,68,68,0.06)",
    chipBg: "bg-[#ef4444]/10",
    chipText: "text-[#ef4444]",
    chipRing: "ring-[#ef4444]/40",
  },
};

function getBlurb(data: BuffettScoreResponse): string {
  // Prefer AI moat reasoning — most descriptive one-liner
  const moat = data.criteria.find((c) => c.id === "moat");
  if (moat?.reasoning) {
    const sentence = moat.reasoning.split(/\.\s+/)[0];
    return sentence ? sentence + "." : moat.reasoning.slice(0, 140) + "…";
  }
  // Fallback: compare best vs worst criteria
  const sorted = [...data.criteria].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (best && worst && best.id !== worst.id) {
    return `Strongest in ${best.name} (${best.score.toFixed(1)}); weakest in ${worst.name} (${worst.score.toFixed(1)}).`;
  }
  // Final fallback: quote
  const quoteFirst = data.quote.text.split(".")[0];
  return quoteFirst ? quoteFirst + "." : data.quote.text.slice(0, 120);
}

export function BuffettScoreStamp({ ticker }: Props) {
  const [data, setData] = useState<BuffettScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/buffett-score?ticker=${encodeURIComponent(ticker)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: BuffettScoreResponse | null) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div
        className="h-16 animate-pulse rounded-xl bg-card/40 ring-1 ring-inset ring-border/40"
        aria-busy="true"
        aria-label="Loading Buffett Score"
      />
    );
  }

  if (!data) return null;

  const cfg = LABEL_CFG[data.label];
  const blurb = getBlurb(data);

  return (
    <motion.a
      href="#buffett-score"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center gap-4 overflow-hidden rounded-xl bg-card/60 px-5 py-3.5 backdrop-blur-xl transition-opacity hover:opacity-80"
      style={{ boxShadow: cfg.glow }}
      aria-label={`Buffett Score ${data.overall.toFixed(1)} / 10 — ${data.label}. Click for full analysis.`}
    >
      {/* Score numeral */}
      <div className="flex shrink-0 flex-col items-center leading-none">
        <span
          className="font-mono text-[2rem] font-bold tabular-nums leading-none"
          style={{ color: cfg.color }}
        >
          {data.overall.toFixed(1)}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          / 10
        </span>
      </div>

      {/* Vertical divider */}
      <div className="h-9 w-px shrink-0 bg-border/60" />

      {/* Label + blurb */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
              cfg.chipBg,
              cfg.chipText,
              cfg.chipRing
            )}
          >
            {data.label}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Buffett Score
          </span>
        </div>
        <p className="mt-1 line-clamp-1 text-[0.8rem] leading-snug text-muted-foreground">
          {blurb}
        </p>
      </div>

      {/* CTA */}
      <span
        className="hidden shrink-0 text-xs font-semibold uppercase tracking-wider sm:block"
        style={{ color: cfg.color }}
        aria-hidden="true"
      >
        Full analysis ↓
      </span>
    </motion.a>
  );
}
