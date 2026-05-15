"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Flame, Shield } from "lucide-react";
import { useNetWorthStore } from "@/lib/networth/store";
import {
  formatMoney,
  formatMoneyInt,
  totalAssetsOf,
  totalLiabilitiesOf,
  liquidNetWorthOf,
  trailingVelocity,
  parseSmartNumber,
  buildSnapshot,
} from "@/lib/networth/utils";
import { PrivacyProvider, PrivateNumber } from "@/components/networth/privacy";
import type { Goal, GoalType } from "@/lib/networth/types";
import { cn } from "@/lib/utils";

const SUGGESTED: { type: GoalType; label: string; target: number }[] = [
  { type: "netWorth", label: "$10k net worth", target: 10_000 },
  { type: "netWorth", label: "Six Figure Club ($100k)", target: 100_000 },
  { type: "debtFree", label: "Debt free", target: 0 },
  { type: "netWorth", label: "$1M net worth", target: 1_000_000 },
];

export default function GoalsPage() {
  return (
    <PrivacyProvider>
      <GoalsView />
    </PrivacyProvider>
  );
}

function GoalsView() {
  const goals = useNetWorthStore((s) => s.goals);
  const addGoal = useNetWorthStore((s) => s.addGoal);
  const removeGoal = useNetWorthStore((s) => s.removeGoal);
  const assets = useNetWorthStore((s) => s.assets);
  const liabilities = useNetWorthStore((s) => s.liabilities);
  const snapshots = useNetWorthStore((s) => s.snapshots);
  const settings = useNetWorthStore((s) => s.settings);
  const setSettings = useNetWorthStore((s) => s.setSettings);

  const todaySnap = buildSnapshot(assets, liabilities);
  const allSnaps = useMemo(() => {
    const map = new Map(snapshots.map((s) => [s.date, s]));
    map.set(todaySnap.date, todaySnap);
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [snapshots, todaySnap]);
  const netWorth = totalAssetsOf(assets) - totalLiabilitiesOf(liabilities);
  const liquid = liquidNetWorthOf(assets, liabilities);
  const v90 = trailingVelocity(allSnaps, 90);
  const totalLiab = totalLiabilitiesOf(liabilities);

  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newType, setNewType] = useState<GoalType>("netWorth");

  const [monthlyExp, setMonthlyExp] = useState(
    settings.monthlyExpenses ? String(settings.monthlyExpenses) : ""
  );
  const [annualSpend, setAnnualSpend] = useState(
    settings.annualSpending ? String(settings.annualSpending) : ""
  );

  const progressFor = (g: Goal): number => {
    if (g.type === "debtFree") {
      // 100% when liabilities are zero, 0% when many
      const total = totalLiab;
      const startBase = Math.max(total, 1);
      return Math.max(0, Math.min(100, ((startBase - total) / startBase) * 100));
    }
    const current = g.type === "liquidNetWorth" ? liquid : netWorth;
    if (g.target <= 0) return 0;
    return Math.max(0, Math.min(100, (current / g.target) * 100));
  };
  const monthsTo = (g: Goal): number | null => {
    if (g.type === "debtFree") return null;
    const current = g.type === "liquidNetWorth" ? liquid : netWorth;
    if (v90 <= 0) return null;
    const remaining = g.target - current;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / v90);
  };

  const monthly = parseFloat(monthlyExp) || 0;
  const annual = parseFloat(annualSpend) || 0;
  const fireNumber = annual > 0 ? annual * 25 : 0;
  const coastFireAt30 = annual > 0 ? annual * 25 / Math.pow(1.07, 30) : 0;

  const efMonths = monthly > 0 ? liquid / monthly : 0;
  const efTone = efMonths >= 6 ? "emerald" : efMonths >= 3 ? "amber" : "rose";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Goals & Milestones</h1>
          <p className="mt-1 text-sm text-zinc-400">Set targets. Watch the rings fill.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" /> Add goal
        </button>
      </div>

      {/* GOALS GRID */}
      {goals.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-8">
          <h3 className="font-medium text-white">Suggested goals</h3>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SUGGESTED.map((s) => (
              <button
                key={s.label}
                onClick={() =>
                  addGoal({
                    type: s.type,
                    label: s.label,
                    target: s.target,
                  })
                }
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-left transition hover:border-emerald-400/40 hover:bg-emerald-500/[0.05]"
              >
                <span className="font-medium text-white">{s.label}</span>
                <Plus className="h-4 w-4 text-zinc-400" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const pct = progressFor(g);
            const months = monthsTo(g);
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/60 p-6"
              >
                <button
                  onClick={() => {
                    if (confirm(`Remove "${g.label}"?`)) removeGoal(g.id);
                  }}
                  className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex flex-col items-center">
                  <ProgressRing pct={pct} />
                  <div className="mt-3 text-center">
                    <div className="font-medium text-white">{g.label}</div>
                    <div className="mt-1 text-xs text-zinc-400">
                      Target: <PrivateNumber className="text-zinc-200">{g.type === "debtFree" ? "$0 debt" : formatMoney(g.target)}</PrivateNumber>
                    </div>
                    {months !== null && (
                      <div className="mt-2 text-xs text-emerald-300">
                        {months === 0 ? "Achieved!" : `~${months} months at current pace`}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* FIRE CALCULATOR */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-orange-950/30 via-zinc-950 to-zinc-950 p-6">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          <h3 className="font-medium text-white">FIRE Calculator</h3>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Financial Independence Retire Early. Rule of thumb: 25x annual spending.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wider text-zinc-400">
              Annual spending
            </label>
            <input
              value={annualSpend}
              onChange={(e) => {
                setAnnualSpend(e.target.value);
                const n = parseSmartNumber(e.target.value);
                if (n !== null) setSettings({ annualSpending: n });
              }}
              placeholder="60k"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          {fireNumber > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-xs text-zinc-500">FIRE number</div>
                <PrivateNumber className="text-lg font-semibold text-orange-300">
                  {formatMoneyInt(fireNumber)}
                </PrivateNumber>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-xs text-zinc-500">Coast FIRE (30y)</div>
                <PrivateNumber className="text-lg font-semibold text-amber-300">
                  {formatMoneyInt(coastFireAt30)}
                </PrivateNumber>
              </div>
            </div>
          )}
        </div>
        {fireNumber > 0 && v90 > 0 && netWorth < fireNumber && (
          <div className="mt-3 text-sm text-zinc-300">
            At your current velocity you reach FIRE in{" "}
            <span className="font-medium text-orange-300">
              {Math.ceil((fireNumber - netWorth) / v90 / 12)} years
            </span>
            .
          </div>
        )}
      </div>

      {/* EMERGENCY FUND */}
      <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <h3 className="font-medium text-white">Emergency Fund Tracker</h3>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wider text-zinc-400">Monthly expenses</label>
            <input
              value={monthlyExp}
              onChange={(e) => {
                setMonthlyExp(e.target.value);
                const n = parseSmartNumber(e.target.value);
                if (n !== null) setSettings({ monthlyExpenses: n });
              }}
              placeholder="4000"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          {monthly > 0 && (
            <div className="rounded-xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Your liquid covers</div>
              <PrivateNumber className={cn(
                "text-2xl font-semibold",
                efTone === "emerald" && "text-emerald-300",
                efTone === "amber" && "text-amber-300",
                efTone === "rose" && "text-rose-300"
              )}>
                {efMonths.toFixed(1)} months
              </PrivateNumber>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r",
                    efTone === "emerald" && "from-emerald-500 to-cyan-400",
                    efTone === "amber" && "from-amber-500 to-orange-400",
                    efTone === "rose" && "from-rose-500 to-orange-500"
                  )}
                  style={{ width: `${Math.min((efMonths / 6) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                <span>0 mo</span>
                <span>3 mo</span>
                <span>6+ mo</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white">Add custom goal</h3>
            <div className="mt-4 space-y-3">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Goal name"
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as GoalType)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <option value="netWorth">Net worth</option>
                <option value="liquidNetWorth">Liquid net worth</option>
                <option value="debtFree">Debt free</option>
                <option value="fire">FIRE</option>
                <option value="emergencyFund">Emergency fund</option>
                <option value="custom">Custom</option>
              </select>
              {newType !== "debtFree" && (
                <input
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="Target ($)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAdd(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newLabel.trim()) return;
                    const target = newType === "debtFree" ? 0 : parseSmartNumber(newTarget) ?? 0;
                    addGoal({ type: newType, label: newLabel.trim(), target });
                    setNewLabel("");
                    setNewTarget("");
                    setShowAdd(false);
                  }}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
                >
                  Add goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const R = 56;
  const C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;
  return (
    <div className="relative h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <motion.circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-white">
        {Math.round(pct)}%
      </div>
    </div>
  );
}
