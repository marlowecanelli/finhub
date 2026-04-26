"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { CalcInput } from "./calc-input";
import { DividendChart, CompareChart } from "./dividend-charts";
import { DividendTable } from "./dividend-table";
import { projectDividends, type DividendInputs } from "@/lib/calculators";
import { formatCurrency } from "@/lib/utils";

const DEFAULTS: DividendInputs = {
  initialInvestment: 10_000,
  monthlyContribution: 500,
  annualYieldPct: 3.5,
  dividendGrowthPct: 5,
  priceAppreciationPct: 6,
  years: 20,
  reinvest: true,
};

export function DividendCalculator() {
  const [inputs, setInputs] = React.useState<DividendInputs>(DEFAULTS);

  const rows = React.useMemo(() => projectDividends(inputs), [inputs]);
  const last = rows[rows.length - 1];
  const finalValue = last?.portfolioValue ?? inputs.initialInvestment;
  const totalDividends = last?.dividendsReceivedTotal ?? 0;
  const totalContrib = last?.contributions ?? inputs.initialInvestment;
  const gain = finalValue - totalContrib;

  function set<K extends keyof DividendInputs>(key: K, value: DividendInputs[K]) {
    setInputs((p) => ({ ...p, [key]: value }));
  }
  function num(v: number | null, fallback = 0) {
    return v == null || !Number.isFinite(v) ? fallback : v;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/10 text-[#10b981] ring-1 ring-inset ring-[#10b981]/30">
          <Coins className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Calculator
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Dividend projection
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live projection of portfolio value, dividends, and reinvestment impact.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Inputs */}
        <aside className="glass space-y-4 self-start p-5">
          <CalcInput
            id="initial"
            label="Initial investment"
            prefix="$"
            value={inputs.initialInvestment}
            onChange={(v) => set("initialInvestment", num(v))}
          />
          <CalcInput
            id="monthly"
            label="Monthly contribution"
            prefix="$"
            value={inputs.monthlyContribution}
            onChange={(v) => set("monthlyContribution", num(v))}
          />
          <CalcInput
            id="yield"
            label="Annual dividend yield"
            suffix="%"
            step="0.1"
            value={inputs.annualYieldPct}
            onChange={(v) => set("annualYieldPct", num(v))}
          />
          <CalcInput
            id="growth"
            label="Dividend growth rate"
            suffix="%"
            step="0.1"
            value={inputs.dividendGrowthPct}
            onChange={(v) => set("dividendGrowthPct", num(v))}
            helpText="Annual % the dividend yield grows"
          />
          <CalcInput
            id="appreciation"
            label="Stock price appreciation"
            suffix="%"
            step="0.1"
            value={inputs.priceAppreciationPct}
            onChange={(v) => set("priceAppreciationPct", num(v))}
          />
          <CalcInput
            id="years"
            label="Number of years"
            value={inputs.years}
            onChange={(v) => set("years", Math.max(0, Math.min(60, Math.round(num(v)))))}
          />

          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3">
            <span>
              <span className="block text-sm font-medium">Reinvest dividends</span>
              <span className="block text-xs text-muted-foreground">
                Compound dividends back into the position monthly
              </span>
            </span>
            <Toggle
              checked={inputs.reinvest}
              onChange={(v) => set("reinvest", v)}
            />
          </label>
        </aside>

        {/* Outputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <BigStat
              label="Projected value"
              value={finalValue}
              tone="primary"
              gradient
            />
            <BigStat label="Total dividends" value={totalDividends} tone="up" />
            <BigStat
              label="Net gain"
              value={gain}
              tone={gain >= 0 ? "up" : "down"}
            />
          </div>

          <DividendChart rows={rows} reinvest={inputs.reinvest} />
          <CompareChart rows={rows} />
          <DividendTable rows={rows} />
        </div>
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  tone,
  gradient,
}: {
  label: string;
  value: number;
  tone: "primary" | "up" | "down";
  gradient?: boolean;
}) {
  const color =
    tone === "up" ? "text-[#10b981]" : tone === "down" ? "text-[#ef4444]" : "";
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
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent"
        />
      )}
      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={`mt-2 font-mono text-3xl font-semibold tracking-tight ${color}`}>
          <AnimatedNumber value={value} format={(n) => formatCurrency(n)} />
        </p>
      </div>
    </motion.div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
        checked
          ? "border-primary/60 bg-primary"
          : "border-border bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
