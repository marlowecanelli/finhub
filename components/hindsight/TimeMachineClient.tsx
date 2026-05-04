"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Loader2, Share2, Sparkles, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";
import { TickerSearch } from "./TickerSearch";
import { HeroNumber } from "./HeroNumber";
import { HistoricalChart, type ChartSeries, type EventMarker } from "./HistoricalChart";
import { PresetCard } from "./PresetCard";
import { ShareCard } from "./ShareCard";
import { Confetti } from "./Confetti";
import { PRESETS, CRISIS_EVENTS, type Preset } from "@/lib/hindsight/presets";

type Result = {
  ticker: string;
  startDate: string;
  endDate: string;
  amount: number;
  reinvestDividends: boolean;
  finalValue: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
  sharesToday: number;
  dividendsEarned: number;
  series: { date: string; close: number }[];
  benchmarkSeries: { date: string; close: number }[];
  benchmarkFinalValue: number;
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const yearAgoISO = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 10);
  return d.toISOString().slice(0, 10);
};

export function TimeMachineClient({
  initialTicker,
}: {
  initialTicker?: string;
}) {
  const [ticker, setTicker] = useState(initialTicker ?? "AAPL");
  const [date, setDate] = useState("2010-03-15");
  const [amount, setAmount] = useState(1000);
  const [reinvest, setReinvest] = useState(true);
  const [showBenchmark, setShowBenchmark] = useState(true);

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function calculate() {
    if (!ticker || !date || !amount) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/hindsight/timemachine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          date,
          amount,
          reinvestDividends: reinvest,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? "Something went wrong.");
        setResult(null);
      } else {
        setResult(j as Result);
        if (j.totalReturnPct > 1000) setConfetti((c) => c + 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  // Auto-recalc 600ms after input changes (only if we already have a result)
  useEffect(() => {
    if (!result) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      calculate();
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, date, amount, reinvest]);

  // Initial calculation on mount
  useEffect(() => {
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickPreset(p: Preset) {
    setTicker(p.ticker);
    setDate(p.date);
    setAmount(1000);
    setReinvest(true);
    // calculate fires from effect
    setTimeout(() => calculate(), 30);
  }

  const series: ChartSeries[] = useMemo(() => {
    if (!result) return [];
    const arr: ChartSeries[] = [
      {
        key: "value",
        label: result.ticker,
        data: result.series.map((p) => ({ date: p.date, value: p.close })),
        color: "#c8a85a",
        variant: "area",
      },
    ];
    if (showBenchmark) {
      arr.push({
        key: "bench",
        label: "S&P 500",
        data: result.benchmarkSeries.map((p) => ({
          date: p.date,
          value: p.close,
        })),
        color: "#7c8aa3",
        variant: "line",
      });
    }
    return arr;
  }, [result, showBenchmark]);

  const events: EventMarker[] = useMemo(() => {
    if (!result) return [];
    const start = result.startDate;
    const end = result.endDate;
    return CRISIS_EVENTS.filter((e) => e.date >= start && e.date <= end);
  }, [result]);

  const crisisCount = events.length;

  const isOutperforming =
    result && result.finalValue > result.benchmarkFinalValue;

  const shareUrl = result
    ? `/api/hindsight/share?mode=time-machine&ticker=${encodeURIComponent(
        result.ticker
      )}&date=${result.startDate}&amount=${result.amount}&final=${result.finalValue.toFixed(
        2
      )}&ret=${result.totalReturnPct.toFixed(2)}`
    : "";

  return (
    <div className="space-y-12">
      <Confetti trigger={confetti > 0} />

      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        {/* Inputs */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-6">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-hindsight-gain" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-hindsight-gain/80">
              The setup
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
                Ticker
              </label>
              <TickerSearch value={ticker} onChange={setTicker} accent="gain" />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
                Investment amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-white/40">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount.toLocaleString("en-US")}
                  onChange={(e) => {
                    const n = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
                    setAmount(isFinite(n) ? n : 0);
                  }}
                  className="h-11 w-full rounded-md border border-white/10 bg-black/40 pl-7 pr-3 font-mono text-sm text-white transition-all focus:border-hindsight-gain/50 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-hindsight-gain/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
                Investment date
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="date"
                  value={date}
                  min="1980-01-01"
                  max={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 w-full rounded-md border border-white/10 bg-black/40 pl-9 pr-3 font-mono text-sm text-white transition-all [color-scheme:dark] focus:border-hindsight-gain/50 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-hindsight-gain/30"
                />
              </div>
            </div>

            <label className="flex items-center justify-between rounded-md border border-white/5 bg-black/30 px-4 py-3 text-sm">
              <span>
                <span className="font-medium text-white">Reinvest dividends</span>
                <span className="block text-xs text-white/40">
                  Compound payouts back into shares
                </span>
              </span>
              <input
                type="checkbox"
                checked={reinvest}
                onChange={(e) => setReinvest(e.target.checked)}
                className="h-5 w-5 cursor-pointer accent-hindsight-gain"
              />
            </label>

            <button
              type="button"
              onClick={calculate}
              disabled={loading}
              className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-hindsight-gain font-medium text-black transition-all hover:brightness-110 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>Run the time machine</span>
            </button>

            {error && (
              <div className="rounded-md border border-hindsight-pain/30 bg-hindsight-pain/10 p-3 text-sm text-hindsight-pain">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="min-h-[480px]">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={`${result.ticker}-${result.startDate}-${result.amount}-${result.reinvestDividends}`}
                initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <div>
                  <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-hindsight-gain/80">
                    Today, that would be
                  </div>
                  <div
                    className="font-display text-6xl leading-none text-white sm:text-7xl lg:text-[88px]"
                    style={{
                      fontVariationSettings: "'opsz' 144, 'soft' 100",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    <HeroNumber
                      value={result.finalValue}
                      prefix="$"
                      decimals={2}
                      format="currency"
                      className="text-hindsight-gain"
                    />
                  </div>
                  <div className="mt-3 max-w-lg text-sm leading-relaxed text-white/60">
                    Your{" "}
                    <span className="font-mono text-white">
                      ${result.amount.toLocaleString()}
                    </span>{" "}
                    investment in{" "}
                    <span className="font-mono text-white">{result.ticker}</span>{" "}
                    on{" "}
                    <span className="font-mono text-white">
                      {new Date(result.startDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>{" "}
                    would be worth this much today.
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Stat
                    label="Total return"
                    value={
                      <HeroNumber
                        value={result.totalReturnPct}
                        suffix="%"
                        decimals={1}
                        format="number"
                        duration={1.4}
                      />
                    }
                    accent={result.totalReturnPct >= 0 ? "gain" : "pain"}
                  />
                  <Stat
                    label="Annualized"
                    value={
                      <HeroNumber
                        value={result.annualizedReturnPct}
                        suffix="%"
                        decimals={1}
                        duration={1.4}
                      />
                    }
                  />
                  <Stat
                    label={reinvest ? "Shares today" : "Dividends earned"}
                    value={
                      <HeroNumber
                        value={
                          reinvest
                            ? result.sharesToday
                            : result.dividendsEarned
                        }
                        prefix={reinvest ? "" : "$"}
                        decimals={reinvest ? 2 : 0}
                        duration={1.4}
                      />
                    }
                  />
                </div>

                {/* S&P comparison */}
                {result.benchmarkFinalValue > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-4 py-3 text-sm">
                    <div className="text-white/60">
                      Same money in{" "}
                      <span className="font-mono text-white">S&P 500</span>:{" "}
                      <span className="font-mono text-white">
                        $
                        {result.benchmarkFinalValue.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div
                      className={
                        isOutperforming
                          ? "font-mono text-hindsight-gain"
                          : "font-mono text-hindsight-pain"
                      }
                    >
                      {isOutperforming ? "+" : ""}
                      {(
                        ((result.finalValue - result.benchmarkFinalValue) /
                          result.benchmarkFinalValue) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-mono text-[11px] uppercase tracking-widest text-white/50">
                      The journey
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBenchmark((v) => !v)}
                      className="font-mono text-[11px] uppercase tracking-widest text-white/40 transition-colors hover:text-white"
                    >
                      {showBenchmark ? "Hide" : "Show"} S&P 500
                    </button>
                  </div>
                  <HistoricalChart
                    series={series}
                    events={events}
                    height={300}
                    accent="gain"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-all hover:bg-white/10"
                  >
                    <Share2 className="h-4 w-4" />
                    Generate shareable image
                  </button>
                  {crisisCount > 0 && (
                    <Link
                      href={`/hindsight/stress-test?ticker=${result.ticker}`}
                      className="inline-flex items-center gap-2 rounded-md border border-hindsight-pain/30 bg-hindsight-pain/10 px-4 py-2 text-sm text-hindsight-pain transition-all hover:bg-hindsight-pain/20"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      This investment lived through {crisisCount} major{" "}
                      {crisisCount === 1 ? "crisis" : "crises"}. See how it would
                      have felt to hold.
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-[400px] items-center justify-center rounded-2xl border border-dashed border-white/5 bg-black/10 text-center"
              >
                <div>
                  <div className="font-display text-2xl text-white/30">
                    {loading ? "Calculating…" : "Pick a ticker to begin."}
                  </div>
                  {!loading && (
                    <div className="mt-2 text-sm text-white/30">
                      Or jump in with a preset below.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Presets */}
      <div>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-white/40">
              Worth-a-look
            </div>
            <h2 className="font-display text-3xl text-white">
              Trades you wish you&apos;d made.
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((p) => (
            <PresetCard key={p.ticker + p.date} preset={p} onPick={pickPreset} />
          ))}
        </div>
      </div>

      {result && (
        <ShareCard
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          url={shareUrl}
          filename={`hindsight-${result.ticker}-${result.startDate}.png`}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "gain" | "pain";
}) {
  const color =
    accent === "gain"
      ? "text-hindsight-gain"
      : accent === "pain"
      ? "text-hindsight-pain"
      : "text-white";
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </div>
      <div className={`font-mono text-2xl ${color}`}>{value}</div>
    </div>
  );
}
