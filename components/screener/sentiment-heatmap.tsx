"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Newspaper, TrendingDown, TrendingUp } from "lucide-react";
import { cn, formatCompact, formatPercent } from "@/lib/utils";
import type { ScreenerRow } from "@/lib/screener";

type NewsArticle = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  tickers: string[];
  impact: "low" | "high" | "breaking";
};

type SentimentInfo = {
  symbol: string;
  changePct: number;
  marketCap: number;
  newsCount: number;
  breakingCount: number;
  highImpactCount: number;
  recentTitle: string | null;
  sentimentScore: number; // -1 to 1
};

const POS_WORDS = [
  "beat",
  "beats",
  "soar",
  "surge",
  "rally",
  "raise",
  "raises",
  "raised",
  "upgrade",
  "upgraded",
  "buyback",
  "record",
  "strong",
  "growth",
  "outperform",
  "approval",
  "approved",
  "win",
  "wins",
  "hike",
  "boost",
  "boosts",
  "jump",
  "jumps",
];
const NEG_WORDS = [
  "miss",
  "misses",
  "drop",
  "plunge",
  "plunges",
  "tumble",
  "fall",
  "falls",
  "cut",
  "cuts",
  "downgrade",
  "downgraded",
  "lawsuit",
  "investigation",
  "probe",
  "loss",
  "losses",
  "weak",
  "concerns",
  "warning",
  "layoffs",
  "fraud",
  "decline",
  "slump",
  "slumps",
];

function scoreText(text: string): number {
  const t = text.toLowerCase();
  let s = 0;
  for (const w of POS_WORDS) if (t.includes(w)) s += 1;
  for (const w of NEG_WORDS) if (t.includes(w)) s -= 1;
  return s;
}

function colorForSentiment(s: number, change: number): string {
  // Combine: 60% price move, 40% news sentiment.
  const blended = clamp(change / 5, -1, 1) * 0.6 + clamp(s / 3, -1, 1) * 0.4;
  if (blended >= 0.6) return "rgba(16, 185, 129, 0.85)"; // strong green
  if (blended >= 0.3) return "rgba(16, 185, 129, 0.55)";
  if (blended >= 0.05) return "rgba(16, 185, 129, 0.28)";
  if (blended <= -0.6) return "rgba(239, 68, 68, 0.85)";
  if (blended <= -0.3) return "rgba(239, 68, 68, 0.55)";
  if (blended <= -0.05) return "rgba(239, 68, 68, 0.28)";
  return "rgba(120, 130, 150, 0.18)";
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

type Props = {
  rows: ScreenerRow[];
  refreshing: boolean;
  onRefresh: () => void;
};

export function SentimentHeatmap({ rows, refreshing, onRefresh }: Props) {
  const router = useRouter();
  const [news, setNews] = React.useState<NewsArticle[]>([]);
  const [newsLoaded, setNewsLoaded] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [bucket, setBucket] = React.useState<"all" | "bull" | "bear">("all");
  const [pulseKey, setPulseKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/news")
      .then((r) => r.json())
      .then((j: { articles?: NewsArticle[] }) => {
        if (cancelled) return;
        setNews(j.articles ?? []);
        setNewsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setNewsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pulse the LIVE badge every 2s
  React.useEffect(() => {
    const id = setInterval(() => setPulseKey((k) => k + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const sentimentMap = React.useMemo(() => {
    const map = new Map<
      string,
      { count: number; breaking: number; high: number; score: number; title: string | null }
    >();
    for (const a of news) {
      const titleScore = scoreText(a.title);
      for (const t of a.tickers) {
        const cur =
          map.get(t) ?? { count: 0, breaking: 0, high: 0, score: 0, title: null };
        cur.count += 1;
        if (a.impact === "breaking") cur.breaking += 1;
        if (a.impact === "high") cur.high += 1;
        cur.score += titleScore;
        if (!cur.title) cur.title = a.title;
        map.set(t, cur);
      }
    }
    return map;
  }, [news]);

  const cells: SentimentInfo[] = React.useMemo(() => {
    const top = rows
      .filter((r) => r.marketCap != null && r.changePct != null)
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
      .slice(0, 80);
    return top.map((r) => {
      const n = sentimentMap.get(r.symbol);
      return {
        symbol: r.symbol,
        changePct: r.changePct ?? 0,
        marketCap: r.marketCap ?? 0,
        newsCount: n?.count ?? 0,
        breakingCount: n?.breaking ?? 0,
        highImpactCount: n?.high ?? 0,
        recentTitle: n?.title ?? null,
        sentimentScore: n?.score ?? 0,
      };
    });
  }, [rows, sentimentMap]);

  const filtered = React.useMemo(() => {
    if (bucket === "all") return cells;
    if (bucket === "bull") return cells.filter((c) => c.changePct > 0);
    return cells.filter((c) => c.changePct < 0);
  }, [cells, bucket]);

  const stats = React.useMemo(() => {
    const up = cells.filter((c) => c.changePct > 0).length;
    const down = cells.filter((c) => c.changePct < 0).length;
    const breaking = cells.reduce((s, c) => s + c.breakingCount, 0);
    return { up, down, breaking, total: cells.length };
  }, [cells]);

  const hoveredCell = hovered ? cells.find((c) => c.symbol === hovered) : null;

  return (
    <section className="space-y-4">
      {/* Header strip */}
      <div className="glass flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <LiveBadge pulseKey={pulseKey} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Market Sentiment
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {stats.total} tickers · {stats.up} up · {stats.down} down ·{" "}
              {stats.breaking} breaking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border/60 bg-background/40 p-0.5 text-xs">
            {(
              [
                { k: "all", label: "All" },
                { k: "bull", label: "Bullish" },
                { k: "bear", label: "Bearish" },
              ] as const
            ).map((b) => (
              <button
                key={b.k}
                type="button"
                onClick={() => setBucket(b.k)}
                className={cn(
                  "rounded px-2.5 py-1 font-mono uppercase tracking-wider transition-colors",
                  bucket === b.k
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-md border border-border/60 bg-background/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="glass relative overflow-hidden p-4">
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {filtered.map((c) => {
            const bg = colorForSentiment(c.sentimentScore, c.changePct);
            const isUp = c.changePct >= 0;
            const hot = c.breakingCount > 0;
            return (
              <motion.button
                key={c.symbol}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setHovered(c.symbol)}
                onMouseLeave={() => setHovered(null)}
                onClick={() =>
                  router.push(`/ticker/${encodeURIComponent(c.symbol)}`)
                }
                className={cn(
                  "group relative flex aspect-square flex-col justify-between rounded-md p-2 text-left transition-all",
                  "hover:scale-[1.06] hover:z-10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
                  "focus:outline-none focus:ring-2 focus:ring-foreground/40"
                )}
                style={{ backgroundColor: bg }}
              >
                {hot && (
                  <span
                    className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]"
                    aria-label="Breaking news"
                  />
                )}
                <span className="font-mono text-[11px] font-semibold leading-none text-white drop-shadow-sm">
                  {c.symbol}
                </span>
                <span
                  className={cn(
                    "font-mono text-[10px] tabular-nums leading-none drop-shadow-sm",
                    isUp ? "text-white" : "text-white"
                  )}
                >
                  {formatPercent(c.changePct)}
                </span>
              </motion.button>
            );
          })}
        </div>

        {!newsLoaded && (
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Loading sentiment feed…
          </p>
        )}

        {/* Hover detail card */}
        <AnimatePresence mode="wait">
          {hoveredCell && (
            <motion.div
              key={hoveredCell.symbol}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none absolute bottom-4 left-1/2 z-20 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-lg border border-border/60 bg-background/95 p-3 shadow-xl backdrop-blur"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    {hoveredCell.symbol}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-mono text-xs tabular-nums",
                      hoveredCell.changePct >= 0
                        ? "text-[#10b981]"
                        : "text-[#ef4444]"
                    )}
                  >
                    {hoveredCell.changePct >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatPercent(hoveredCell.changePct)}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {formatCompact(hoveredCell.marketCap)} cap
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  <Newspaper className="h-3 w-3" />
                  {hoveredCell.newsCount}
                  {hoveredCell.breakingCount > 0 && (
                    <span className="rounded-sm bg-amber-400/20 px-1 text-amber-300">
                      {hoveredCell.breakingCount} BREAKING
                    </span>
                  )}
                </div>
              </div>
              {hoveredCell.recentTitle && (
                <p className="mt-1.5 line-clamp-2 text-xs text-foreground/80">
                  {hoveredCell.recentTitle}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2 font-mono">
          <Activity className="h-3 w-3" />
          <span>Color blends day move + headline sentiment</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono">Bearish</span>
          <span className="h-2.5 w-6 rounded-l" style={{ backgroundColor: "rgba(239, 68, 68, 0.85)" }} />
          <span className="h-2.5 w-6" style={{ backgroundColor: "rgba(239, 68, 68, 0.4)" }} />
          <span className="h-2.5 w-6" style={{ backgroundColor: "rgba(120, 130, 150, 0.18)" }} />
          <span className="h-2.5 w-6" style={{ backgroundColor: "rgba(16, 185, 129, 0.4)" }} />
          <span className="h-2.5 w-6 rounded-r" style={{ backgroundColor: "rgba(16, 185, 129, 0.85)" }} />
          <span className="ml-1 font-mono">Bullish</span>
        </div>
      </div>
    </section>
  );
}

function LiveBadge({ pulseKey }: { pulseKey: number }) {
  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1">
      <span className="relative grid h-2 w-2 place-items-center">
        <span className="absolute inline-block h-2 w-2 rounded-full bg-emerald-400" />
        <motion.span
          key={pulseKey}
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="absolute inline-block h-2 w-2 rounded-full bg-emerald-400"
        />
      </span>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
        Live
      </span>
    </div>
  );
}
