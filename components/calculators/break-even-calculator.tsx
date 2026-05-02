"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { CalcInput } from "./calc-input";
import { computeBreakEven } from "@/lib/calculators";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

type State = {
  fixedCosts: number;
  variableCostPerUnit: number;
  pricePerUnit: number;
  currentUnits: number | null;
};

const DEFAULTS: State = {
  fixedCosts: 50000,
  variableCostPerUnit: 30,
  pricePerUnit: 75,
  currentUnits: 1200,
};

function buildChartSeries(
  fixedCosts: number,
  variablePerUnit: number,
  pricePerUnit: number,
  bepUnits: number
) {
  const maxUnits = Math.ceil(bepUnits * 2);
  const steps = 40;
  const stepSize = maxUnits / steps;
  const points: Array<{ units: number; fixed: number; totalCost: number; revenue: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const units = i * stepSize;
    points.push({
      units: parseFloat(units.toFixed(1)),
      fixed: fixedCosts,
      totalCost: fixedCosts + variablePerUnit * units,
      revenue: pricePerUnit * units,
    });
  }
  return points;
}

export function BreakEvenCalculator() {
  const [s, setS] = React.useState<State>(DEFAULTS);

  function set<K extends keyof State>(key: K, value: State[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }
  function num(v: number | null, fb = 0) {
    return v == null || !Number.isFinite(v) ? fb : v;
  }

  const result = React.useMemo(
    () =>
      computeBreakEven({
        fixedCosts: s.fixedCosts,
        variableCostPerUnit: s.variableCostPerUnit,
        pricePerUnit: s.pricePerUnit,
        currentUnits: s.currentUnits ?? undefined,
      }),
    [s]
  );

  const series = React.useMemo(() => {
    if (!result.valid || result.bepUnits <= 0) return [];
    return buildChartSeries(
      s.fixedCosts,
      s.variableCostPerUnit,
      s.pricePerUnit,
      result.bepUnits
    );
  }, [result, s]);

  const negativeCM = result.contributionMargin < 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/30">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Calculator
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Break-even
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Units and revenue needed to cover all costs
          </p>
        </div>
      </header>

      {negativeCM && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs text-red-400">
          Selling price is below variable cost per unit — contribution margin is
          negative. Increase your price or reduce variable costs.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="glass space-y-4 self-start p-5">
          <CalcInput
            id="fixed-costs"
            label="Fixed costs / period"
            prefix="$"
            value={s.fixedCosts}
            onChange={(v) => set("fixedCosts", Math.max(0, num(v)))}
          />
          <CalcInput
            id="variable-cost"
            label="Variable cost per unit"
            prefix="$"
            value={s.variableCostPerUnit}
            onChange={(v) => set("variableCostPerUnit", Math.max(0, num(v)))}
          />
          <CalcInput
            id="price-per-unit"
            label="Selling price per unit"
            prefix="$"
            value={s.pricePerUnit}
            onChange={(v) => set("pricePerUnit", Math.max(0, num(v)))}
          />
          <CalcInput
            id="current-units"
            label="Current units sold (optional)"
            value={s.currentUnits}
            onChange={(v) => set("currentUnits", v)}
            helpText="Used to calculate margin of safety."
          />
        </aside>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BigStat
              label="Break-even units"
              value={result.valid ? result.bepUnits : 0}
              format={(n) => Math.round(n).toLocaleString()}
              gradient
            />
            <BigStat
              label="Break-even revenue"
              value={result.valid ? result.bepRevenue : 0}
              format={(n) => formatCurrency(n)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SmallStat
              label="Contribution margin"
              value={result.contributionMargin}
              format={(n) => `${formatCurrency(n)} / unit`}
              tone={result.contributionMargin >= 0 ? "up" : "down"}
            />
            <SmallStat
              label="CM ratio"
              value={result.contributionMarginRatio * 100}
              format={(n) => `${n.toFixed(1)}%`}
              tone={result.contributionMarginRatio >= 0 ? "muted" : "down"}
            />
            <SmallStat
              label="Margin of safety"
              value={result.marginOfSafety ?? null}
              format={(n) => formatCurrency(n)}
              tone={
                result.marginOfSafety == null
                  ? "muted"
                  : result.marginOfSafety >= 0
                    ? "up"
                    : "down"
              }
              hint={
                result.marginOfSafetyPct != null
                  ? `${(result.marginOfSafetyPct * 100).toFixed(1)}% of revenue`
                  : "enter current units"
              }
            />
          </div>

          {series.length > 0 && (
            <div className="glass p-5">
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                Cost vs revenue
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={series}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="units"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v: number) => v.toLocaleString()}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={40}
                  />
                  <YAxis
                    orientation="right"
                    tickFormatter={(v: number) => formatCompact(v)}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <ReferenceLine
                    x={result.bepUnits}
                    stroke="hsl(var(--muted-foreground) / 0.5)"
                    strokeDasharray="4 2"
                    label={{
                      value: "BEP",
                      position: "top",
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <Tooltip content={<BreakEvenTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="fixed"
                    stroke="hsl(var(--muted-foreground) / 0.5)"
                    strokeWidth={1.5}
                    dot={false}
                    name="Fixed costs"
                    strokeDasharray="4 2"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalCost"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="Total costs"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-4 rounded-full bg-muted-foreground/50" />
                  Fixed costs
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-4 rounded-full bg-amber-500" />
                  Total costs
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-4 rounded-full bg-[#10b981]" />
                  Revenue
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BreakEvenTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const units = (payload[0]?.payload as { units: number }).units;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="text-muted-foreground">{units.toLocaleString()} units</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-1 font-mono font-semibold" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value as number)}
        </p>
      ))}
    </div>
  );
}

function BigStat({
  label,
  value,
  format,
  gradient,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  gradient?: boolean;
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
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-transparent"
        />
      )}
      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">
          <AnimatedNumber value={value} format={format} />
        </p>
      </div>
    </motion.div>
  );
}

function SmallStat({
  label,
  value,
  format,
  tone,
  hint,
}: {
  label: string;
  value: number | null;
  format: (n: number) => string;
  tone: "up" | "down" | "muted";
  hint?: string;
}) {
  const color =
    tone === "up" ? "text-[#10b981]" : tone === "down" ? "text-[#ef4444]" : "";
  return (
    <div className="glass p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 font-mono text-xl font-semibold", color)}>
        {value == null ? "—" : <AnimatedNumber value={value} format={format} />}
      </p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
