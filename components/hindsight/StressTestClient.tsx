"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Play, ShieldAlert } from "lucide-react";
import { ScenarioCard } from "./ScenarioCard";
import { SCENARIOS } from "@/lib/hindsight/scenarios";
import { parseHoldingsText } from "@/lib/hindsight/calc";
import type { Holding, StressScenarioResult } from "@/lib/hindsight/types";

const DEFAULT_HOLDINGS = `AAPL 25
MSFT 25
GOOGL 20
AMZN 15
NVDA 15`;

export function StressTestClient({
  initialTicker,
}: {
  initialTicker?: string;
}) {
  const [text, setText] = useState(
    initialTicker ? `${initialTicker} 100` : DEFAULT_HOLDINGS
  );
  const [picked, setPicked] = useState<Set<string>>(
    new Set(["gfc-2008", "covid-2020"])
  );
  const [results, setResults] = useState<StressScenarioResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const holdings: Holding[] = useMemo(() => parseHoldingsText(text), [text]);

  function toggle(key: string) {
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function run() {
    if (!holdings.length || !picked.size) {
      setError("Need at least one holding and one scenario.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/hindsight/stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdings,
          scenarios: Array.from(picked),
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? "Could not run scenarios.");
        setResults([]);
      } else {
        setResults(j.results as StressScenarioResult[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  // Auto-run on first mount
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Multi-scenario summary
  const summary = useMemo(() => {
    if (results.length < 2) return null;
    const avgDD =
      results.reduce((s, r) => s + Math.abs(r.drawdownPct), 0) / results.length;
    const recoveries = results
      .map((r) => r.daysToRecovery)
      .filter((n): n is number => n != null);
    const avgRecovery =
      recoveries.length === 0
        ? null
        : recoveries.reduce((s, r) => s + r, 0) / recoveries.length;
    const worst = [...results].sort(
      (a, b) => a.drawdownPct - b.drawdownPct
    )[0];
    if (!worst) return null;
    return { avgDD, avgRecovery, worst };
  }, [results]);

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-6">
        <div className="mb-5 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-hindsight-pain" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-hindsight-pain/80">
            The portfolio under examination
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
              Holdings (one per line: TICKER WEIGHT%)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              className="h-44 w-full rounded-md border border-white/10 bg-black/40 p-3 font-mono text-sm uppercase text-white transition-all focus:border-hindsight-pain/50 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-hindsight-pain/30"
            />
            <div className="mt-2 text-[11px] text-white/40">
              {holdings.length} holdings, normalized to 100%.
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
              Scenarios (multi-select)
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SCENARIOS.map((s) => {
                const on = picked.has(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggle(s.key)}
                    className={`group rounded-lg border px-4 py-3 text-left transition-all ${
                      on
                        ? "border-hindsight-pain/50 bg-hindsight-pain/[0.08]"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-display text-base text-white">
                        {s.name}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        {s.start.slice(0, 4)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                      {s.teaser}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="inline-flex h-12 items-center gap-2 rounded-md bg-hindsight-pain px-6 font-medium text-white transition-all hover:brightness-110 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run stress test
          </button>
          {error && (
            <span className="text-sm text-hindsight-pain">{error}</span>
          )}
        </div>
      </div>

      {/* Multi-scenario summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-px overflow-hidden rounded-2xl border border-hindsight-pain/30 bg-white/5 sm:grid-cols-3"
        >
          <SummaryStat
            label="Average drawdown"
            value={`${summary.avgDD.toFixed(1)}%`}
          />
          <SummaryStat
            label="Average recovery"
            value={
              summary.avgRecovery == null
                ? "Some never recovered"
                : `${Math.round(summary.avgRecovery)} days`
            }
          />
          <SummaryStat
            label="Worst case"
            value={`${summary.worst.scenario.name}, ${summary.worst.drawdownPct.toFixed(1)}%`}
          />
        </motion.div>
      )}

      {/* Results */}
      <div className="space-y-8">
        {results.length === 0 && !loading && !error && (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/5 text-white/30">
            Pick scenarios and run the test.
          </div>
        )}
        {results.map((r) => (
          <ScenarioCard
            key={r.scenario.key + r.scenario.start}
            result={r}
            holdings={holdings}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0e1119] p-5">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-hindsight-pain/70">
        {label}
      </div>
      <div className="font-display text-xl text-white">{value}</div>
    </div>
  );
}
