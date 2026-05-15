"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  LIABILITY_CATEGORY_META,
  type LiabilityCategory,
  type Liability,
} from "@/lib/networth/types";
import { useNetWorthStore } from "@/lib/networth/store";
import { parseSmartNumber, formatMoney } from "@/lib/networth/utils";
import { cn } from "@/lib/utils";

export function LiabilityModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Liability;
}) {
  const addLiability = useNetWorthStore((s) => s.addLiability);
  const updateLiability = useNetWorthStore((s) => s.updateLiability);
  const [category, setCategory] = useState<LiabilityCategory | null>(editing?.category ?? null);
  const [name, setName] = useState(editing?.name ?? "");
  const [balanceInput, setBalanceInput] = useState(editing ? String(editing.balance) : "");
  const [originalInput, setOriginalInput] = useState(
    editing?.originalBalance ? String(editing.originalBalance) : ""
  );
  const [rateInput, setRateInput] = useState(
    editing?.interestRate ? String(editing.interestRate * 100) : ""
  );
  const [minInput, setMinInput] = useState(
    editing?.minimumPayment ? String(editing.minimumPayment) : ""
  );
  const [lender, setLender] = useState(editing?.lender ?? "");
  const [creditLimitInput, setCreditLimitInput] = useState(
    editing?.creditLimit ? String(editing.creditLimit) : ""
  );

  const balance = useMemo(() => parseSmartNumber(balanceInput) ?? 0, [balanceInput]);
  const original = useMemo(() => parseSmartNumber(originalInput) ?? undefined, [originalInput]);
  const rate = useMemo(() => {
    const n = parseFloat(rateInput);
    if (isNaN(n)) return undefined;
    return n / 100;
  }, [rateInput]);
  const minimum = useMemo(() => parseSmartNumber(minInput) ?? undefined, [minInput]);
  const creditLimit = useMemo(() => parseSmartNumber(creditLimitInput) ?? undefined, [creditLimitInput]);

  function reset() {
    setCategory(null);
    setName("");
    setBalanceInput("");
    setOriginalInput("");
    setRateInput("");
    setMinInput("");
    setLender("");
    setCreditLimitInput("");
  }

  function submit() {
    if (!category || !name.trim()) return;
    const payload = {
      name: name.trim(),
      category,
      balance,
      originalBalance: original,
      interestRate: rate,
      minimumPayment: minimum,
      lender: lender.trim() || undefined,
      creditLimit: category === "creditCard" ? creditLimit : undefined,
    };
    if (editing) {
      updateLiability(editing.id, payload);
    } else {
      addLiability(payload);
    }
    reset();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-950 p-6 md:rounded-3xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {!category ? (
              <>
                <h2 className="text-xl font-semibold text-white">Add a liability</h2>
                <p className="mt-1 text-sm text-zinc-400">Pick a category.</p>
                <div className="mt-5 grid grid-cols-3 gap-2 md:grid-cols-4">
                  {(Object.keys(LIABILITY_CATEGORY_META) as LiabilityCategory[]).map((c) => {
                    const m = LIABILITY_CATEGORY_META[c];
                    return (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-rose-400/40 hover:bg-rose-500/[0.06]"
                      >
                        <span className="text-3xl transition group-hover:scale-110">{m.emoji}</span>
                        <span className="text-xs font-medium text-zinc-300">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCategory(null)}
                  disabled={!!editing}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  ← Change category
                </button>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {LIABILITY_CATEGORY_META[category].emoji} {editing ? "Edit" : "Add"}{" "}
                  {LIABILITY_CATEGORY_META[category].label}
                </h2>
                <div className="mt-5 grid grid-cols-1 gap-4">
                  <Field label="Name">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Chase Sapphire"
                      className="input"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Current balance"
                      hint={balanceInput && balance ? `= ${formatMoney(balance)}` : "Try \"15k\""}
                    >
                      <input
                        value={balanceInput}
                        onChange={(e) => setBalanceInput(e.target.value)}
                        placeholder="15k"
                        className="input"
                      />
                    </Field>
                    <Field
                      label="Original balance (optional)"
                      hint={originalInput && original ? `= ${formatMoney(original)}` : undefined}
                    >
                      <input
                        value={originalInput}
                        onChange={(e) => setOriginalInput(e.target.value)}
                        placeholder="20k"
                        className="input"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Interest rate (APR %)">
                      <input
                        value={rateInput}
                        onChange={(e) => setRateInput(e.target.value)}
                        placeholder="6.99"
                        className="input"
                      />
                    </Field>
                    <Field
                      label="Minimum payment / mo"
                      hint={minInput && minimum ? `= ${formatMoney(minimum)}` : undefined}
                    >
                      <input
                        value={minInput}
                        onChange={(e) => setMinInput(e.target.value)}
                        placeholder="250"
                        className="input"
                      />
                    </Field>
                  </div>
                  <Field label="Lender (optional)">
                    <input
                      value={lender}
                      onChange={(e) => setLender(e.target.value)}
                      placeholder="Sallie Mae"
                      className="input"
                    />
                  </Field>
                  {category === "creditCard" && (
                    <Field label="Credit limit (optional)">
                      <input
                        value={creditLimitInput}
                        onChange={(e) => setCreditLimitInput(e.target.value)}
                        placeholder="10k"
                        className="input"
                      />
                    </Field>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={onClose}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submit}
                      disabled={!name.trim()}
                      className={cn(
                        "rounded-xl px-4 py-2 text-sm font-medium transition",
                        name.trim()
                          ? "bg-rose-500 text-white hover:bg-rose-400"
                          : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                      )}
                    >
                      {editing ? "Save changes" : "Add liability"}
                    </button>
                  </div>
                </div>
              </>
            )}
            <style jsx>{`
              .input {
                width: 100%;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #f4f4f5;
                padding: 0.55rem 0.75rem;
                border-radius: 0.75rem;
                font-size: 0.875rem;
                outline: none;
              }
              .input:focus {
                border-color: rgba(244, 63, 94, 0.5);
                background: rgba(255, 255, 255, 0.05);
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</label>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
