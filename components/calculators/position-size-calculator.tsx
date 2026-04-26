"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Ruler } from "lucide-react";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { CalcInput } from "./calc-input";
import { RiskBar } from "./risk-bar";
import { computePosition } from "@/lib/calculators";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type State = {
  accountSize: number;
  riskPct: number;
  entry: number;
  stop: number;
  target: number | null;
};

const DEFAULTS: State = {
  accountSize: 100_000,
  riskPct: 1,
  entry: 100,
  stop: 95,
  target: 115,
};

export function PositionSizeCalculator() {
  const [s, setS] = React.useState<State>(DEFAULTS);

  const r = React.useMemo(
    () =>
      computePosition({
        accountSize: s.accountSize,
        riskPct: s.riskPct,
        entry: s.entry,
        stop: s.stop,
        target: s.target,
      }),
    [s]
  );

  function set<K extends keyof State>(key: K, value: State[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }
  function num(v: number | null, fb = 0) {
    return v == null || !Number.isFinite(v) ? fb : v;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
          <Ruler className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Calculator
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Position size
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Size every trade against a fixed % of your account.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="glass space-y-4 self-start p-5">
          <CalcInput
            id="account"
            label="Account size"
            prefix="$"
            value={s.accountSize}
            onChange={(v) => set("accountSize", num(v))}
          />
          <CalcInput
            id="risk-pct"
            label="Risk per trade"
            suffix="%"
            step="0.1"
            value={s.riskPct}
            onChange={(v) => set("riskPct", Math.max(0, num(v)))}
            helpText="Default 1% — change with intention."
          />
          <CalcInput
            id="entry"
            label="Entry price"
            prefix="$"
            value={s.entry}
            onChange={(v) => set("entry", num(v))}
          />
          <CalcInput
            id="stop"
            label="Stop loss price"
            prefix="$"
            value={s.stop}
            onChange={(v) => set("stop", num(v))}
          />
          <CalcInput
            id="target"
            label="Target price (optional)"
            prefix="$"
            value={s.target ?? null}
            onChange={(v) => set("target", v)}
          />
        </aside>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BigStat
              label="Recommended shares"
              value={r.shares}
              format={(n) => Math.round(n).toLocaleString()}
              gradient
            />
            <BigStat
              label="Position value"
              value={r.positionValue}
              format={(n) => formatCurrency(n)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SmallStat
              label="At risk"
              value={r.shares > 0 ? r.shares * r.riskPerShare : 0}
              format={(n) => formatCurrency(n)}
              tone="down"
              hint={`${formatCurrency(r.riskPerShare)} / share`}
            />
            <SmallStat
              label="Reward (target)"
              value={r.rewardAmount ?? null}
              format={(n) => formatCurrency(n)}
              tone="up"
              hint={
                r.rewardPerShare != null
                  ? `${formatCurrency(Math.max(0, r.rewardPerShare))} / share`
                  : "set a target"
              }
            />
            <SmallStat
              label="Risk / reward"
              value={r.rrRatio}
              format={(n) => `1 : ${n.toFixed(2)}`}
              tone={
                r.rrRatio == null
                  ? "muted"
                  : r.rrRatio >= 2
                    ? "up"
                    : r.rrRatio >= 1
                      ? "muted"
                      : "down"
              }
              hint={
                r.rrRatio == null
                  ? "set a target"
                  : r.rrRatio >= 2
                    ? "Strong setup"
                    : r.rrRatio >= 1
                      ? "Marginal"
                      : "Unfavorable"
              }
            />
          </div>

          <div className="glass p-6">
            <h3 className="mb-6 text-sm font-semibold text-muted-foreground">
              Risk vs reward
            </h3>
            {r.valid ? (
              <RiskBar
                entry={s.entry}
                stop={s.stop}
                target={s.target}
                long={r.long}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter account size, entry, and stop loss to visualize the trade.
              </p>
            )}
          </div>

          {!r.valid && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-500">
              Adjust your inputs — entry must differ from stop and account/risk
              must be greater than zero.
            </div>
          )}
        </div>
      </div>
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
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent"
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
