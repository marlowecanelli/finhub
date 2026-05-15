"use client";

import { useEffect } from "react";
import { useNetWorthStore } from "@/lib/networth/store";
import { checkAchievements, ACHIEVEMENT_DEFS } from "@/lib/networth/achievements";
import { totalAssetsOf, totalLiabilitiesOf } from "@/lib/networth/utils";

export function NetWorthBootstrap() {
  const recordSnapshot = useNetWorthStore((s) => s.recordSnapshot);
  const applyVehicleDepreciation = useNetWorthStore((s) => s.applyVehicleDepreciation);
  const setPortfolioLink = useNetWorthStore((s) => s.setPortfolioLink);
  const setCryptoPrice = useNetWorthStore((s) => s.setCryptoPrice);
  const unlock = useNetWorthStore((s) => s.unlockAchievement);

  useEffect(() => {
    // Daily snapshot + depreciation
    recordSnapshot();
    applyVehicleDepreciation();

    // Pull portfolio value
    fetch("/api/networth/portfolio-value")
      .then((r) => r.json())
      .then((data: { ok: boolean; value?: number }) => {
        if (data?.ok && typeof data.value === "number" && data.value > 0) {
          setPortfolioLink(data.value);
        }
      })
      .catch(() => {});

    // Pull crypto prices
    const assets = useNetWorthStore.getState().assets;
    const coinIds = Array.from(
      new Set(
        assets
          .filter(
            (a) =>
              a.category === "crypto" &&
              a.autoUpdate?.type === "crypto" &&
              a.autoUpdate.tickerOrCoinId
          )
          .map((a) => a.autoUpdate!.tickerOrCoinId!)
      )
    );
    if (coinIds.length > 0) {
      fetch(`/api/networth/crypto?ids=${coinIds.join(",")}`)
        .then((r) => r.json())
        .then((data: { ok: boolean; prices?: Record<string, number> }) => {
          if (data?.ok && data.prices) {
            for (const [id, price] of Object.entries(data.prices)) {
              setCryptoPrice(id, price);
            }
          }
        })
        .catch(() => {});
    }

    // Check achievements (toasts handled separately)
    const state = useNetWorthStore.getState();
    const totalAssets = totalAssetsOf(state.assets);
    const totalLiab = totalLiabilitiesOf(state.liabilities);
    const newOnes = checkAchievements(
      totalAssets - totalLiab,
      state.assets,
      state.liabilities,
      state.snapshots,
      state.achievements
    );
    for (const t of newOnes) {
      const isNew = unlock(t);
      if (isNew) {
        const def = ACHIEVEMENT_DEFS[t];
        if (def && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("networth-achievement", {
              detail: { type: t, ...def },
            })
          );
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
