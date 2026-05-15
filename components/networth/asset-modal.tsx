"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  ASSET_CATEGORY_META,
  type AssetCategory,
  type Asset,
  type AutoUpdateConfig,
} from "@/lib/networth/types";
import { useNetWorthStore } from "@/lib/networth/store";
import { parseSmartNumber, formatMoney, depreciatedValue } from "@/lib/networth/utils";
import { cn } from "@/lib/utils";

const COMMON_COINS = [
  { id: "bitcoin", label: "Bitcoin (BTC)" },
  { id: "ethereum", label: "Ethereum (ETH)" },
  { id: "solana", label: "Solana (SOL)" },
  { id: "cardano", label: "Cardano (ADA)" },
  { id: "ripple", label: "XRP" },
  { id: "dogecoin", label: "Dogecoin (DOGE)" },
  { id: "polkadot", label: "Polkadot (DOT)" },
  { id: "chainlink", label: "Chainlink (LINK)" },
  { id: "matic-network", label: "Polygon (MATIC)" },
  { id: "avalanche-2", label: "Avalanche (AVAX)" },
];

export function AssetModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Asset;
}) {
  const addAsset = useNetWorthStore((s) => s.addAsset);
  const updateAsset = useNetWorthStore((s) => s.updateAsset);
  const setCryptoPrice = useNetWorthStore((s) => s.setCryptoPrice);
  const cryptoCache = useNetWorthStore((s) => s.cryptoCache);

  const [category, setCategory] = useState<AssetCategory | null>(editing?.category ?? null);
  const [name, setName] = useState(editing?.name ?? "");
  const [valueInput, setValueInput] = useState(editing ? String(editing.value) : "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [isLiquid, setIsLiquid] = useState(editing?.isLiquid ?? false);
  // Category-specific fields
  const [accountType, setAccountType] = useState<string>(
    (editing?.meta?.accountType as string) ?? "401k"
  );
  const [coinId, setCoinId] = useState<string>(editing?.autoUpdate?.tickerOrCoinId ?? "bitcoin");
  const [quantity, setQuantity] = useState<string>(
    editing?.autoUpdate?.quantity ? String(editing.autoUpdate.quantity) : ""
  );
  const [purchaseDate, setPurchaseDate] = useState<string>(
    editing?.autoUpdate?.purchaseDate ?? new Date().toISOString().slice(0, 10)
  );
  const [purchasePrice, setPurchasePrice] = useState<string>(
    editing?.autoUpdate?.purchasePrice ? String(editing.autoUpdate.purchasePrice) : ""
  );
  const [depCurve, setDepCurve] = useState<NonNullable<AutoUpdateConfig["depreciationCurve"]>>(
    editing?.autoUpdate?.depreciationCurve ?? "standard"
  );
  const [year, setYear] = useState((editing?.meta?.year as string) ?? "");
  const [make, setMake] = useState((editing?.meta?.make as string) ?? "");
  const [model, setModel] = useState((editing?.meta?.model as string) ?? "");

  useEffect(() => {
    if (category && !editing) {
      const meta = ASSET_CATEGORY_META[category];
      setIsLiquid(meta.liquidByDefault);
    }
  }, [category, editing]);

  const parsedValue = useMemo(() => parseSmartNumber(valueInput) ?? 0, [valueInput]);

  // Crypto preview
  const cryptoPrice = coinId && cryptoCache?.[coinId]?.price;
  const cryptoQty = parseFloat(quantity) || 0;
  const cryptoValue = cryptoPrice && cryptoQty ? cryptoPrice * cryptoQty : 0;

  // Vehicle preview
  const purchPrice = parseSmartNumber(purchasePrice) ?? 0;
  const vehicleEst = purchPrice > 0 && purchaseDate
    ? Math.round(depreciatedValue(purchPrice, purchaseDate, depCurve))
    : 0;

  async function fetchCryptoIfNeeded() {
    if (category !== "crypto" || !coinId) return;
    try {
      const r = await fetch(`/api/networth/crypto?ids=${coinId}`);
      const data = (await r.json()) as { ok: boolean; prices?: Record<string, number> };
      if (data?.prices?.[coinId]) {
        setCryptoPrice(coinId, data.prices[coinId]);
      }
    } catch {}
  }
  useEffect(() => {
    if (open && category === "crypto") fetchCryptoIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category, coinId]);

  function reset() {
    setCategory(null);
    setName("");
    setValueInput("");
    setNotes("");
    setQuantity("");
    setPurchasePrice("");
    setYear("");
    setMake("");
    setModel("");
  }

  function submit() {
    if (!category || !name.trim()) return;
    let value = parsedValue;
    let autoUpdate: AutoUpdateConfig | undefined;
    const meta: Record<string, string | number> = {};

    if (category === "crypto") {
      autoUpdate = { type: "crypto", tickerOrCoinId: coinId, quantity: cryptoQty };
      value = cryptoValue || value;
    } else if (category === "vehicle" && purchPrice > 0) {
      autoUpdate = {
        type: "vehicleDepreciation",
        depreciationCurve: depCurve,
        purchaseDate,
        purchasePrice: purchPrice,
      };
      if (!value) value = vehicleEst;
      if (year) meta.year = year;
      if (make) meta.make = make;
      if (model) meta.model = model;
    } else if (category === "realEstate") {
      autoUpdate = { type: "realEstateReminder", reminderIntervalDays: 90 };
    } else if (category === "retirement") {
      meta.accountType = accountType;
    }

    const payload = {
      name: name.trim(),
      category,
      value,
      isLiquid,
      notes: notes.trim() || undefined,
      autoUpdate,
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    };

    if (editing) {
      updateAsset(editing.id, payload);
    } else {
      addAsset(payload);
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
                <h2 className="text-xl font-semibold text-white">Add an asset</h2>
                <p className="mt-1 text-sm text-zinc-400">Pick a category to get started.</p>
                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-3">
                  {(Object.keys(ASSET_CATEGORY_META) as AssetCategory[]).map((c) => {
                    const m = ASSET_CATEGORY_META[c];
                    return (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-emerald-400/40 hover:bg-emerald-500/[0.06]"
                      >
                        <span className="text-3xl transition group-hover:scale-110">
                          {m.emoji}
                        </span>
                        <span className="text-xs font-medium text-zinc-300">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCategory(null)}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                    disabled={!!editing}
                  >
                    ← Change category
                  </button>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {ASSET_CATEGORY_META[category].emoji} {editing ? "Edit" : "Add"}{" "}
                  {ASSET_CATEGORY_META[category].label}
                </h2>
                <div className="mt-5 grid grid-cols-1 gap-4">
                  <Field label="Name">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={examplePlaceholder(category)}
                      className="input"
                    />
                  </Field>

                  {category !== "crypto" && (
                    <Field
                      label="Current value (USD)"
                      hint={valueInput && parsedValue ? `= ${formatMoney(parsedValue)}` : "Try \"50k\" or \"1.5m\""}
                    >
                      <input
                        value={valueInput}
                        onChange={(e) => setValueInput(e.target.value)}
                        placeholder="e.g. 50000 or 50k"
                        className="input"
                      />
                    </Field>
                  )}

                  {category === "retirement" && (
                    <Field label="Account type">
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="input"
                      >
                        <option value="401k">401(k)</option>
                        <option value="Roth IRA">Roth IRA</option>
                        <option value="Traditional IRA">Traditional IRA</option>
                        <option value="HSA">HSA</option>
                        <option value="SEP IRA">SEP IRA</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>
                  )}

                  {category === "crypto" && (
                    <>
                      <Field label="Coin">
                        <select
                          value={coinId}
                          onChange={(e) => setCoinId(e.target.value)}
                          className="input"
                        >
                          {COMMON_COINS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Quantity">
                        <input
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0.5"
                          className="input"
                        />
                      </Field>
                      {cryptoPrice && (
                        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-sm text-zinc-300">
                          Live price: <span className="font-medium text-emerald-300">{formatMoney(cryptoPrice)}</span>
                          {cryptoQty > 0 && (
                            <>
                              {" · "}
                              Holding value: <span className="font-medium text-white">{formatMoney(cryptoValue)}</span>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {category === "vehicle" && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <Field label="Year">
                          <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2021" className="input" />
                        </Field>
                        <Field label="Make">
                          <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" className="input" />
                        </Field>
                        <Field label="Model">
                          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Camry" className="input" />
                        </Field>
                      </div>
                      <Field
                        label="Purchase price"
                        hint={purchasePrice && parseSmartNumber(purchasePrice) ? `= ${formatMoney(parseSmartNumber(purchasePrice)!)}` : undefined}
                      >
                        <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="25k" className="input" />
                      </Field>
                      <Field label="Purchase date">
                        <input
                          type="date"
                          value={purchaseDate}
                          onChange={(e) => setPurchaseDate(e.target.value)}
                          className="input"
                        />
                      </Field>
                      <Field label="Depreciation curve">
                        <select
                          value={depCurve}
                          onChange={(e) => setDepCurve(e.target.value as typeof depCurve)}
                          className="input"
                        >
                          <option value="standard">Standard</option>
                          <option value="luxury">Luxury</option>
                          <option value="truck">Truck</option>
                          <option value="classic">Classic</option>
                          <option value="flat">Flat (no depreciation)</option>
                        </select>
                      </Field>
                      {vehicleEst > 0 && (
                        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3 text-sm text-zinc-300">
                          Estimated current value: <span className="font-medium text-cyan-300">{formatMoney(vehicleEst)}</span>
                        </div>
                      )}
                    </>
                  )}

                  <Field label="Notes (optional)">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything to remember"
                      rows={2}
                      className="input"
                    />
                  </Field>

                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={isLiquid}
                      onChange={(e) => setIsLiquid(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 accent-emerald-500"
                    />
                    Count toward liquid net worth
                  </label>

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
                          ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                          : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                      )}
                    >
                      {editing ? "Save changes" : "Add asset"}
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
                border-color: rgba(16, 185, 129, 0.5);
                background: rgba(255, 255, 255, 0.05);
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </label>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function examplePlaceholder(c: AssetCategory): string {
  const examples: Record<AssetCategory, string> = {
    cash: "Chase Savings",
    investment: "Brokerage",
    retirement: "Fidelity 401(k)",
    realEstate: "Primary Home",
    vehicle: "2021 Toyota Camry",
    crypto: "BTC holdings",
    collectible: "Rolex Submariner",
    business: "Acme LLC equity",
    other: "Item",
  };
  return examples[c];
}
