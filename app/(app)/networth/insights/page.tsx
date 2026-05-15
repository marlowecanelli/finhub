"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNetWorthStore } from "@/lib/networth/store";
import { generateInsights } from "@/lib/networth/insights";
import { PrivacyProvider } from "@/components/networth/privacy";
import { cn } from "@/lib/utils";
import { buildSnapshot } from "@/lib/networth/utils";

export default function InsightsPage() {
  return (
    <PrivacyProvider>
      <InsightsView />
    </PrivacyProvider>
  );
}

function InsightsView() {
  const assets = useNetWorthStore((s) => s.assets);
  const liabilities = useNetWorthStore((s) => s.liabilities);
  const snapshots = useNetWorthStore((s) => s.snapshots);
  const settings = useNetWorthStore((s) => s.settings);

  const allSnaps = useMemo(() => {
    const map = new Map(snapshots.map((s) => [s.date, s]));
    const t = buildSnapshot(assets, liabilities);
    map.set(t.date, t);
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [snapshots, assets, liabilities]);

  const insights = useMemo(
    () => generateInsights(assets, liabilities, allSnaps, settings.monthlyExpenses),
    [assets, liabilities, allSnaps, settings.monthlyExpenses]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Insights</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Auto-generated observations refreshed daily. Plain English, no fluff.
        </p>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-12 text-center">
          <div className="text-4xl">🪄</div>
          <h3 className="mt-4 text-lg font-semibold text-white">Not enough data yet</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Add some assets and check back. Insights need a few days of history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {insights.map((i, idx) => (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "flex gap-3 rounded-2xl border p-5",
                i.tone === "positive" && "border-emerald-400/20 bg-emerald-500/[0.04]",
                i.tone === "warning" && "border-rose-400/20 bg-rose-500/[0.04]",
                i.tone === "neutral" && "border-white/5 bg-zinc-950/60"
              )}
            >
              <div className="text-2xl">{i.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-white">{i.headline}</div>
                <div className="mt-1 text-sm text-zinc-400">{i.body}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
