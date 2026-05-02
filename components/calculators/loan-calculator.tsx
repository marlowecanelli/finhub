"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Landmark } from "lucide-react";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { CalcInput } from "./calc-input";
import { computeLoan } from "@/lib/calculators";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type State = {
  principal: number;
  annualRate: number;
  termYears: number;
  extraMonthly: number;
};

const DEFAULTS: State = {
  principal: 300000,
  annualRate: 6.5,
  termYears: 30,
  extraMonthly: 0,
};

export function LoanCalculator() {
  const [s, setS] = React.useState<State>(DEFAULTS);

  function set<K extends keyof State>(key: K, value: number) {
    setS((prev) => ({ ...prev, [key]: value }));
  }
  function num(v: number | null, fb = 0) {
    return v == null || !Number.isFinite(v) ? fb : v;
  }

  const result = React.useMemo(
    () =>
      computeLoan({
        principal: s.principal,
        annualRate: s.annualRate,
        termYears: s.termYears,
        extraMonthly: s.extraMonthly,
      }),
    [s]
  );

  const payoffYears = Math.floor(result.payoffMonths / 12);
  const payoffMonthsRem = result.payoffMonths % 12;
  const payoffLabel =
    payoffYears > 0
      ? `${payoffYears}y ${payoffMonthsRem}m`
      : `${payoffMonthsRem}m`;

  const interestPct =
    s.principal > 0 ? (result.totalInterest / s.principal) * 100 : 0;

  const principalShare =
    result.totalPaid > 0 ? s.principal / result.totalPaid : 0;
  const interestShare = 1 - principalShare;

  // Show first 6 months + year-end snapshots from schedule
  const tableRows = result.schedule.filter(
    (r) => r.month <= 6 || r.month % 12 === 0
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/30">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Calculator
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Loan / mortgage
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly payment and total interest across the loan term
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="glass space-y-4 self-start p-5">
          <CalcInput
            id="loan-principal"
            label="Loan amount"
            prefix="$"
            value={s.principal}
            onChange={(v) => set("principal", Math.max(0, num(v)))}
          />
          <CalcInput
            id="loan-rate"
            label="Annual interest rate"
            suffix="%"
            step="0.05"
            value={s.annualRate}
            onChange={(v) => set("annualRate", Math.max(0, num(v)))}
          />
          <CalcInput
            id="loan-term"
            label="Loan term"
            suffix="yrs"
            step="1"
            min="1"
            value={s.termYears}
            onChange={(v) =>
              set("termYears", Math.max(1, Math.min(50, Math.round(num(v, 30)))))
            }
          />
          <CalcInput
            id="extra-monthly"
            label="Extra monthly payment"
            prefix="$"
            value={s.extraMonthly}
            onChange={(v) => set("extraMonthly", Math.max(0, num(v)))}
            helpText="Optional extra payment toward principal."
          />
        </aside>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BigStat
              label="Monthly payment"
              value={result.monthlyPayment}
              format={(n) => formatCurrency(n)}
              gradient
            />
            <BigStat
              label="Total interest paid"
              value={result.totalInterest}
              format={(n) => formatCurrency(n)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SmallStat
              label="Total paid"
              value={result.totalPaid}
              format={(n) => formatCurrency(n)}
              tone="muted"
            />
            <SmallStat
              label="Payoff time"
              value={result.payoffMonths}
              format={() => payoffLabel}
              tone="muted"
            />
            <SmallStat
              label="Interest %"
              value={interestPct}
              format={(n) => `${n.toFixed(1)}%`}
              tone="down"
            />
          </div>

          {/* Principal vs interest bar */}
          <div className="glass p-5">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Principal vs interest
            </h3>
            <div className="flex h-5 w-full overflow-hidden rounded-full">
              <div
                className="bg-sky-500/70 transition-all duration-500"
                style={{ width: `${principalShare * 100}%` }}
              />
              <div
                className="bg-[#ef4444]/60 transition-all duration-500"
                style={{ width: `${interestShare * 100}%` }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-3 rounded-full bg-sky-500/70" />
                Principal ({(principalShare * 100).toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-3 rounded-full bg-[#ef4444]/60" />
                Interest ({(interestShare * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Amortization table */}
          {tableRows.length > 0 && (
            <div className="glass overflow-hidden p-5">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                Amortization schedule
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        Period
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        Principal
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        Interest
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => (
                      <tr
                        key={row.month}
                        className="border-b border-border/20 last:border-0"
                      >
                        <td className="py-1.5 font-mono text-muted-foreground">
                          {row.month % 12 === 0 && row.month > 12
                            ? `Yr ${row.month / 12}`
                            : `Mo ${row.month}`}
                        </td>
                        <td className="py-1.5 text-right font-mono text-[#10b981]">
                          {formatCurrency(row.principal)}
                        </td>
                        <td className="py-1.5 text-right font-mono text-[#ef4444]/80">
                          {formatCurrency(row.interest)}
                        </td>
                        <td className="py-1.5 text-right font-mono">
                          {formatCurrency(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/15 via-transparent to-transparent"
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
