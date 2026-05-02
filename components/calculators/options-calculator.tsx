"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";
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
import { blackScholes, payoffSeries } from "@/lib/options";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type State = {
  spot: number;
  strike: number;
  days: number;
  rate: number;
  vol: number;
};

const DEFAULTS: State = {
  spot: 150,
  strike: 150,
  days: 30,
  rate: 5,
  vol: 25,
};

function moneyness(spot: number, strike: number): string {
  const ratio = spot / strike;
  if (ratio > 1.005) return "In the money";
  if (ratio < 0.995) return "Out of the money";
  return "At the money";
}

export function OptionsCalculator() {
  const [s, setS] = React.useState<State>(DEFAULTS);

  function set<K extends keyof State>(key: K, value: number) {
    setS((prev) => ({ ...prev, [key]: value }));
  }
  function num(v: number | null, fb = 0) {
    return v == null || !Number.isFinite(v) ? fb : v;
  }

  const result = React.useMemo(() => {
    return blackScholes({
      spot: s.spot,
      strike: s.strike,
      expiry: s.days / 365,
      rate: s.rate / 100,
      vol: s.vol / 100,
    });
  }, [s]);

  const series = React.useMemo(() => {
    if (!result) return [];
    return payoffSeries(s.strike, result.call, result.put, s.spot);
  }, [result, s.strike, s.spot]);

  const greeks = result
    ? [
        { label: "Call delta", value: result.callDelta, fmt: (n: number) => n.toFixed(4) },
        { label: "Put delta", value: result.putDelta, fmt: (n: number) => n.toFixed(4) },
        { label: "Gamma", value: result.gamma, fmt: (n: number) => n.toFixed(6) },
        { label: "Theta / day", value: result.callTheta, fmt: (n: number) => `$${n.toFixed(4)}` },
        { label: "Vega / 1%", value: result.vega, fmt: (n: number) => `$${n.toFixed(4)}` },
        { label: "Call rho / 1%", value: result.callRho, fmt: (n: number) => `$${n.toFixed(4)}` },
        { label: "Put rho / 1%", value: result.putRho, fmt: (n: number) => `$${n.toFixed(4)}` },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/30">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Calculator
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Options pricing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Black-Scholes model · European-style options
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="glass space-y-4 self-start p-5">
          <CalcInput
            id="spot"
            label="Spot price"
            prefix="$"
            value={s.spot}
            onChange={(v) => set("spot", num(v, 150))}
          />
          <CalcInput
            id="strike"
            label="Strike price"
            prefix="$"
            value={s.strike}
            onChange={(v) => set("strike", num(v, 150))}
          />
          <CalcInput
            id="days"
            label="Days to expiry"
            value={s.days}
            step="1"
            min="1"
            onChange={(v) => set("days", Math.max(1, num(v, 30)))}
          />
          <CalcInput
            id="rate"
            label="Risk-free rate"
            suffix="%"
            step="0.1"
            value={s.rate}
            onChange={(v) => set("rate", num(v, 5))}
          />
          <CalcInput
            id="vol"
            label="Implied volatility"
            suffix="%"
            step="0.5"
            value={s.vol}
            onChange={(v) => set("vol", Math.max(0.1, num(v, 25)))}
          />
        </aside>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <BigStat
                  label="Call price"
                  value={result.call}
                  format={(n) => formatCurrency(n)}
                  gradient
                />
                <BigStat
                  label="Put price"
                  value={result.put}
                  format={(n) => formatCurrency(n)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SmallStat
                  label="Prob. ITM (call)"
                  value={result.probITM * 100}
                  format={(n) => `${n.toFixed(1)}%`}
                  tone="muted"
                />
                <div className="glass p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Moneyness
                  </p>
                  <p className="mt-1 font-mono text-xl font-semibold">
                    {moneyness(s.spot, s.strike)}
                  </p>
                </div>
              </div>

              <div className="glass p-5">
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                  Greeks
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {greeks.map(({ label, value, fmt }) => (
                    <div key={label}>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 font-mono text-base font-semibold tabular-nums",
                          value > 0
                            ? "text-[#10b981]"
                            : value < 0
                              ? "text-[#ef4444]"
                              : ""
                        )}
                      >
                        {fmt(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-5">
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                  Payoff at expiration
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={series}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="s"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={40}
                    />
                    <YAxis
                      orientation="right"
                      tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground) / 0.4)" strokeDasharray="4 2" />
                    <ReferenceLine x={s.strike} stroke="hsl(var(--muted-foreground) / 0.3)" strokeDasharray="4 2" />
                    <Tooltip content={<PayoffTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="call"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name="Call P&L"
                    />
                    <Line
                      type="monotone"
                      dataKey="put"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={false}
                      name="Put P&L"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-4 rounded-full bg-[#10b981]" />
                    Call P&amp;L
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-4 rounded-full bg-[#f43f5e]" />
                    Put P&amp;L
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="glass p-6 text-sm text-muted-foreground">
              Enter valid inputs to calculate option prices and Greeks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PayoffTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const spot = (payload[0]?.payload as { s: number }).s;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="text-muted-foreground">S = {formatCurrency(spot)}</p>
      {payload.map((p) => (
        <p
          key={p.name}
          className="mt-1 font-mono font-semibold"
          style={{ color: p.color }}
        >
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
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/15 via-transparent to-transparent"
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
