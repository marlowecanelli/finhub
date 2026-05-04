"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Share2, ArrowRight, TrendingDown, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { HeroNumber } from "./HeroNumber";
import { HistoricalChart, type ChartSeries, type EventMarker } from "./HistoricalChart";
import { LessonsLearned } from "./LessonsLearned";
import { ShareCard } from "./ShareCard";
import type { Holding, StressScenarioResult } from "@/lib/hindsight/types";

type Props = {
  result: StressScenarioResult;
  holdings: Holding[];
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function pctText(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function ScenarioCard({ result, holdings }: Props) {
  const [showRecovery, setShowRecovery] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const chartSeries: ChartSeries[] = useMemo(() => {
    const arr: ChartSeries[] = [
      {
        key: "portfolio",
        label: "Portfolio",
        data: result.series.map((p) => ({ date: p.date, value: p.close })),
        color: "#a8324a",
        variant: "area",
      },
      {
        key: "bench",
        label: "S&P 500",
        data: result.benchmarkSeries.map((p) => ({
          date: p.date,
          value: p.close,
        })),
        color: "#7c8aa3",
        variant: "line",
      },
    ];
    if (showRecovery) {
      // Panic-sold scenario: locks in losses at the bottom, then flat (cash)
      const bottomIdx = result.series.findIndex(
        (p) => p.date === result.bottomDate
      );
      const bottomVal = result.series[bottomIdx]?.close ?? result.bottomValue;
      const panicData = result.series.map((p, i) => ({
        date: p.date,
        value: i < bottomIdx ? p.close : bottomVal,
      }));
      arr.push({
        key: "panic",
        label: "Panic sold at bottom",
        data: panicData,
        color: "#d76b80",
        variant: "line",
        dashed: true,
      });

      // Kept buying $500/month scenario: simulate DCA over the scenario window
      const monthlyDCA = 500;
      const startVal = result.series[0]?.close ?? 1;
      let units = 1; // start with 1 normalized unit (we plot relative to startVal)
      let invested = startVal;
      const dcaData: { date: string; value: number }[] = [];
      let lastMonth = -1;
      result.series.forEach((p) => {
        const m = new Date(p.date).getMonth();
        const y = new Date(p.date).getFullYear();
        const stamp = y * 12 + m;
        if (stamp !== lastMonth) {
          // buy $monthlyDCA worth at this price
          const px = p.close;
          if (px > 0) {
            const buyUnits = monthlyDCA / px;
            units += buyUnits;
            invested += monthlyDCA;
          }
          lastMonth = stamp;
        }
        dcaData.push({ date: p.date, value: units * p.close });
      });
      arr.push({
        key: "dca",
        label: "Kept buying $500/mo",
        data: dcaData,
        color: "#9ec47a",
        variant: "line",
      });
    }
    return arr;
  }, [result, showRecovery]);

  const events: EventMarker[] = result.scenario.keyEvents;

  const dateRange = `${fmtDate(result.scenario.start)} to ${fmtDate(
    result.scenario.end
  )}`;

  const largestHolding = useMemo(() => {
    return [...holdings].sort((a, b) => b.weight - a.weight)[0]?.ticker ?? "";
  }, [holdings]);

  const shareUrl = `/api/hindsight/share?mode=stress-test&scenario=${encodeURIComponent(
    result.scenario.name
  )}&dd=${result.drawdownPct.toFixed(2)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent"
    >
      {/* Header */}
      <div className="border-b border-white/5 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3
            className="font-display text-3xl text-white sm:text-4xl"
            style={{
              fontVariationSettings: "'opsz' 24, 'soft' 0",
              letterSpacing: "-0.02em",
            }}
          >
            {result.scenario.name}
          </h3>
          <div className="font-mono text-xs uppercase tracking-widest text-white/40">
            {dateRange}
          </div>
        </div>
        <p className="mt-3 max-w-3xl font-serif text-[15px] leading-relaxed text-white/65">
          {result.scenario.narrative}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-4">
        <Stat
          icon={<TrendingDown className="h-3.5 w-3.5" />}
          label="Drawdown"
          value={
            <span className="text-hindsight-pain">
              <HeroNumber
                value={result.drawdownPct}
                suffix="%"
                decimals={1}
                duration={1.6}
              />
            </span>
          }
          sub={`from $${result.startValue.toFixed(2)} to $${result.bottomValue.toFixed(2)}`}
        />
        <Stat
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Days to bottom"
          value={
            <HeroNumber
              value={result.daysToBottom}
              decimals={0}
              duration={1.4}
            />
          }
          sub={`Bottom ${fmtDate(result.bottomDate)}`}
        />
        <Stat
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Recovery"
          value={
            result.daysToRecovery == null ? (
              <span className="font-display text-2xl italic text-hindsight-pain">
                Still under
              </span>
            ) : (
              <HeroNumber
                value={result.daysToRecovery}
                suffix=" days"
                decimals={0}
                duration={1.4}
              />
            )
          }
          sub={
            result.recoveryDate
              ? `Recovered ${fmtDate(result.recoveryDate)}`
              : "Never broke even"
          }
        />
        <Stat
          icon={<TrendingDown className="h-3.5 w-3.5" />}
          label="Worst single day"
          value={
            result.worstDay ? (
              <span className="text-hindsight-pain">
                <HeroNumber
                  value={result.worstDay.pct}
                  suffix="%"
                  decimals={2}
                  duration={1.4}
                />
              </span>
            ) : (
              <span className="text-white/40">–</span>
            )
          }
          sub={result.worstDay ? fmtDate(result.worstDay.date) : ""}
        />
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="font-mono text-[11px] uppercase tracking-widest text-white/50">
            What it looked like
          </div>
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              checked={showRecovery}
              onChange={(e) => setShowRecovery(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-hindsight-pain"
            />
            Recovery simulator
          </label>
        </div>
        <HistoricalChart
          series={chartSeries}
          events={events}
          height={340}
          accent="pain"
        />
        {showRecovery && (
          <p className="mt-3 text-xs italic text-white/50">
            Dashed line: investor who panic-sold at the bottom and held cash.
            Green: investor who kept buying $500/month. The gap between them is
            the lesson.
          </p>
        )}
      </div>

      {/* Holdings breakdown */}
      <div className="border-t border-white/5 p-6">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-widest text-white/50">
          Holding breakdown
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-white/40">
                <th className="pb-2 pr-4">Ticker</th>
                <th className="pb-2 pr-4">Weight</th>
                <th className="pb-2 pr-4">Loss</th>
                <th className="pb-2 pr-4">Recovery</th>
                <th className="pb-2">Contribution</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {result.holdings.map((h) => {
                const heat = Math.min(1, h.contributionToDrawdown);
                return (
                  <tr key={h.ticker} className="border-t border-white/5">
                    <td className="py-2.5 pr-4 text-white">{h.ticker}</td>
                    <td className="py-2.5 pr-4 text-white/60">
                      {(h.weight * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 pr-4 text-hindsight-pain">
                      {pctText(h.lossPct)}
                    </td>
                    <td className="py-2.5 pr-4 text-white/60">
                      {h.recoveryDays == null
                        ? "—"
                        : `${h.recoveryDays} d`}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-hindsight-pain"
                            style={{ width: `${heat * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/60">
                          {(heat * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lessons */}
      <div className="px-6 pb-6">
        <LessonsLearned
          scenarioName={result.scenario.name}
          dateRange={dateRange}
          drawdown={result.drawdownPct}
          holdings={holdings}
        />
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/5 bg-black/20 p-5">
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
        >
          <Share2 className="h-4 w-4" />
          Share this
        </button>
        {largestHolding && (
          <Link
            href={`/hindsight/time-machine?ticker=${largestHolding}`}
            className="ml-auto inline-flex items-center gap-2 text-sm text-hindsight-gain transition-colors hover:underline"
          >
            Curious what staying invested would be worth today? Run{" "}
            {largestHolding} through the Time Machine
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <ShareCard
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        filename={`hindsight-${result.scenario.key}.png`}
      />
    </motion.div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="bg-[#0e1119] p-5">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">
        {icon}
        {label}
      </div>
      <div className="font-mono text-2xl text-white">{value}</div>
      {sub && <div className="mt-1 truncate text-[11px] text-white/40">{sub}</div>}
    </div>
  );
}
