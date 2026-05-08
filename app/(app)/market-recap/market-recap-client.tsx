"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Clock,
  BarChart3,
  Zap,
  Eye,
} from "lucide-react";
import type { MarketRecap, IndexSnapshot, SectorSnapshot, TopMover } from "@/lib/market-recap";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number | null, decimals = 2): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(n: number | null): string {
  if (n === null) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function colorClass(n: number | null): string {
  if (n === null) return "text-muted-foreground";
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-red-400";
  return "text-muted-foreground";
}

function bgColorClass(n: number | null): string {
  if (n === null) return "bg-muted/30";
  if (n > 0) return "bg-emerald-500/10 border-emerald-500/20";
  if (n < 0) return "bg-red-500/10 border-red-500/20";
  return "bg-muted/20 border-border";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }) + " ET";
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  const [y, m, d] = [parts[0] ?? 0, parts[1] ?? 1, parts[2] ?? 1];
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function IndexPill({ idx }: { idx: IndexSnapshot }) {
  const Icon = idx.changePct === null ? Minus : idx.changePct >= 0 ? TrendingUp : TrendingDown;
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-xl border px-3 py-2.5 min-w-[100px] ${bgColorClass(idx.changePct)}`}
    >
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none">
        {idx.label}
      </span>
      <span className="text-sm font-semibold text-foreground font-mono leading-tight">
        {idx.symbol === "^VIX" || idx.symbol === "^TNX"
          ? fmt(idx.price)
          : idx.price !== null
          ? idx.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
          : "—"}
      </span>
      <span className={`text-[11px] font-medium flex items-center gap-0.5 ${colorClass(idx.changePct)}`}>
        <Icon className="w-2.5 h-2.5" />
        {fmtPct(idx.changePct)}
      </span>
    </div>
  );
}

function SectorBar({ sector, max }: { sector: SectorSnapshot; max: number }) {
  const pct = sector.changePct ?? 0;
  const width = max > 0 ? Math.abs(pct / max) * 100 : 0;
  const isPos = pct >= 0;
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate group-hover:text-foreground transition-colors">
        {sector.label}
      </span>
      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isPos ? "bg-emerald-500" : "bg-red-500"}`}
          style={{ originX: isPos ? 0 : 1 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: width / 100 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
        />
      </div>
      <span className={`text-xs font-mono w-14 text-right shrink-0 ${colorClass(sector.changePct)}`}>
        {fmtPct(sector.changePct)}
      </span>
    </div>
  );
}

function MoverChip({ mover }: { mover: TopMover }) {
  const isPos = mover.changePct >= 0;
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${bgColorClass(mover.changePct)}`}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-foreground font-mono tracking-wide">
          {mover.symbol}
        </span>
        <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
          {mover.name}
        </span>
      </div>
      <span className={`text-xs font-semibold ml-auto shrink-0 ${isPos ? "text-emerald-400" : "text-red-400"}`}>
        {fmtPct(mover.changePct)}
      </span>
    </div>
  );
}

const SECTION_META = [
  {
    key: "paragraph_movers" as const,
    icon: BarChart3,
    label: "What Moved",
    accent: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
  },
  {
    key: "paragraph_why" as const,
    icon: Zap,
    label: "Why It Happened",
    accent: "text-violet-400",
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
  },
  {
    key: "paragraph_tomorrow" as const,
    icon: Eye,
    label: "Watch Tomorrow",
    accent: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.08 },
  }),
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyRecap() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
      <div className="rounded-2xl bg-muted/20 border border-border p-5">
        <Sparkles className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-base font-semibold text-foreground">
          No recap yet today
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The AI recap is generated automatically at 4:30&nbsp;PM&nbsp;ET each trading day.
          Check back after market close.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
  initialRecap: MarketRecap | null;
};

export function MarketRecapClient({ initialRecap }: Props) {
  const recap = initialRecap;

  return (
    <div className="min-h-screen pb-16">
      {/* ── Page header ── */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Market Recap</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            AI-generated daily summary
          </span>
        </div>
        {recap && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Generated {formatTime(recap.generated_at)}</span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {!recap ? (
          <EmptyRecap />
        ) : (
          <>
            {/* ── Hero headline ── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="w-3 h-3" />
                  AI Summary
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(recap.recap_date)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug tracking-tight font-[var(--font-fraunces)]">
                {recap.headline}
              </h1>
            </motion.div>

            {/* ── Indices strip ── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="space-y-3"
            >
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Market Snapshot
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {(recap.indices_data as IndexSnapshot[]).map((idx) => (
                  <IndexPill key={idx.symbol} idx={idx} />
                ))}
              </div>
            </motion.div>

            {/* ── Three analysis paragraphs ── */}
            <div className="space-y-4">
              {SECTION_META.map((meta, i) => {
                const text = recap[meta.key];
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={meta.key}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={i + 2}
                    className={`rounded-2xl border ${meta.border} ${meta.bg} p-5 sm:p-6 space-y-3`}
                  >
                    <div className={`flex items-center gap-2 ${meta.accent}`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold uppercase tracking-wider">
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm sm:text-[15px] text-foreground/90 leading-relaxed">
                      {text}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Two-column: sectors + movers ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sector performance */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={5}
                className="rounded-2xl border border-border bg-card/50 p-5 space-y-4"
              >
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Sector Performance
                </h2>
                <div className="space-y-2.5">
                  {(recap.sectors_data as SectorSnapshot[])
                    .slice()
                    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))
                    .map((sector) => {
                      const maxAbs = Math.max(
                        ...((recap.sectors_data as SectorSnapshot[]).map(
                          (s) => Math.abs(s.changePct ?? 0)
                        ))
                      );
                      return (
                        <SectorBar key={sector.symbol} sector={sector} max={maxAbs} />
                      );
                    })}
                </div>
              </motion.div>

              {/* Top movers */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={6}
                className="rounded-2xl border border-border bg-card/50 p-5 space-y-4"
              >
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Biggest Movers
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {(recap.top_movers as TopMover[]).map((m) => (
                    <MoverChip key={m.symbol} mover={m} />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── Footer note ── */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={7}
              className="text-xs text-muted-foreground/60 text-center pb-4"
            >
              Generated by AI using end-of-day market data. Not financial advice.
              New recap published each trading day at 4:30&nbsp;PM&nbsp;ET.
            </motion.p>
          </>
        )}
      </div>
    </div>
  );
}
