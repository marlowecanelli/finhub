"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Clock,
  BarChart3,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
  Archive,
  Loader2,
  CalendarDays,
} from "lucide-react";
import type {
  MarketRecap,
  RecapSummary,
  IndexSnapshot,
  SectorSnapshot,
  TopMover,
} from "@/lib/market-recap";

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
  if (n === null) return "bg-muted/30 border-border";
  if (n > 0) return "bg-emerald-500/10 border-emerald-500/20";
  if (n < 0) return "bg-red-500/10 border-red-500/20";
  return "bg-muted/20 border-border";
}

function formatTime(iso: string): string {
  return (
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    }) + " ET"
  );
}

function formatDateLong(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  const [y, m, d] = [parts[0] ?? 0, parts[1] ?? 1, parts[2] ?? 1];
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  const [y, m, d] = [parts[0] ?? 0, parts[1] ?? 1, parts[2] ?? 1];
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatWeekday(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  const [y, m, d] = [parts[0] ?? 0, parts[1] ?? 1, parts[2] ?? 1];
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

function todayET(): string {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  )
    .toISOString()
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Sub-components — recap display
// ---------------------------------------------------------------------------

function IndexPill({ idx }: { idx: IndexSnapshot }) {
  const Icon =
    idx.changePct === null ? Minus : idx.changePct >= 0 ? TrendingUp : TrendingDown;
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
          ? idx.price.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : "—"}
      </span>
      <span
        className={`text-[11px] font-medium flex items-center gap-0.5 ${colorClass(idx.changePct)}`}
      >
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
      <span
        className={`text-xs font-mono w-14 text-right shrink-0 ${colorClass(sector.changePct)}`}
      >
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
      <span
        className={`text-xs font-semibold ml-auto shrink-0 ${
          isPos ? "text-emerald-400" : "text-red-400"
        }`}
      >
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
// Archive card
// ---------------------------------------------------------------------------

function ArchiveCard({
  summary,
  isActive,
  isLatest,
  onClick,
}: {
  summary: RecapSummary;
  isActive: boolean;
  isLatest: boolean;
  onClick: () => void;
}) {
  const sp = summary.sp_change_pct;
  const isPos = sp !== null && sp >= 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        ${
          isActive
            ? "border-primary/40 bg-primary/5 shadow-sm"
            : "border-border bg-card/40 hover:border-border/80 hover:bg-card/70"
        }`}
    >
      {/* Top row: weekday + date + badges */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {formatWeekday(summary.recap_date)}
          </span>
          <span className="text-xs font-semibold text-foreground">
            {formatDateShort(summary.recap_date)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isLatest && (
            <span className="text-[9px] font-semibold uppercase tracking-wider rounded-full bg-primary/15 text-primary px-1.5 py-0.5">
              Latest
            </span>
          )}
          {sp !== null && (
            <span
              className={`text-[10px] font-mono font-semibold ${
                isPos ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {fmtPct(sp)}
            </span>
          )}
          {/* S&P direction dot */}
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              sp === null ? "bg-muted-foreground/40" : isPos ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
        </div>
      </div>

      {/* Headline */}
      <p
        className={`text-xs leading-snug line-clamp-2 transition-colors ${
          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
        }`}
      >
        {summary.headline}
      </p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

function EmptyRecap() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
      <div className="rounded-2xl bg-muted/20 border border-border p-5">
        <Sparkles className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-base font-semibold text-foreground">No recap yet today</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The AI recap is generated automatically at 4:30&nbsp;PM&nbsp;ET each trading day.
          Check back after market close.
        </p>
      </div>
    </div>
  );
}

function RecapSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="space-y-3">
        <div className="h-5 w-48 rounded-full bg-muted/40" />
        <div className="h-8 w-3/4 rounded-lg bg-muted/40" />
        <div className="h-8 w-1/2 rounded-lg bg-muted/30" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-16 w-24 shrink-0 rounded-xl bg-muted/30" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-muted/10 p-6 space-y-3">
          <div className="h-4 w-32 rounded bg-muted/40" />
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded bg-muted/30" />
            <div className="h-3.5 w-5/6 rounded bg-muted/30" />
            <div className="h-3.5 w-4/5 rounded bg-muted/25" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main recap display
// ---------------------------------------------------------------------------

function RecapView({ recap }: { recap: MarketRecap }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={recap.recap_date}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-10"
      >
        {/* Hero headline */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="w-3 h-3" />
              AI Summary
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateLong(recap.recap_date)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug tracking-tight">
            {recap.headline}
          </h1>
        </motion.div>

        {/* Indices strip */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Market Snapshot
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(recap.indices_data as IndexSnapshot[]).map((idx) => (
              <IndexPill key={idx.symbol} idx={idx} />
            ))}
          </div>
        </motion.div>

        {/* Three paragraphs */}
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
                <p className="text-sm sm:text-[15px] text-foreground/90 leading-relaxed">{text}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Sectors + movers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    ...((recap.sectors_data as SectorSnapshot[]).map((s) =>
                      Math.abs(s.changePct ?? 0)
                    ))
                  );
                  return <SectorBar key={sector.symbol} sector={sector} max={maxAbs} />;
                })}
            </div>
          </motion.div>

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

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={7}
          className="text-xs text-muted-foreground/60 text-center pb-4"
        >
          Generated by AI using end-of-day market data. Not financial advice. New recap published
          each trading day at 4:30&nbsp;PM&nbsp;ET.
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
  initialRecap: MarketRecap | null;
  initialArchive: RecapSummary[];
};

export function MarketRecapClient({ initialRecap, initialArchive }: Props) {
  const [recap, setRecap] = React.useState<MarketRecap | null>(initialRecap);
  const [archive, setArchive] = React.useState<RecapSummary[]>(initialArchive);
  const [activeDate, setActiveDate] = React.useState<string | null>(
    initialRecap?.recap_date ?? null
  );
  const [loadingDate, setLoadingDate] = React.useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  const latestDate = archive[0]?.recap_date ?? null;
  const today = todayET();
  const isViewingLatest = activeDate === latestDate;

  // Navigate prev/next within archive
  const currentIdx = archive.findIndex((s) => s.recap_date === activeDate);
  const canGoPrev = currentIdx < archive.length - 1; // older
  const canGoNext = currentIdx > 0; // newer

  async function selectDate(date: string) {
    if (date === activeDate) return;
    setLoadingDate(date);
    try {
      const res = await fetch(`/api/market-recap?date=${date}`);
      const data = (await res.json()) as { recap: MarketRecap | null };
      if (data.recap) {
        setRecap(data.recap);
        setActiveDate(date);
      }
    } finally {
      setLoadingDate(null);
    }
  }

  function goToPrev() {
    const next = archive[currentIdx + 1];
    if (next) selectDate(next.recap_date);
  }

  function goToNext() {
    const next = archive[currentIdx - 1];
    if (next) selectDate(next.recap_date);
  }

  function goToLatest() {
    if (latestDate) selectDate(latestDate);
  }

  return (
    <div className="min-h-screen pb-16">
      {/* ── Sticky page header ── */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">Market Recap</span>
          {recap && (
            <span className="text-xs text-muted-foreground hidden sm:inline truncate">
              {formatDateShort(recap.recap_date)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Prev/Next navigator */}
          {archive.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrev}
                disabled={!canGoPrev || loadingDate !== null}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNext}
                disabled={!canGoNext || loadingDate !== null}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Archive toggle */}
          {archive.length > 0 && (
            <button
              onClick={() => setArchiveOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                archiveOpen
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Archive</span>
            </button>
          )}

          {recap && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pl-1 border-l border-border/50">
              <Clock className="w-3 h-3" />
              <span className="hidden md:inline">{formatTime(recap.generated_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Archive panel (collapsible) ── */}
      <AnimatePresence>
        {archiveOpen && archive.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-b border-border bg-background/60 backdrop-blur-sm"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    Past 30 Days
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({archive.length} recap{archive.length !== 1 ? "s" : ""})
                  </span>
                </div>
                {!isViewingLatest && latestDate && (
                  <button
                    onClick={() => { goToLatest(); setArchiveOpen(false); }}
                    className="text-xs text-primary hover:underline"
                  >
                    ← Back to latest
                  </button>
                )}
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {archive.map((summary, i) => (
                  <motion.div
                    key={summary.recap_date}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                  >
                    <ArchiveCard
                      summary={summary}
                      isActive={summary.recap_date === activeDate}
                      isLatest={i === 0}
                      onClick={() => {
                        selectDate(summary.recap_date);
                        setArchiveOpen(false);
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {loadingDate !== null ? (
          <div className="flex items-center justify-center py-32 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading recap…</span>
          </div>
        ) : recap === null ? (
          <EmptyRecap />
        ) : (
          <RecapView recap={recap} />
        )}
      </div>
    </div>
  );
}
