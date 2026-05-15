"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNetWorthStore } from "@/lib/networth/store";
import { simulateStrategy, type StrategyKey } from "@/lib/networth/debtStrategies";
import { formatMoney, formatMonths } from "@/lib/networth/utils";
import { cn } from "@/lib/utils";

export function DebtStrategyComparison() {
  const liabilities = useNetWorthStore((s) => s.liabilities);
  const [extra, setExtra] = useState(0);

  const results = useMemo(() => {
    return {
      avalanche: simulateStrategy(liabilities, "avalanche", extra),
      snowball: simulateStrategy(liabilities, "snowball", extra),
      minimum: simulateStrategy(liabilities, "minimum", 0),
    };
  }, [liabilities, extra]);

  if (!results.minimum) {
    return null;
  }

  const chartData = useMemo(() => {
    const all = new Set<string>();
    const a = results.avalanche?.payoffByDate;
    const s = results.snowball?.payoffByDate;
    const m = results.minimum?.payoffByDate;
    [a, s, m].forEach((map) => map?.forEach((_v, k) => all.add(k)));
    const sorted = Array.from(all).sort();
    return sorted.map((d) => ({
      date: d,
      avalanche: a?.get(d) ?? null,
      snowball: s?.get(d) ?? null,
      minimum: m?.get(d) ?? null,
    }));
  }, [results]);

  const best = results.avalanche && results.snowball
    ? results.avalanche.totalInterest <= results.snowball.totalInterest
      ? "avalanche"
      : "snowball"
    : "avalanche";

  return (
    <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white">Debt Strategy Comparison</h3>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
          Killer feature
        </span>
      </div>

      <div className="mt-5">
        <label className="block text-xs uppercase tracking-wider text-zinc-400">
          Extra payment per month
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={2000}
            step={25}
            value={extra}
            onChange={(e) => setExtra(parseInt(e.target.value))}
            className="flex-1 accent-emerald-500"
          />
          <div className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-right font-medium text-white">
            {formatMoney(extra)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <StrategyCard
          name="Avalanche"
          subtitle="Highest rate first"
          result={results.avalanche}
          highlight={best === "avalanche" && extra > 0}
          color="emerald"
        />
        <StrategyCard
          name="Snowball"
          subtitle="Smallest balance first"
          result={results.snowball}
          highlight={best === "snowball" && extra > 0}
          color="cyan"
        />
        <StrategyCard
          name="Minimum Only"
          subtitle="No extra payment"
          result={results.minimum}
          highlight={false}
          color="zinc"
        />
      </div>

      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="avGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="snGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} minTickGap={28} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{ background: "rgba(15,15,17,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
              formatter={(v: number) => formatMoney(v)}
            />
            <Area type="monotone" dataKey="avalanche" stroke="#10b981" strokeWidth={2} fill="url(#avGrad)" connectNulls />
            <Area type="monotone" dataKey="snowball" stroke="#06b6d4" strokeWidth={2} fill="url(#snGrad)" connectNulls />
            <Area type="monotone" dataKey="minimum" stroke="#71717a" strokeDasharray="4 4" strokeWidth={1.5} fill="transparent" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StrategyCard({
  name,
  subtitle,
  result,
  highlight,
  color,
}: {
  name: string;
  subtitle: string;
  result: ReturnType<typeof simulateStrategy>;
  highlight: boolean;
  color: "emerald" | "cyan" | "zinc";
}) {
  const ring = highlight ? "ring-2 ring-emerald-400/50" : "ring-1 ring-white/5";
  const colorBar = {
    emerald: "from-emerald-500 to-emerald-400",
    cyan: "from-cyan-500 to-cyan-400",
    zinc: "from-zinc-600 to-zinc-500",
  }[color];
  return (
    <div className={cn("rounded-2xl bg-zinc-900/40 p-4", ring)}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-white">{name}</div>
          <div className="text-xs text-zinc-500">{subtitle}</div>
        </div>
        {highlight && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            Best
          </span>
        )}
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <Row label="Debt free in" value={result ? formatMonths(result.months) : "—"} />
        <Row label="Total interest" value={result ? formatMoney(result.totalInterest) : "—"} />
        <Row label="Total paid" value={result ? formatMoney(result.totalPaid) : "—"} />
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
        <div className={cn("h-full bg-gradient-to-r", colorBar)} style={{ width: highlight ? "100%" : "65%" }} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  );
}
