"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Plus } from "lucide-react";
import { useNetWorthStore } from "@/lib/networth/store";
import { LIABILITY_CATEGORY_META, type Liability } from "@/lib/networth/types";
import { formatMoney, formatMonths, totalLiabilitiesOf } from "@/lib/networth/utils";
import { LiabilityModal } from "@/components/networth/liability-modal";
import { DebtStrategyComparison } from "@/components/networth/debt-strategies";
import { PrivacyProvider, PrivateNumber, PrivacyToggleButton } from "@/components/networth/privacy";
import { cn } from "@/lib/utils";

export default function LiabilitiesPage() {
  return (
    <PrivacyProvider>
      <LiabilitiesView />
    </PrivacyProvider>
  );
}

function LiabilitiesView() {
  const liabilities = useNetWorthStore((s) => s.liabilities);
  const removeLiability = useNetWorthStore((s) => s.removeLiability);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Liability | undefined>();
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const total = totalLiabilitiesOf(liabilities);
  const items = liabilities.filter((l) => !l.archived);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Liabilities</h1>
          <div className="mt-1 text-sm text-zinc-400">
            Total <PrivateNumber className="font-medium text-rose-300">{formatMoney(total)}</PrivateNumber> across{" "}
            {items.length} {items.length === 1 ? "item" : "items"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrivacyToggleButton />
          <button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
          >
            <Plus className="h-4 w-4" /> Add liability
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-12 text-center">
          <div className="mx-auto text-4xl">🎉</div>
          <h3 className="mt-4 text-lg font-semibold text-white">No liabilities</h3>
          <p className="mt-1 text-sm text-zinc-400">Debt free is a great place to be.</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            <Plus className="h-4 w-4" /> Track a liability
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <AnimatePresence>
              {items.map((l) => {
                const meta = LIABILITY_CATEGORY_META[l.category];
                const paidOffPct =
                  l.originalBalance && l.originalBalance > 0
                    ? ((l.originalBalance - l.balance) / l.originalBalance) * 100
                    : null;
                const monthlyInterest = l.interestRate ? (l.interestRate / 12) * l.balance : 0;
                const monthsLeft =
                  l.minimumPayment && l.minimumPayment > 0
                    ? estimateMonthsLeft(l.balance, l.interestRate ?? 0, l.minimumPayment)
                    : null;

                return (
                  <motion.div
                    key={l.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -40 }}
                    className="relative rounded-2xl border border-white/5 bg-zinc-950/60 p-5 transition hover:border-white/10"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-xl">
                          {meta.emoji}
                        </div>
                        <div>
                          <div className="font-medium text-white">{l.name}</div>
                          <div className="text-xs text-zinc-500">
                            {meta.label}
                            {l.lender ? ` · ${l.lender}` : ""}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setMenuFor(menuFor === l.id ? null : l.id)}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuFor === l.id && (
                        <div className="absolute right-3 top-12 z-10 w-40 rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl">
                          <button
                            onClick={() => {
                              setEditing(l);
                              setOpen(true);
                              setMenuFor(null);
                            }}
                            className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-white/5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${l.name}?`)) removeLiability(l.id);
                              setMenuFor(null);
                            }}
                            className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-rose-400 hover:bg-rose-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <Stat label="Balance" value={<PrivateNumber>{formatMoney(l.balance)}</PrivateNumber>} accent />
                      <Stat
                        label="APR"
                        value={l.interestRate ? `${(l.interestRate * 100).toFixed(2)}%` : "—"}
                      />
                      <Stat
                        label="Min / mo"
                        value={l.minimumPayment ? formatMoney(l.minimumPayment) : "—"}
                      />
                    </div>
                    {paidOffPct !== null && (
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-zinc-400">Paid off</span>
                          <span className="text-zinc-300">{paidOffPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                            style={{ width: `${Math.max(0, Math.min(100, paidOffPct))}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      {monthsLeft !== null && (
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-zinc-300">
                          {formatMonths(monthsLeft)} remaining
                        </span>
                      )}
                      {monthlyInterest > 0 && (
                        <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-rose-300">
                          ~{formatMoney(Math.round(monthlyInterest))}/mo interest
                        </span>
                      )}
                      {l.creditLimit && l.category === "creditCard" && (
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-300">
                          {((l.balance / l.creditLimit) * 100).toFixed(0)}% utilization
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <DebtStrategyComparison />
        </>
      )}

      <LiabilityModal
        open={open}
        editing={editing}
        onClose={() => {
          setOpen(false);
          setEditing(undefined);
        }}
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={cn("mt-0.5 font-semibold", accent ? "text-rose-300" : "text-zinc-200")}>{value}</div>
    </div>
  );
}

function estimateMonthsLeft(balance: number, apr: number, minPayment: number): number | null {
  if (balance <= 0) return 0;
  if (minPayment <= 0) return null;
  const r = apr / 12;
  if (r <= 0) return Math.ceil(balance / minPayment);
  const ratio = (r * balance) / minPayment;
  if (ratio >= 1) return null;
  return Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r));
}
