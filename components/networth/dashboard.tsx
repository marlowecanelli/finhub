"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Plus, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useNetWorthStore } from "@/lib/networth/store";
import {
  formatMoney,
  formatMoneyInt,
  totalAssetsOf,
  totalLiabilitiesOf,
  liquidNetWorthOf,
  trailingVelocity,
  debtFreeMonths,
  formatMonths,
  changeSince,
  allTimeChange,
  buildSnapshot,
} from "@/lib/networth/utils";
import { ASSET_CATEGORY_META, LIABILITY_CATEGORY_META } from "@/lib/networth/types";
import { PrivateNumber, PrivacyToggleButton } from "./privacy";
import { AnimatedNumber } from "./animated-number";
import { cn } from "@/lib/utils";

const ALLOC_COLORS = [
  "#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#f43f5e", "#3b82f6", "#84cc16", "#ec4899", "#a78bfa",
];

type Range = "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

export function NetWorthDashboard() {
  const assets = useNetWorthStore((s) => s.assets);
  const liabilities = useNetWorthStore((s) => s.liabilities);
  const snapshots = useNetWorthStore((s) => s.snapshots);
  const annotations = useNetWorthStore((s) => s.annotations);
  const activity = useNetWorthStore((s) => s.activity);
  const linkedAt = useNetWorthStore((s) => s.linkedPortfolioUpdatedAt);
  const [mode, setMode] = useState<"total" | "liquid">("total");
  const [range, setRange] = useState<Range>("3M");

  const totalAssets = totalAssetsOf(assets);
  const totalLiab = totalLiabilitiesOf(liabilities);
  const netWorth = totalAssets - totalLiab;
  const liquid = liquidNetWorthOf(assets, liabilities);
  const display = mode === "total" ? netWorth : liquid;

  // Ensure today exists in snapshot list for charting
  const todaySnap = buildSnapshot(assets, liabilities);
  const allSnaps = useMemo(() => {
    const map = new Map(snapshots.map((s) => [s.date, s]));
    map.set(todaySnap.date, todaySnap);
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [snapshots, todaySnap]);

  const ch1d = changeSince(allSnaps, 1);
  const ch7d = changeSince(allSnaps, 7);
  const ch30d = changeSince(allSnaps, 30);
  const chAll = allTimeChange(allSnaps);

  const v90 = trailingVelocity(allSnaps, 90);
  const ratio = totalLiab > 0 ? totalAssets / totalLiab : totalAssets > 0 ? 10 : 0;
  const dfMonths = debtFreeMonths(liabilities);

  // filter for chart
  const filteredSnaps = useMemo(() => {
    if (range === "ALL" || allSnaps.length === 0) return allSnaps;
    const lastSnap = allSnaps[allSnaps.length - 1];
    if (!lastSnap) return allSnaps;
    const latest = new Date(lastSnap.date);
    const start = new Date(latest);
    if (range === "1M") start.setMonth(start.getMonth() - 1);
    else if (range === "3M") start.setMonth(start.getMonth() - 3);
    else if (range === "6M") start.setMonth(start.getMonth() - 6);
    else if (range === "1Y") start.setFullYear(start.getFullYear() - 1);
    else if (range === "YTD") {
      start.setMonth(0);
      start.setDate(1);
    }
    const cutoff = start.toISOString().slice(0, 10);
    return allSnaps.filter((s) => s.date >= cutoff);
  }, [allSnaps, range]);

  // Forecast: extend 12 months forward by velocity
  const chartData = useMemo(() => {
    type Row = {
      date: string;
      value: number | null;
      forecast: number | null;
      assets: number;
      liabilities: number;
    };
    const base: Row[] = filteredSnaps.map((s) => ({
      date: s.date,
      value: mode === "total" ? s.netWorth : s.liquidNetWorth,
      forecast: null,
      assets: s.totalAssets,
      liabilities: s.totalLiabilities,
    }));
    if (base.length === 0) return base;
    const last = base[base.length - 1];
    if (!last) return base;
    const forecast: Row[] = [];
    const lastValue = last.value ?? 0;
    for (let i = 1; i <= 12; i++) {
      const d = new Date(last.date);
      d.setMonth(d.getMonth() + i);
      forecast.push({
        date: d.toISOString().slice(0, 10),
        value: null,
        forecast: lastValue + v90 * i,
        assets: 0,
        liabilities: 0,
      });
    }
    base[base.length - 1] = { ...last, forecast: lastValue };
    return [...base, ...forecast];
  }, [filteredSnaps, mode, v90]);

  const trendUp = (ch30d?.delta ?? 0) >= 0;

  // Allocation data
  const allocAssets = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assets.filter((x) => !x.archived)) {
      map.set(a.category, (map.get(a.category) ?? 0) + a.value);
    }
    return Array.from(map.entries()).map(([k, v]) => ({
      name: ASSET_CATEGORY_META[k as keyof typeof ASSET_CATEGORY_META]?.label ?? k,
      key: k,
      value: v,
    }));
  }, [assets]);
  const allocLiab = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of liabilities.filter((x) => !x.archived)) {
      map.set(l.category, (map.get(l.category) ?? 0) + l.balance);
    }
    return Array.from(map.entries()).map(([k, v]) => ({
      name: LIABILITY_CATEGORY_META[k as keyof typeof LIABILITY_CATEGORY_META]?.label ?? k,
      key: k,
      value: v,
    }));
  }, [liabilities]);

  const isEmpty = assets.length === 0 && liabilities.length === 0;
  const recentlyLinked =
    linkedAt && Date.now() - new Date(linkedAt).getTime() < 5 * 60 * 1000;

  if (isEmpty) {
    return <EmptyDashboard />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HERO */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/5 p-6 md:p-10",
          trendUp
            ? "bg-gradient-to-br from-emerald-950/60 via-zinc-950 to-zinc-950"
            : "bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950"
        )}
      >
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{
            background: trendUp
              ? "radial-gradient(circle, #10b981, transparent 70%)"
              : "radial-gradient(circle, #f43f5e, transparent 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ModePill mode={mode} setMode={setMode} />
              {recentlyLinked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  </span>
                  Live sync
                </span>
              )}
            </div>
            <div className="mt-3 flex items-end gap-3">
              <PrivateNumber className="text-5xl font-semibold tracking-tight text-white md:text-7xl">
                <AnimatedNumber value={display} format={(n) => formatMoneyInt(n)} />
              </PrivateNumber>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
              <ChangePill label="Today" change={ch1d} />
              <ChangePill label="7d" change={ch7d} />
              <ChangePill label="30d" change={ch30d} />
              <ChangePill label="All time" change={chAll} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrivacyToggleButton />
            <Link
              href="/networth/assets"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" /> Add asset
            </Link>
          </div>
        </div>
      </div>

      {/* TREND CHART */}
      <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="font-medium text-white">Net Worth Trend</h3>
          </div>
          <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
            {(["1M", "3M", "6M", "YTD", "1Y", "ALL"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                  range === r
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="nwGradDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v: number) =>
                  Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
                }
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,15,17,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                }}
                labelStyle={{ color: "#a1a1aa", fontSize: 12 }}
                formatter={(value: number) => [formatMoneyInt(value), "Net worth"]}
                labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={trendUp ? "#10b981" : "#f43f5e"}
                strokeWidth={2}
                fill={trendUp ? "url(#nwGrad)" : "url(#nwGradDown)"}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                fill="transparent"
                connectNulls
              />
              {annotations
                .filter((a) =>
                  filteredSnaps.some((s) => s.date === a.date)
                )
                .map((a) => {
                  const snap = filteredSnaps.find((s) => s.date === a.date);
                  if (!snap) return null;
                  const v = mode === "total" ? snap.netWorth : snap.liquidNetWorth;
                  return (
                    <ReferenceDot
                      key={a.id}
                      x={a.date}
                      y={v}
                      r={5}
                      fill="#facc15"
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  );
                })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard
          icon={<Sparkles className="h-4 w-4" />}
          label="Velocity"
          tooltip="Average monthly change in net worth over the trailing 90 days."
          value={
            <span className={v90 >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {v90 >= 0 ? "+" : ""}
              {formatMoneyInt(v90)}/mo
            </span>
          }
        />
        <KPICard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Asset / Liability Ratio"
          tooltip="Total assets divided by total liabilities. Higher is healthier."
          value={
            <span className="text-white">
              {ratio === 10 ? "∞" : `${ratio.toFixed(2)}x`}
            </span>
          }
          extra={
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                style={{ width: `${Math.min((ratio / 10) * 100, 100)}%` }}
              />
            </div>
          }
        />
        <KPICard
          icon={<Wallet className="h-4 w-4" />}
          label="Debt Free In"
          tooltip="Projected payoff timeline at current minimum payment pace."
          value={
            <span className="text-white">
              {dfMonths === null
                ? totalLiab > 0
                  ? "Set minimums"
                  : "—"
                : formatMonths(dfMonths)}
            </span>
          }
        />
      </div>

      {/* ALLOCATION + ACTIVITY */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-5 lg:col-span-2">
          <h3 className="font-medium text-white">Asset Allocation</h3>
          <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocAssets}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {allocAssets.map((_, i) => (
                      <Cell key={i} fill={ALLOC_COLORS[i % ALLOC_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,15,17,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                    formatter={(v: number) => formatMoneyInt(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {allocAssets.length === 0 && (
                <div className="text-sm text-zinc-500">No assets yet.</div>
              )}
              {allocAssets
                .sort((a, b) => b.value - a.value)
                .map((a, i) => {
                  const pct = (a.value / totalAssets) * 100;
                  return (
                    <div key={a.key} className="flex items-center gap-2 text-sm">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{ background: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
                      />
                      <span className="flex-1 text-zinc-300">{a.name}</span>
                      <span className="text-zinc-500">{pct.toFixed(0)}%</span>
                      <PrivateNumber className="w-20 text-right text-zinc-200">
                        {formatMoney(a.value, "USD", true)}
                      </PrivateNumber>
                    </div>
                  );
                })}
            </div>
          </div>
          {allocLiab.length > 0 && (
            <div className="mt-6 border-t border-white/5 pt-4">
              <div className="mb-3 text-sm text-zinc-400">Liabilities by category</div>
              <div className="space-y-2">
                {allocLiab
                  .sort((a, b) => b.value - a.value)
                  .map((l) => {
                    const pct = (l.value / totalLiab) * 100;
                    return (
                      <div key={l.key}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-zinc-300">{l.name}</span>
                          <PrivateNumber className="text-zinc-400">
                            {formatMoney(l.value, "USD", true)}
                          </PrivateNumber>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-rose-500/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-5">
          <h3 className="font-medium text-white">Recent Activity</h3>
          <div className="mt-3 space-y-3">
            {activity.length === 0 && (
              <div className="text-sm text-zinc-500">No activity yet.</div>
            )}
            {activity.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400/70" />
                <div className="flex-1">
                  <div className="text-zinc-200">{e.message}</div>
                  <div className="text-xs text-zinc-500">
                    {new Date(e.ts).toLocaleString()}
                  </div>
                </div>
                {typeof e.delta === "number" && (
                  <PrivateNumber
                    className={cn(
                      "text-xs",
                      e.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {e.delta >= 0 ? "+" : ""}
                    {formatMoney(e.delta, "USD", true)}
                  </PrivateNumber>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModePill({
  mode,
  setMode,
}: {
  mode: "total" | "liquid";
  setMode: (m: "total" | "liquid") => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-white/[0.04] p-1 text-xs">
      <button
        onClick={() => setMode("total")}
        className={cn(
          "rounded-full px-3 py-1 transition",
          mode === "total" ? "bg-emerald-500 text-zinc-950" : "text-zinc-300"
        )}
      >
        Total
      </button>
      <button
        onClick={() => setMode("liquid")}
        className={cn(
          "rounded-full px-3 py-1 transition",
          mode === "liquid" ? "bg-emerald-500 text-zinc-950" : "text-zinc-300"
        )}
      >
        Liquid
      </button>
    </div>
  );
}

function ChangePill({
  label,
  change,
}: {
  label: string;
  change: { delta: number; pct: number } | null;
}) {
  if (!change) {
    return (
      <span className="flex items-center gap-1 text-zinc-500">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span>—</span>
      </span>
    );
  }
  const up = change.delta >= 0;
  return (
    <span className="flex items-center gap-1">
      <span className="text-xs uppercase tracking-wider text-zinc-500">{label}</span>
      <PrivateNumber
        className={cn(
          "inline-flex items-center gap-0.5 font-medium",
          up ? "text-emerald-400" : "text-rose-400"
        )}
      >
        {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {formatMoney(Math.abs(change.delta), "USD", true)}
        <span className="text-zinc-500">({up ? "+" : ""}{change.pct.toFixed(1)}%)</span>
      </PrivateNumber>
    </span>
  );
}

function KPICard({
  icon,
  label,
  value,
  tooltip,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tooltip?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-white/5 bg-zinc-950/60 p-5 transition hover:border-white/10">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400" title={tooltip}>
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {extra}
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
        💰
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-white">
        Welcome to your Net Worth Tracker
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-zinc-400">
        Track every dollar you own and owe in one place. Add your first asset to see
        the magic.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/networth/assets"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" /> Add your first asset
        </Link>
        <Link
          href="/networth/liabilities"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
        >
          Add a liability
        </Link>
      </div>
    </div>
  );
}
