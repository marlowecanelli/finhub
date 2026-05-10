"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  type TooltipProps,
} from "recharts";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { CalcInput } from "./calc-input";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type State = {
  goalAmount: number;
  years: number;
  currentSavings: number;
  annualReturn: number;
};

const DEFAULTS: State = {
  goalAmount: 100000,
  years: 10,
  currentSavings: 5000,
  annualReturn: 7,
};

type YearRow = {
  year: number;
  contributions: number;
  interest: number;
  balance: number;
};

type Result = {
  monthlyNeeded: number;
  finalBalance: number;
  totalContributions: number;
  totalInterest: number;
  currentPct: number;
  grownPct: number;
  rows: YearRow[];
};

// ─── Math ─────────────────────────────────────────────────────────────────────

function compute(s: State): Result {
  const safeGoal = Math.max(1, s.goalAmount);
  const n = Math.max(1, Math.round(s.years));
  const r = s.annualReturn / 100 / 12;
  const months = n * 12;

  const fvCurrent = s.currentSavings * Math.pow(1 + r, months);

  let monthlyNeeded: number;
  if (r < 1e-9) {
    monthlyNeeded = Math.max(0, (safeGoal - fvCurrent) / months);
  } else {
    const fvFactor = (Math.pow(1 + r, months) - 1) / r;
    monthlyNeeded = Math.max(0, (safeGoal - fvCurrent) / fvFactor);
  }

  const rows: YearRow[] = [];
  let balance = s.currentSavings;
  let totalContrib = s.currentSavings;

  for (let y = 1; y <= n; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + r) + monthlyNeeded;
    }
    totalContrib += monthlyNeeded * 12;
    rows.push({
      year: y,
      contributions: totalContrib,
      interest: Math.max(0, balance - totalContrib),
      balance,
    });
  }

  const last = rows[rows.length - 1];
  const finalBalance = last?.balance ?? s.currentSavings;
  const totalContributions = last?.contributions ?? s.currentSavings;

  return {
    monthlyNeeded,
    finalBalance,
    totalContributions,
    totalInterest: Math.max(0, finalBalance - totalContributions),
    currentPct: Math.min(100, (s.currentSavings / safeGoal) * 100),
    grownPct: Math.min(100, (fvCurrent / safeGoal) * 100),
    rows,
  };
}

function findMilestoneYear(rows: YearRow[], pct: number, goal: number): number | null {
  const target = (goal * pct) / 100;
  return rows.find((r) => r.balance >= target)?.year ?? null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GoalSavingsCalculator() {
  const [s, setS] = React.useState<State>(DEFAULTS);

  function set<K extends keyof State>(key: K, val: State[K]) {
    setS((prev) => ({ ...prev, [key]: val }));
  }
  function n(v: number | null, fb = 0) {
    return v == null || !Number.isFinite(v) ? fb : v;
  }

  const result = React.useMemo(
    () => compute(s),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.goalAmount, s.years, s.currentSavings, s.annualReturn],
  );

  const { monthlyNeeded, totalContributions, totalInterest, currentPct, grownPct, rows } = result;

  const milestones = [25, 50, 75, 100].map((pct) => ({
    pct,
    year: pct === 100 ? s.years : findMilestoneYear(rows, pct, s.goalAmount),
  }));

  const alreadyFunded = s.currentSavings >= s.goalAmount;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      {/* Header */}
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/30">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Calculator
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Goal savings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How much to invest monthly to reach your target
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* ── Inputs ── */}
        <aside className="glass space-y-4 self-start p-5">
          <CalcInput
            id="goal"
            label="Goal amount"
            prefix="$"
            value={s.goalAmount}
            onChange={(v) => set("goalAmount", Math.max(1, n(v, 100000)))}
          />
          <CalcInput
            id="years"
            label="Time to reach goal"
            suffix="yrs"
            step="1"
            min="1"
            value={s.years}
            onChange={(v) =>
              set("years", Math.max(1, Math.min(50, Math.round(n(v, 10)))))
            }
          />
          <CalcInput
            id="savings"
            label="Current savings"
            prefix="$"
            value={s.currentSavings}
            onChange={(v) => set("currentSavings", Math.max(0, n(v, 0)))}
          />
          <CalcInput
            id="return"
            label="Expected annual return"
            suffix="%"
            step="0.1"
            value={s.annualReturn}
            onChange={(v) =>
              set("annualReturn", Math.max(0, Math.min(50, n(v, 7))))
            }
          />

          {/* Insight blurb */}
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
            {alreadyFunded ? (
              <p className="text-xs text-muted-foreground">
                Your current savings already{" "}
                <span className="font-semibold text-rose-400">
                  exceed your goal
                </span>
                . No monthly contribution needed.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Invest{" "}
                <span className="font-mono font-semibold text-rose-400">
                  {formatCurrency(monthlyNeeded)}/mo
                </span>{" "}
                for {s.years} yr{s.years !== 1 ? "s" : ""} to reach{" "}
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(s.goalAmount)}
                </span>
                .
              </p>
            )}
          </div>
        </aside>

        {/* ── Results ── */}
        <div className="space-y-4">
          {/* Big stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BigStat
              label="Monthly needed"
              value={monthlyNeeded}
              format={formatCurrency}
              gradient
            />
            <BigStat
              label="Total invested"
              value={totalContributions}
              format={formatCurrency}
            />
            <BigStat
              label="Interest earned"
              value={totalInterest}
              format={formatCurrency}
              accent
            />
          </div>

          {/* Progress visualization */}
          <GoalProgressBar
            currentPct={currentPct}
            grownPct={grownPct}
            goalAmount={s.goalAmount}
            currentSavings={s.currentSavings}
          />

          {/* Milestone chips */}
          <MilestoneRow milestones={milestones} />

          {/* Growth chart */}
          <GrowthChart rows={rows} goal={s.goalAmount} />
        </div>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function GoalProgressBar({
  currentPct,
  grownPct,
  goalAmount,
  currentSavings,
}: {
  currentPct: number;
  grownPct: number;
  goalAmount: number;
  currentSavings: number;
}) {
  const contribPct = 100 - grownPct;
  const growthBoostPct = grownPct - currentPct;

  return (
    <div className="glass space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Goal funding breakdown</h3>
        <span className="text-xs text-muted-foreground">
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(currentSavings)}
          </span>{" "}
          of{" "}
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(goalAmount)}
          </span>{" "}
          saved
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-5 overflow-hidden rounded-full bg-muted/40">
        {/* Current savings */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-l-full bg-muted-foreground/35"
          initial={{ width: 0 }}
          animate={{ width: `${currentPct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Growth of current savings */}
        {growthBoostPct > 0.2 && (
          <motion.div
            className="absolute inset-y-0 bg-rose-500/30"
            initial={{ width: 0 }}
            animate={{ width: `${growthBoostPct}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            style={{ left: `${currentPct}%` }}
          />
        )}
        {/* Monthly contributions fill */}
        {contribPct > 0.2 && (
          <motion.div
            className="absolute inset-y-0 rounded-r-full bg-rose-500/60"
            initial={{ width: 0 }}
            animate={{ width: `${contribPct}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{ left: `${grownPct}%` }}
          />
        )}
        {/* Milestone ticks */}
        {[25, 50, 75].map((m) => (
          <div
            key={m}
            aria-hidden
            className="absolute inset-y-0 w-px bg-background/70"
            style={{ left: `${m}%` }}
          />
        ))}
      </div>

      {/* Tick labels */}
      <div className="relative h-4 text-[10px] text-muted-foreground">
        {[25, 50, 75].map((m) => (
          <span
            key={m}
            className="absolute -translate-x-1/2"
            style={{ left: `${m}%` }}
          >
            {m}%
          </span>
        ))}
        <span className="absolute right-0">100%</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <LegendDot color="bg-muted-foreground/35" label={`Current savings (${currentPct.toFixed(1)}%)`} />
        {growthBoostPct > 0.2 && (
          <LegendDot color="bg-rose-500/30" label={`Compound growth boost (${growthBoostPct.toFixed(1)}%)`} />
        )}
        {contribPct > 0.2 && (
          <LegendDot color="bg-rose-500/60" label={`Monthly contributions (${contribPct.toFixed(1)}%)`} />
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("inline-block h-2 w-4 flex-shrink-0 rounded-full", color)} />
      {label}
    </span>
  );
}

// ─── Milestone Chips ──────────────────────────────────────────────────────────

function MilestoneRow({
  milestones,
}: {
  milestones: { pct: number; year: number | null }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {milestones.map(({ pct, year }, i) => (
        <motion.div
          key={pct}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.06 }}
          className={cn(
            "glass relative overflow-hidden rounded-xl px-4 py-3",
            pct === 100 && "ring-1 ring-rose-500/40",
          )}
        >
          {pct === 100 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent"
            />
          )}
          <div className="relative">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {pct === 100 ? "Goal reached" : `${pct}% milestone`}
            </p>
            <p
              className={cn(
                "mt-1 font-mono text-lg font-semibold",
                pct === 100 ? "text-rose-400" : "",
              )}
            >
              {year != null ? `Yr ${year}` : "—"}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Growth Chart ─────────────────────────────────────────────────────────────

function GrowthChart({ rows, goal }: { rows: YearRow[]; goal: number }) {
  return (
    <div className="glass p-5">
      <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
        Balance over time
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart
          data={rows}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gs-contrib-fill" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="hsl(var(--muted-foreground))"
                stopOpacity={0.25}
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--muted-foreground))"
                stopOpacity={0.04}
              />
            </linearGradient>
            <linearGradient id="gs-interest-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `Yr ${v}`}
            minTickGap={30}
          />
          <YAxis
            orientation="right"
            tickFormatter={(v: number) => formatCompact(v)}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<GoalTooltip />} />
          <ReferenceLine
            y={goal}
            stroke="#f43f5e"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{
              value: "Goal",
              position: "insideTopRight",
              fontSize: 11,
              fill: "#f43f5e",
            }}
          />
          <Area
            type="monotone"
            dataKey="contributions"
            stackId="1"
            stroke="hsl(var(--muted-foreground) / 0.5)"
            strokeWidth={1.5}
            fill="url(#gs-contrib-fill)"
            name="Contributions"
          />
          <Area
            type="monotone"
            dataKey="interest"
            stackId="1"
            stroke="#f43f5e"
            strokeWidth={1.5}
            fill="url(#gs-interest-fill)"
            name="Interest"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <LegendDot color="bg-muted-foreground/50" label="Contributions" />
        <LegendDot color="bg-[#f43f5e]" label="Interest" />
      </div>
    </div>
  );
}

function GoalTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value as number), 0);
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-medium text-muted-foreground">Year {label as number}</p>
      {payload.map((p) => (
        <p
          key={p.name}
          className="mt-1 font-mono font-semibold"
          style={{ color: p.color }}
        >
          {p.name}: {formatCurrency(p.value as number)}
        </p>
      ))}
      <p className="mt-1 border-t border-border/40 pt-1 font-mono font-semibold text-foreground">
        Total: {formatCurrency(total)}
      </p>
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function BigStat({
  label,
  value,
  format,
  gradient,
  accent,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  gradient?: boolean;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass relative overflow-hidden p-5"
    >
      {gradient && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/15 via-transparent to-transparent"
        />
      )}
      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-2 font-mono text-2xl font-semibold tracking-tight",
            accent && "text-rose-400",
          )}
        >
          <AnimatedNumber value={value} format={format} />
        </p>
      </div>
    </motion.div>
  );
}
