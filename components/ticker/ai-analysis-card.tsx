"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AiAnalysis, Recommendation } from "@/lib/types";

type State =
  | { kind: "loading" }
  | { kind: "ready"; data: AiAnalysis }
  | { kind: "error"; message: string };

const REC_STYLES: Record<Recommendation, { text: string; ring: string; bg: string }> = {
  "Strong Sell": { text: "text-[#ef4444]", ring: "ring-[#ef4444]/40", bg: "bg-[#ef4444]/10" },
  Sell:          { text: "text-[#ef4444]", ring: "ring-[#ef4444]/30", bg: "bg-[#ef4444]/10" },
  Hold:          { text: "text-amber-500", ring: "ring-amber-500/30",  bg: "bg-amber-500/10" },
  Buy:           { text: "text-[#10b981]", ring: "ring-[#10b981]/30",  bg: "bg-[#10b981]/10" },
  "Strong Buy":  { text: "text-[#10b981]", ring: "ring-[#10b981]/40",  bg: "bg-[#10b981]/10" },
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
      const data = await res.json();
      if (!res.ok) {
        setState({ kind: "error", message: data.error ?? "Analysis failed" });
      } else {
        setState({ kind: "ready", data });
      }
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  return (
    <section className="glass relative overflow-hidden p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">AI buy/sell signal</h2>
            <p className="text-xs text-muted-foreground">
              {state.kind === "ready" && state.data.cached
                ? "Cached analysis"
                : "Fresh analysis"}{" "}
              · Claude Sonnet
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => load(true)}
          disabled={refreshing || state.kind === "loading"}
          aria-label="Refresh analysis"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {state.kind === "loading" && <AnalysisSkeleton />}

      {state.kind === "error" && (
        <div className="relative mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mr-1.5 inline h-4 w-4 align-[-2px]" />
          Couldn&apos;t generate analysis: {state.message}
        </div>
      )}

      {state.kind === "ready" && <AnalysisBody data={state.data} />}

      <p className="relative mt-6 text-xs text-muted-foreground">
        AI-generated analysis for educational purposes only. Not financial advice.
      </p>
    </section>
  );
}

function AnalysisBody({ data }: { data: AiAnalysis }) {
  const style = REC_STYLES[data.recommendation];
  return (
    <div className="relative mt-6 grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        <ScoreGauge score={data.score} />
        <div
          className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset",
            style.text,
            style.bg,
            style.ring
          )}
        >
          {data.recommendation}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CasePanel
            kind="bull"
            title="Bull case"
            items={data.bull_case}
          />
          <CasePanel
            kind="bear"
            title="Bear case"
            items={data.bear_case}
          />
          <CasePanel
            kind="risk"
            title="Key risks"
            items={data.key_risks}
          />
        </div>
        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Thesis
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {data.summary}
          </p>
        </div>
      </div>
    </div>
  );
}

function CasePanel({
  kind,
  title,
  items,
}: {
  kind: "bull" | "bear" | "risk";
  title: string;
  items: string[];
}) {
  const Icon = kind === "bull" ? TrendingUp : kind === "bear" ? TrendingDown : AlertTriangle;
  const color =
    kind === "bull"
      ? "text-[#10b981] bg-[#10b981]/10 ring-[#10b981]/25"
      : kind === "bear"
        ? "text-[#ef4444] bg-[#ef4444]/10 ring-[#ef4444]/25"
        : "text-amber-500 bg-amber-500/10 ring-amber-500/25";

  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-md ring-1 ring-inset", color)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-snug text-foreground/90">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(1, Math.min(10, score));
  const pct = (clamped - 1) / 9;
  const r = 58;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const color =
    score <= 4 ? "#ef4444" : score <= 6 ? "#f59e0b" : "#10b981";

  return (
    <div className="relative h-36 w-36">
      <svg
        viewBox="0 0 140 140"
        className="h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={score}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="font-mono text-4xl font-semibold tracking-tight"
        >
          {score.toFixed(1)}
        </motion.span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          of 10
        </span>
      </div>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="relative mt-6 grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-36 w-36 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border/60 p-4">
              <Skeleton className="mb-3 h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-11/12" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border/60 p-4">
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-[85%]" />
        </div>
      </div>
    </div>
  );
}
