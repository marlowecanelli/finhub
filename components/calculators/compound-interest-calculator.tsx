"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { CalcInput } from "./calc-input";
import { projectCompound, type CompoundInputs } from "@/lib/calculators";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

type CompoundFreq = "monthly" | "quarterly" | "annually";

type State = {
  principal: number;
  monthlyContrib: number;
  annualRate: number;
  years: number;
  compoundFreq: CompoundFreq;
};

const DEFAULTS: State = {
  principal: 10000,
  monthlyContrib: 500,
  annualRate: 8,
  years: 20,
  compoundFreq: "monthly",
};

export function CompoundInterestCalculator() {
  const [s, setS] = React.useState<State>(DEFAULTS);

  function set<K extends keyof State>(key: K, value: State[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }
  function num(v: number | null, fb = 0) {
    return v == null || !Number.isFinite(v) ? fb : v;
  }

  const inputs: CompoundInputs = {
    principal: s.principal,
    monthlyContrib: s.monthlyContrib,
    annualRate: s.annualRate,
    years: s.years,
    compoundFreq: s.compoundFreq,
  };

  const rows = React.useMemo(() => projectCompound(inputs), [
    s.principal,
    s.monthlyContrib,
    s.annualRate,
    s.years,
    s.compoundFreq,
  ]);

  const lastRow = rows[rows.length - 1];
  const finalBalance = lastRow?.balance ?? 0;
  const totalContributions = lastRow?.contributions ?? s.principal;
  const totalInterest = lastRow?.interest ?? 0;
  const growthMultiple =
    totalContributions > 0 ? finalBalance / totalContributions : 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#10b981] ring-1 ring-inset ring-[#10b981]/30">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Calculator
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Compound interest
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grow a lump sum with regular contributions
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="glass space-y-4 self-start p-5">
          <CalcInput
            id="principal"
            label="Initial deposit"
            prefix="$"
            value={s.principal}
            onChange={(v) => set("principal", Math.max(0, num(v)))}
          />
          <CalcInput
            id="monthly-contrib"
            label="Monthly contribution"
            prefix="$"
            value={s.monthlyContrib}
            onChange={(v) => set("monthlyContrib", Math.max(0, num(v)))}
          />
          <CalcInput
            id="annual-rate"
            label="Annual rate"
            suffix="%"
            step="0.1"
            value={s.annualRate}
            onChange={(v) => set("annualRate", Math.max(0, num(v)))}
          />
          <CalcInput
            id="years"
            label="Years"
            step="1"
            min="1"
            value={s.years}
            onChange={(v) => set("years", Math.max(1, Math.min(50, Math.round(num(v, 20)))))}
          />
          <div>
            <label
              htmlFor="freq"
              className="block text-xs text-muted-foreground"
            >
              Compounding frequency
            </label>
            <select
              id="freq"
              value={s.compoundFreq}
              onChange={(e) =>
                set("compoundFreq", e.target.value as CompoundFreq)
              }
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background/50 px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BigStat
              label="Final balance"
              value={finalBalance}
              format={(n) => formatCurrency(n)}
              gradient
            />
            <BigStat
              label="Total interest earned"
              value={totalInterest}
              format={(n) => formatCurrency(n)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SmallStat
              label="Total contributions"
              value={totalContributions}
              format={(n) => formatCurrency(n)}
              tone="muted"
            />
            <SmallStat
              label="× growth multiple"
              value={growthMultiple}
              format={(n) => `${n.toFixed(2)}×`}
              tone="up"
            />
          </div>

          <div className="glass p-5">
            <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
              Growth over time
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={rows}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="contrib-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="interest-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
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
                <Tooltip content={<CompoundTooltip />} />
                <Area
                  type="monotone"
                  dataKey="contributions"
                  stackId="1"
                  stroke="hsl(var(--muted-foreground) / 0.5)"
                  strokeWidth={1.5}
                  fill="url(#contrib-fill)"
                  name="Contributions"
                />
                <Area
                  type="monotone"
                  dataKey="interest"
                  stackId="1"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  fill="url(#interest-fill)"
                  name="Interest"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-4 rounded-full bg-muted-foreground/50" />
                Contributions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-4 rounded-full bg-[#10b981]" />
                Interest
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompoundTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-medium text-muted-foreground">Year {label as number}</p>
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
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#10b981]/15 via-transparent to-transparent"
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
