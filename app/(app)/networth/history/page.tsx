"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import { Plus } from "lucide-react";
import { useNetWorthStore } from "@/lib/networth/store";
import { formatMoney, formatMoneyInt, buildSnapshot } from "@/lib/networth/utils";
import { PrivacyProvider, PrivateNumber, PrivacyToggleButton } from "@/components/networth/privacy";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function HistoryPage() {
  return (
    <PrivacyProvider>
      <HistoryView />
    </PrivacyProvider>
  );
}

function HistoryView() {
  const snapshots = useNetWorthStore((s) => s.snapshots);
  const assets = useNetWorthStore((s) => s.assets);
  const liabilities = useNetWorthStore((s) => s.liabilities);
  const annotations = useNetWorthStore((s) => s.annotations);
  const addAnnotation = useNetWorthStore((s) => s.addAnnotation);
  const removeAnnotation = useNetWorthStore((s) => s.removeAnnotation);

  const todaySnap = buildSnapshot(assets, liabilities);
  const allSnaps = useMemo(() => {
    const map = new Map(snapshots.map((s) => [s.date, s]));
    map.set(todaySnap.date, todaySnap);
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [snapshots, todaySnap]);

  const [showAddAnn, setShowAddAnn] = useState(false);
  const [annDate, setAnnDate] = useState(todaySnap.date);
  const [annTitle, setAnnTitle] = useState("");
  const [annEmoji, setAnnEmoji] = useState("📌");
  const [annDesc, setAnnDesc] = useState("");

  // This day last year
  const todayLY = useMemo(() => {
    if (allSnaps.length === 0) return null;
    const today = new Date();
    const ly = new Date(today);
    ly.setFullYear(ly.getFullYear() - 1);
    const target = ly.toISOString().slice(0, 10);
    const lySnap = [...allSnaps].reverse().find((s) => s.date <= target);
    if (!lySnap) return null;
    const latest = allSnaps[allSnaps.length - 1];
    if (!latest) return null;
    const delta = latest.netWorth - lySnap.netWorth;
    const pct = lySnap.netWorth !== 0 ? (delta / Math.abs(lySnap.netWorth)) * 100 : 0;
    return { lySnap, latest, delta, pct };
  }, [allSnaps]);

  // Heatmap: 12 months of cells
  const heatmap = useMemo(() => {
    const days = 365;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const data: { date: string; delta: number | null; netWorth: number | null }[] = [];
    const map = new Map(allSnaps.map((s) => [s.date, s]));
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const snap = map.get(key);
      const prevSnap = (() => {
        const prev = new Date(d);
        prev.setDate(prev.getDate() - 1);
        return map.get(prev.toISOString().slice(0, 10));
      })();
      let delta: number | null = null;
      if (snap && prevSnap) delta = snap.netWorth - prevSnap.netWorth;
      data.push({ date: key, delta, netWorth: snap?.netWorth ?? null });
    }
    return data;
  }, [allSnaps]);

  function colorFor(delta: number | null): string {
    if (delta === null) return "bg-zinc-900/60";
    if (delta === 0) return "bg-zinc-800/70";
    if (delta > 0) {
      const intensity = Math.min(Math.log10(delta + 1) / 4, 1);
      if (intensity < 0.25) return "bg-emerald-900/60";
      if (intensity < 0.5) return "bg-emerald-700/70";
      if (intensity < 0.75) return "bg-emerald-500/80";
      return "bg-emerald-400";
    }
    const intensity = Math.min(Math.log10(-delta + 1) / 4, 1);
    if (intensity < 0.25) return "bg-rose-900/60";
    if (intensity < 0.5) return "bg-rose-700/70";
    if (intensity < 0.75) return "bg-rose-500/80";
    return "bg-rose-400";
  }

  const sortedTable = [...allSnaps].reverse();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">History</h1>
          <div className="mt-1 text-sm text-zinc-400">
            {allSnaps.length} snapshot{allSnaps.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrivacyToggleButton />
          <button
            onClick={() => setShowAddAnn(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            <Plus className="h-4 w-4" /> Add event
          </button>
        </div>
      </div>

      {/* FULL CHART */}
      <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-5">
        <h3 className="font-medium text-white">All-time Net Worth</h3>
        <div className="mt-4 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={allSnaps.map((s) => ({ date: s.date, value: s.netWorth }))}>
              <defs>
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} minTickGap={28} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={(v: number) => Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ background: "rgba(15,15,17,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                formatter={(v: number) => formatMoneyInt(v)}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#histGrad)" />
              {annotations.map((a) => {
                const snap = allSnaps.find((s) => s.date === a.date);
                if (!snap) return null;
                return (
                  <ReferenceDot key={a.id} x={a.date} y={snap.netWorth} r={6} fill="#facc15" stroke="#fff" strokeWidth={1.5} />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {annotations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {annotations.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  if (confirm(`Remove "${a.title}"?`)) removeAnnotation(a.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/20"
                title={a.description || ""}
              >
                <span>{a.emoji ?? "📌"}</span>
                <span>{a.title}</span>
                <span className="text-amber-300/60">{a.date}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* HEATMAP */}
      <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-5">
        <h3 className="font-medium text-white">Daily Net Worth Heatmap</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Each cell is one day. Greener cells are larger gains.
        </p>
        <div className="mt-4 overflow-x-auto">
          <div className="inline-grid grid-flow-col gap-1" style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}>
            {heatmap.map((cell) => (
              <div
                key={cell.date}
                title={
                  cell.netWorth !== null
                    ? `${cell.date}: ${formatMoneyInt(cell.netWorth)}${cell.delta !== null ? ` (${cell.delta >= 0 ? "+" : ""}${formatMoney(cell.delta, "USD", true)})` : ""}`
                    : `${cell.date}: no data`
                }
                className={cn("h-3 w-3 rounded-sm transition hover:ring-1 hover:ring-white/40", colorFor(cell.delta))}
              />
            ))}
          </div>
        </div>
      </div>

      {/* THIS DAY LAST YEAR */}
      {todayLY && (
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-950/30 via-zinc-950 to-zinc-950 p-6">
          <div className="text-xs uppercase tracking-wider text-cyan-300/80">This day, one year ago</div>
          <div className="mt-2 flex flex-wrap items-end gap-6">
            <div>
              <div className="text-xs text-zinc-500">Then ({todayLY.lySnap.date})</div>
              <PrivateNumber className="text-2xl font-semibold text-zinc-300">{formatMoneyInt(todayLY.lySnap.netWorth)}</PrivateNumber>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Now</div>
              <PrivateNumber className="text-2xl font-semibold text-white">{formatMoneyInt(todayLY.latest.netWorth)}</PrivateNumber>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Change</div>
              <PrivateNumber className={cn("text-2xl font-semibold", todayLY.delta >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {todayLY.delta >= 0 ? "+" : ""}{formatMoneyInt(todayLY.delta)}{" "}
                <span className="text-base text-zinc-500">({todayLY.pct.toFixed(1)}%)</span>
              </PrivateNumber>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-3xl border border-white/5 bg-zinc-950/60">
        <div className="border-b border-white/5 p-5">
          <h3 className="font-medium text-white">Snapshots</h3>
        </div>
        <div className="max-h-[24rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-950">
              <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-2">Date</th>
                <th className="px-5 py-2 text-right">Assets</th>
                <th className="px-5 py-2 text-right">Liabilities</th>
                <th className="px-5 py-2 text-right">Net Worth</th>
                <th className="px-5 py-2 text-right">Δ</th>
              </tr>
            </thead>
            <tbody>
              {sortedTable.map((s, i) => {
                const prev = sortedTable[i + 1];
                const delta = prev ? s.netWorth - prev.netWorth : 0;
                return (
                  <tr key={s.date} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-2 text-zinc-300">{s.date}</td>
                    <td className="px-5 py-2 text-right text-zinc-400">
                      <PrivateNumber>{formatMoney(s.totalAssets, "USD", true)}</PrivateNumber>
                    </td>
                    <td className="px-5 py-2 text-right text-rose-300/80">
                      <PrivateNumber>{formatMoney(s.totalLiabilities, "USD", true)}</PrivateNumber>
                    </td>
                    <td className="px-5 py-2 text-right font-medium text-white">
                      <PrivateNumber>{formatMoney(s.netWorth, "USD", true)}</PrivateNumber>
                    </td>
                    <td
                      className={cn(
                        "px-5 py-2 text-right text-xs",
                        delta > 0 && "text-emerald-400",
                        delta < 0 && "text-rose-400",
                        delta === 0 && "text-zinc-500"
                      )}
                    >
                      {prev ? `${delta >= 0 ? "+" : ""}${formatMoney(delta, "USD", true)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddAnn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowAddAnn(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6"
            >
              <h3 className="text-lg font-semibold text-white">Add life event</h3>
              <p className="mt-1 text-xs text-zinc-400">Pin a moment on your timeline.</p>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <input
                    value={annEmoji}
                    onChange={(e) => setAnnEmoji(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-lg"
                  />
                  <input
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Bought house"
                    autoFocus
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  />
                </div>
                <input
                  type="date"
                  value={annDate}
                  onChange={(e) => setAnnDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
                <textarea
                  value={annDesc}
                  onChange={(e) => setAnnDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setShowAddAnn(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!annTitle.trim()) return;
                    addAnnotation({
                      date: annDate,
                      title: annTitle.trim(),
                      emoji: annEmoji,
                      description: annDesc.trim() || undefined,
                    });
                    setAnnTitle("");
                    setAnnDesc("");
                    setShowAddAnn(false);
                  }}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
                >
                  Pin event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
