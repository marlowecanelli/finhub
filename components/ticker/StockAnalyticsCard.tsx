"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AnalyticsData = {
  meta: {
    symbol: string;
    benchmark: string;
    ratesProxy: string;
    sampleSize: number;
    startDate: number;
    endDate: number;
  };
  summary: {
    annualReturn: number;
    annualVol: number;
    sharpe: number;
    sortino: number;
    calmar: number;
    maxDrawdown: number;
    maxDrawdownPeak: number | null;
    maxDrawdownTrough: number | null;
    maxDrawdownRecovery: number | null;
    benchAnnualReturn: number;
    benchAnnualVol: number;
    benchSharpe: number;
    benchMaxDrawdown: number;
  };
  factor: {
    beta: number;
    alpha: number;
    trackingError: number;
    informationRatio: number;
    correlationSPY: number;
    rateBeta: number;
  };
  var: {
    var95Hist: number;
    var99Hist: number;
    var95Param: number;
    var99Param: number;
    cvar95: number;
    cvar99: number;
  };
  series: {
    drawdown: { t: number; v: number }[];
    rollingSharpe: { t: number; v: number }[];
  };
  stress: {
    name: string;
    period: string;
    description: string;
    benchShock: number;
    estimatedReturn: number;
  }[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(v: number, decimals = 1) {
  return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(decimals)}%`;
}

function fmt2(v: number) {
  return v.toFixed(2);
}

function epochToYear(ts: number | null) {
  if (ts == null) return "—";
  return new Date(ts * 1000).getFullYear().toString();
}

// Sparkline rendered as inline SVG — no dependencies
function Sparkline({
  data,
  color,
  baseline = 0,
  height = 40,
  width = 120,
}: {
  data: { t: number; v: number }[];
  color: string;
  baseline?: number;
  height?: number;
  width?: number;
}) {
  if (data.length < 2) return null;
  const vals = data.map((d) => d.v);
  const min  = Math.min(...vals, baseline);
  const max  = Math.max(...vals, baseline);
  const range = max - min || 1;

  const toX = (i: number) => (i / (data.length - 1)) * width;
  const toY = (v: number) => height - ((v - min) / range) * height;

  const pathD = vals
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(" ");

  const baseY = toY(baseline);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {/* Baseline */}
      <line
        x1={0} y1={baseY} x2={width} y2={baseY}
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={0.75}
        strokeDasharray="3 2"
      />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "red" | "amber" | "blue" | "default";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const colorMap = {
    green:   "text-emerald-400",
    red:     "text-rose-400",
    amber:   "text-amber-400",
    blue:    "text-sky-400",
    default: "text-foreground",
  };
  const color = colorMap[accent ?? "default"];

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3 opacity-70" />}
        {label}
      </div>
      <p className={`font-mono text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="font-mono text-[11px] text-muted-foreground/70">{sub}</p>}
    </div>
  );
}

function SectionHeading({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StockAnalyticsCard({ symbol }: { symbol: string }) {
  const [data, setData]   = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ticker/${encodeURIComponent(symbol)}/analytics`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<AnalyticsData>;
      })
      .then((json) => {
        if (!cancelled) {
          if (json) setData(json);
          else setError("Analytics unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Analytics unavailable");
      });
    return () => { cancelled = true; };
  }, [symbol]);

  if (error) return null;

  if (!data) {
    return (
      <div className="glass space-y-4 p-6 md:p-8 animate-pulse">
        <div className="h-5 w-48 rounded-md bg-border/40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-border/30" />
          ))}
        </div>
      </div>
    );
  }

  const { summary, factor, var: varData, series, stress } = data;

  // Derive accent for Sharpe
  const sharpeAccent =
    summary.sharpe >= 1.5 ? "green" : summary.sharpe >= 0.8 ? "amber" : "red";

  // Derive accent for Beta
  const betaAccent =
    factor.beta < 0.7 ? "blue" : factor.beta <= 1.3 ? "default" : "amber";

  // Derive rate sensitivity label
  const rateSensLabel =
    factor.rateBeta > 0.5  ? "Bond-like (long duration)" :
    factor.rateBeta > 0.1  ? "Mildly rate-sensitive" :
    factor.rateBeta < -0.3 ? "Short duration / rate hedge" :
    "Low rate sensitivity";

  // Rolling Sharpe color
  const lastRS     = series.rollingSharpe.at(-1)?.v ?? 0;
  const rsColor    = lastRS >= 1 ? "#34d399" : lastRS >= 0 ? "#fbbf24" : "#f87171";

  // Max drawdown accent
  const ddAccent =
    summary.maxDrawdown > -0.15 ? "green" :
    summary.maxDrawdown > -0.30 ? "amber" : "red";

  // Alpha accent
  const alphaAccent = factor.alpha >= 0 ? "green" : "red";

  return (
    <motion.section
      id="stock-analytics"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass space-y-8 p-6 md:p-8"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium tracking-tight">Advanced Analytics</h2>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground/60 uppercase tracking-wider">
            5Y daily · vs {data.meta.benchmark} · {data.meta.sampleSize} sessions
          </p>
        </div>
      </div>

      {/* ── Risk-adjusted returns ──────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeading icon={Activity}>Risk-Adjusted Performance</SectionHeading>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile
            label="Ann. Return"
            value={pct(summary.annualReturn)}
            sub={`SPY: ${pct(summary.benchAnnualReturn)}`}
            accent={summary.annualReturn >= summary.benchAnnualReturn ? "green" : "amber"}
            icon={TrendingUp}
          />
          <StatTile
            label="Ann. Volatility"
            value={pct(summary.annualVol)}
            sub={`SPY: ${pct(summary.benchAnnualVol)}`}
            accent={summary.annualVol <= summary.benchAnnualVol ? "green" : "amber"}
            icon={Zap}
          />
          <StatTile
            label="Sharpe Ratio"
            value={fmt2(summary.sharpe)}
            sub={`SPY: ${fmt2(summary.benchSharpe)}`}
            accent={sharpeAccent}
            icon={BarChart2}
          />
          <StatTile
            label="Sortino Ratio"
            value={fmt2(summary.sortino)}
            sub="Downside-adj."
            accent={summary.sortino >= 1.2 ? "green" : summary.sortino >= 0.6 ? "amber" : "red"}
          />
          <StatTile
            label="Calmar Ratio"
            value={fmt2(summary.calmar)}
            sub="Return/drawdown"
            accent={summary.calmar >= 0.5 ? "green" : summary.calmar >= 0.2 ? "amber" : "red"}
          />
          <StatTile
            label="Max Drawdown"
            value={pct(summary.maxDrawdown)}
            sub={`Peak ${epochToYear(summary.maxDrawdownPeak)} · Trough ${epochToYear(summary.maxDrawdownTrough)}`}
            accent={ddAccent}
            icon={TrendingDown}
          />
        </div>
      </div>

      {/* ── Factor / Market exposure ───────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeading icon={BarChart2}>Market Exposure &amp; Factor</SectionHeading>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile
            label="Beta (vs SPY)"
            value={fmt2(factor.beta)}
            sub={factor.beta > 1 ? "Higher market exposure" : "Lower market exposure"}
            accent={betaAccent}
          />
          <StatTile
            label="Alpha (ann.)"
            value={pct(factor.alpha)}
            sub="CAPM excess return"
            accent={alphaAccent}
          />
          <StatTile
            label="Corr. with SPY"
            value={fmt2(factor.correlationSPY)}
            sub="1.0 = moves with market"
            accent={factor.correlationSPY < 0.5 ? "blue" : "default"}
          />
          <StatTile
            label="Tracking Error"
            value={pct(factor.trackingError)}
            sub="Active risk vs SPY"
            accent="default"
          />
          <StatTile
            label="Info. Ratio"
            value={fmt2(factor.informationRatio)}
            sub="Alpha / tracking error"
            accent={factor.informationRatio >= 0.5 ? "green" : factor.informationRatio >= 0 ? "amber" : "red"}
          />
          <StatTile
            label="Rate Sensitivity"
            value={fmt2(factor.rateBeta)}
            sub={rateSensLabel}
            accent={Math.abs(factor.rateBeta) < 0.2 ? "green" : "amber"}
            icon={Shield}
          />
        </div>
      </div>

      {/* ── VaR ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeading icon={AlertTriangle}>Value at Risk (1-Day)</SectionHeading>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="VaR 95% (Hist.)"  value={pct(-varData.var95Hist)} accent="amber" />
          <StatTile label="VaR 99% (Hist.)"  value={pct(-varData.var99Hist)} accent="red"   />
          <StatTile label="VaR 95% (Param.)" value={pct(-varData.var95Param)} accent="amber" />
          <StatTile label="VaR 99% (Param.)" value={pct(-varData.var99Param)} accent="red"   />
          <StatTile
            label="CVaR 95%"
            value={pct(-varData.cvar95)}
            sub="Exp. shortfall"
            accent="amber"
          />
          <StatTile
            label="CVaR 99%"
            value={pct(-varData.cvar99)}
            sub="Tail loss avg."
            accent="red"
          />
        </div>
        <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">
          Positive values shown as potential loss. Historical uses 5Y daily returns; parametric assumes normal distribution.
        </p>
      </div>

      {/* ── Charts row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Rolling Sharpe */}
        <div className="rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rolling Sharpe (60-day)
          </p>
          <div className="overflow-hidden">
            <Sparkline
              data={series.rollingSharpe}
              color={rsColor}
              baseline={0}
              height={56}
              width={400}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground/60">
            <span>{new Date((series.rollingSharpe[0]?.t ?? 0) * 1000).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}</span>
            <span className={lastRS >= 0 ? "text-emerald-400" : "text-rose-400"}>
              Current: {lastRS.toFixed(2)}
            </span>
            <span>{new Date((series.rollingSharpe.at(-1)?.t ?? 0) * 1000).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}</span>
          </div>
        </div>

        {/* Drawdown */}
        <div className="rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Drawdown Series
          </p>
          <div className="overflow-hidden">
            <Sparkline
              data={series.drawdown}
              color="#f87171"
              baseline={0}
              height={56}
              width={400}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground/60">
            <span>{new Date((series.drawdown[0]?.t ?? 0) * 1000).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}</span>
            <span className="text-rose-400">Max: {pct(summary.maxDrawdown)}</span>
            <span>{new Date((series.drawdown.at(-1)?.t ?? 0) * 1000).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}</span>
          </div>
        </div>
      </div>

      {/* ── Stress tests ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeading icon={AlertTriangle}>Historical Stress Tests</SectionHeading>
        <p className="font-mono text-[11px] text-muted-foreground/60">
          Estimated impact based on current beta ({fmt2(factor.beta)}) applied to benchmark shock during each crisis.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-4">Scenario</th>
                <th className="pb-2 pr-4 hidden sm:table-cell">Period</th>
                <th className="pb-2 pr-4 text-right">SPY Shock</th>
                <th className="pb-2 text-right">Est. Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {stress.map((s) => (
                <tr key={s.name} className="group">
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground/60">{s.description}</p>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                    {s.period}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-sm text-rose-400">
                    {pct(s.benchShock)}
                  </td>
                  <td
                    className={`py-2.5 text-right font-mono text-sm font-semibold ${
                      s.estimatedReturn >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {pct(s.estimatedReturn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">
        Analytics computed from 5Y daily closes. Beta-weighted stress estimates are indicative only.
        Past performance is not indicative of future results.
      </p>
    </motion.section>
  );
}
