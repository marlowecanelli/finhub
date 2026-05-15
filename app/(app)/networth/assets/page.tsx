"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Plus, Link as LinkIcon } from "lucide-react";
import { useNetWorthStore } from "@/lib/networth/store";
import { ASSET_CATEGORY_META, type Asset, type AssetCategory } from "@/lib/networth/types";
import { formatMoney, totalAssetsOf } from "@/lib/networth/utils";
import { AssetModal } from "@/components/networth/asset-modal";
import { PrivacyProvider, PrivateNumber, PrivacyToggleButton } from "@/components/networth/privacy";
import { cn } from "@/lib/utils";

export default function AssetsPage() {
  return (
    <PrivacyProvider>
      <AssetsView />
    </PrivacyProvider>
  );
}

function AssetsView() {
  const assets = useNetWorthStore((s) => s.assets);
  const removeAsset = useNetWorthStore((s) => s.removeAsset);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | undefined>();
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const total = totalAssetsOf(assets);
  const grouped = useMemo(() => {
    const map = new Map<AssetCategory, Asset[]>();
    for (const a of assets.filter((x) => !x.archived)) {
      const arr = map.get(a.category) ?? [];
      arr.push(a);
      map.set(a.category, arr);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const sa = a[1].reduce((s, x) => s + x.value, 0);
      const sb = b[1].reduce((s, x) => s + x.value, 0);
      return sb - sa;
    });
  }, [assets]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Assets</h1>
          <div className="mt-1 text-sm text-zinc-400">
            Total <PrivateNumber className="font-medium text-zinc-200">{formatMoney(total)}</PrivateNumber> across{" "}
            {assets.filter((a) => !a.archived).length} {assets.length === 1 ? "item" : "items"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrivacyToggleButton />
          <button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" /> Add asset
          </button>
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-12 text-center">
          <div className="mx-auto text-4xl">📦</div>
          <h3 className="mt-4 text-lg font-semibold text-white">No assets yet</h3>
          <p className="mt-1 text-sm text-zinc-400">Add your first asset to start tracking.</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" /> Add your first asset
          </button>
        </div>
      )}

      {grouped.map(([cat, items]) => {
        const meta = ASSET_CATEGORY_META[cat];
        const sum = items.reduce((s, x) => s + x.value, 0);
        return (
          <div key={cat} className="rounded-3xl border border-white/5 bg-zinc-950/60 p-1">
            <div className="flex items-center justify-between px-4 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{meta.emoji}</span>
                <h3 className="font-medium text-white">{meta.label}</h3>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                  {items.length}
                </span>
              </div>
              <PrivateNumber className="text-sm font-medium text-zinc-300">
                {formatMoney(sum)}
              </PrivateNumber>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1 p-2 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {items.map((a) => {
                  const pct = total > 0 ? (a.value / total) * 100 : 0;
                  const isLinked = a.id === "asset_portfolio_link";
                  return (
                    <motion.div
                      key={a.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, x: -40 }}
                      className="group relative rounded-2xl border border-white/5 bg-zinc-900/40 p-4 transition hover:-translate-y-0.5 hover:border-white/10 hover:bg-zinc-900/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate font-medium text-white">{a.name}</h4>
                            {isLinked && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-300">
                                <LinkIcon className="h-2.5 w-2.5" /> Portfolio
                              </span>
                            )}
                            {a.autoUpdate?.type === "crypto" && (
                              <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">
                                Live
                              </span>
                            )}
                          </div>
                          {a.notes && (
                            <div className="mt-0.5 truncate text-xs text-zinc-500">{a.notes}</div>
                          )}
                        </div>
                        <button
                          onClick={() => setMenuFor(menuFor === a.id ? null : a.id)}
                          className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuFor === a.id && (
                          <div className="absolute right-2 top-12 z-10 w-40 rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl">
                            {!isLinked && (
                              <button
                                onClick={() => {
                                  setEditing(a);
                                  setOpen(true);
                                  setMenuFor(null);
                                }}
                                className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-white/5"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${a.name}?`)) {
                                  removeAsset(a.id);
                                }
                                setMenuFor(null);
                              }}
                              className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-rose-400 hover:bg-rose-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <PrivateNumber className="text-lg font-semibold text-white">
                          {formatMoney(a.value)}
                        </PrivateNumber>
                        <div className="text-right text-xs text-zinc-500">
                          {pct.toFixed(1)}% of assets
                        </div>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className={cn(
                            "h-full rounded-full bg-gradient-to-r",
                            "from-emerald-500 to-cyan-400"
                          )}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      <AssetModal
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
