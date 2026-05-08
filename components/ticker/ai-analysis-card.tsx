"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, RefreshCw, Sparkles, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AiAnalysis, Recommendation } from "@/lib/types";

type State =
  | { kind: "loading" }
  | { kind: "ready"; data: AiAnalysis }
  | { kind: "error"; message: string };

// Glow color by recommendation
const REC_GLOW: Record<Recommendation, string> = {
  "Strong Sell": "0 0 0 1px rgba(239,68,68,0.4), 0 0 40px rgba(239,68,68,0.15), 0 0 80px rgba(239,68,68,0.06)",
  Sell:          "0 0 0 1px rgba(239,68,68,0.3), 0 0 30px rgba(239,68,68,0.10), 0 0 60px rgba(239,68,68,0.04)",
  Hold:          "0 0 0 1px rgba(245,158,11,0.3), 0 0 30px rgba(245,158,11,0.10), 0 0 60px rgba(245,158,11,0.04)",
  Buy:           "0 0 0 1px rgba(16,185,129,0.3), 0 0 30px rgba(16,185,129,0.10), 0 0 60px rgba(16,185,129,0.04)",
  "Strong Buy":  "0 0 0 1px rgba(16,185,129,0.45), 0 0 40px rgba(16,185,129,0.18), 0 0 80px rgba(16,185,129,0.07)",
};

const REC_TINT: Record<Recommendation, string> = {
  "Strong Sell": "radial-gradient(ellipse at 20% 50%, rgba(239,68,68,0.08), transparent 60%)",
  Sell:          "radial-gradient(ellipse at 20% 50%, rgba(239,68,68,0.05), transparent 60%)",
  Hold:          "radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.05), transparent 60%)",
  Buy:           "radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.06), transparent 60%)",
  "Strong Buy":  "radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.09), transparent 60%)",
};

const REC_BADGE: Record<Recommendation, { text: string; ring: string; bg: string }> = {
  "Strong Sell": { text: "text-[#ef4444]", ring: "ring-[#ef4444]/40", bg: "bg-[#ef4444]/10" },
  Sell:          { text: "text-[#ef4444]", ring: "ring-[#ef4444]/30", bg: "bg-[#ef4444]/10" },
  Hold:          { text: "text-amber-400",  ring: "ring-amber-400/30",  bg: "bg-amber-400/10" },
  Buy:           { text: "text-[#10b981]", ring: "ring-[#10b981]/30",  bg: "bg-[#10b981]/10" },
  "Strong Buy":  { text: "text-[#10b981]", ring: "ring-[#10b981]/45",  bg: "bg-[#10b981]/15" },
};

export function AiAnalysisCard({ symbol }: { symbol: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    setRefreshing(refresh);
    if (!refresh) setState({ kind: "loading" });
    try {
      const res = await fetch("/api/ai/ticker-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, refresh }),
      });
      const data = (await res.json()) as AiAnalysis & { error?: string };
      if (!res.ok) {
        setState({ kind: "error", message: data.error ?? "Analysis failed" });
      } else {
        setState({ kind: "ready", data });
      }
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Network error" });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(false); }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  const rec = state.kind === "ready" ? state.data.recommendation : null;

  return (
    <section
      className="relative overflow-hidden rounded-xl bg-card/60 backdrop-blur-xl transition-shadow duration-700"
      style={{
        boxShadow: rec
          ? REC_GLOW[rec]
          : "0 0 0 1px hsl(var(--border)), 0 30px 60px -30px rgba(0,0,0,0.7)",
      }}
    >
      {/* Dynamic tint overlay */}
      {rec && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-all duration-700"
          style={{ background: REC_TINT[rec] }}
        />
      )}

      <div className="relative p-6 md:p-8">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30 shadow-[0_0_16px_hsl(var(--primary)/0.2)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-medium tracking-tight">AI Buy / Sell Signal</h2>
                {state.kind === "ready" && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {state.data.cached ? "· cached" : "· live"}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Powered by Claude Sonnet · Educational only</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void load(true)}
            disabled={refreshing || state.kind === "loading"}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {state.kind === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalysisSkeleton />
            </motion.div>
          )}

          {state.kind === "error" && (
            <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 py-10 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive/60" />
                <div>
                  <p className="font-medium text-destructive">Analysis unavailable</p>
                  <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void load(true)}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
                </Button>
              </div>
            </motion.div>
          )}

          {state.kind === "ready" && (
            <motion.div key="ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AnalysisBody data={state.data} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer disclaimer */}
        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-4">
          <p className="text-[11px] leading-relaxed text-muted-foreground/70 md:max-w-[70%]">
            This analysis is AI-generated for educational purposes only. It is not financial advice.
            Always do your own research and consult a licensed financial advisor before making investment decisions.
          </p>
          {state.kind === "ready" && (
            <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.12em]">
              Analyzed {new Date(state.data.generated_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function AnalysisBody({ data }: { data: AiAnalysis }) {
  const badge = REC_BADGE[data.recommendation];
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
      {/* Left: gauge */}
      <div className="flex flex-col items-center gap-4 md:min-w-[176px]">
        <ScoreGauge score={data.score} />
        <div className={cn("rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset", badge.text, badge.bg, badge.ring)}>
          {data.recommendation}
        </div>
      </div>

      {/* Right: thesis + cases */}
      <div className="space-y-4">
        {/* AI Thesis */}
        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AI Thesis</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{data.summary}</p>
        </div>

        {/* Bull / Bear / Risks */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <CasePanel kind="bull" title="Bull Case" items={data.bull_case} />
          <CasePanel kind="bear" title="Bear Case" items={data.bear_case} />
          <CasePanel kind="risk" title="Key Risks" items={data.key_risks} />
        </div>
      </div>
    </div>
  );
}

function CasePanel({ kind, title, items }: { kind: "bull" | "bear" | "risk"; title: string; items: string[] }) {
  const config = {
    bull: { Icon: CheckCircle2, iconColor: "text-[#10b981]", dotColor: "#10b981", border: "border-[#10b981]/15" },
    bear: { Icon: XCircle,      iconColor: "text-[#ef4444]", dotColor: "#ef4444", border: "border-[#ef4444]/15" },
    risk: { Icon: AlertTriangle, iconColor: "text-amber-400", dotColor: "#f59e0b", border: "border-amber-400/15" },
  }[kind];

  return (
    <div className={cn("rounded-xl border bg-background/30 p-4", config.border)}>
      <div className="mb-3 flex items-center gap-2">
        <config.Icon className={cn("h-4 w-4 shrink-0", config.iconColor)} />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-foreground/85">
            <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: config.dotColor }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(1, Math.min(10, score));
  // Half-circle gauge (top half only, -180deg to 0deg arc)
  const r = 64;
  const cx = 80;
  const cy = 80;
  const strokeWidth = 12;
  // Full semicircle circumference
  const totalArc = Math.PI * r; // half circle
  const fill = ((clamped - 1) / 9) * totalArc;

  const color =
    score <= 3 ? "#ef4444" :
    score <= 5 ? "#f97316" :
    score <= 7 ? "#f59e0b" :
    "#10b981";

  const glowColor =
    score <= 3 ? "rgba(239,68,68,0.5)" :
    score <= 5 ? "rgba(249,115,22,0.5)" :
    score <= 7 ? "rgba(245,158,11,0.5)" :
    "rgba(16,185,129,0.5)";

  return (
    <div className="relative" style={{ width: 160, height: 96 }}>
      <svg viewBox="0 0 160 96" width={160} height={96} aria-hidden>
        <defs>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <motion.path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={totalArc}
          initial={{ strokeDashoffset: totalArc }}
          animate={{ strokeDashoffset: totalArc - fill }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          filter="url(#gauge-glow)"
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
        {/* Zone labels */}
        <text x={cx - r - 4} y={cy + 16} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="monospace">SELL</text>
        <text x={cx + r + 4} y={cy + 16} textAnchor="start" fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="monospace">BUY</text>
      </svg>

      {/* Score in center */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <motion.span
          key={score}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
          className="font-mono text-4xl font-bold tabular-nums leading-none"
          style={{ color }}
        >
          {score.toFixed(1)}
        </motion.span>
        <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">/ 10</span>
      </div>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-4 md:min-w-[176px]">
        {/* Pulsing "Analyzing..." indicator */}
        <div className="flex h-[96px] w-[160px] flex-col items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-[signal-pulse_1s_ease-in-out_infinite] rounded-full bg-primary" />
            <span className="h-2 w-2 animate-[signal-pulse_1s_ease-in-out_0.2s_infinite] rounded-full bg-primary" />
            <span className="h-2 w-2 animate-[signal-pulse_1s_ease-in-out_0.4s_infinite] rounded-full bg-primary" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Analyzing…</p>
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-border/60 p-4">
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-[88%]" />
          <Skeleton className="mt-2 h-3 w-[72%]" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border/60 p-4">
              <Skeleton className="mb-3 h-3 w-20" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[90%]" />
                <Skeleton className="h-3 w-[80%]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
