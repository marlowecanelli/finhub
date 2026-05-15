"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Asset,
  Liability,
  Snapshot,
  Annotation,
  Goal,
  Achievement,
  NetWorthState,
  ActivityEvent,
  NetWorthSettings,
} from "./types";
import {
  EMPTY_STATE,
  buildSnapshot,
  isoToday,
  newId,
  depreciatedValue,
} from "./utils";

const STORAGE_KEY = "finhub:networth:v1";

type Actions = {
  addAsset: (a: Omit<Asset, "id" | "createdAt" | "updatedAt">) => Asset;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  addLiability: (l: Omit<Liability, "id" | "createdAt" | "updatedAt">) => Liability;
  updateLiability: (id: string, patch: Partial<Liability>) => void;
  removeLiability: (id: string) => void;
  recordSnapshot: () => void;
  addAnnotation: (a: Omit<Annotation, "id">) => Annotation;
  removeAnnotation: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => Goal;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  unlockAchievement: (type: string) => boolean;
  setSettings: (patch: Partial<NetWorthSettings>) => void;
  setPortfolioLink: (value: number) => void;
  setCryptoPrice: (id: string, price: number) => void;
  applyVehicleDepreciation: () => void;
  pushActivity: (message: string, delta?: number) => void;
  resetAll: () => void;
  importJSON: (data: NetWorthState) => void;
  exportJSON: () => NetWorthState;
};

export const useNetWorthStore = create<NetWorthState & Actions>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      pushActivity: (message, delta) =>
        set((s) => ({
          activity: [
            { id: newId("act"), ts: new Date().toISOString(), message, delta },
            ...s.activity,
          ].slice(0, 50),
        })),

      addAsset: (a) => {
        const now = new Date().toISOString();
        const asset: Asset = { ...a, id: newId("ast"), createdAt: now, updatedAt: now };
        set((s) => ({ assets: [...s.assets, asset] }));
        get().pushActivity(`Added ${asset.name}`, asset.value);
        get().recordSnapshot();
        return asset;
      },

      updateAsset: (id, patch) => {
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
          ),
        }));
        get().recordSnapshot();
      },

      removeAsset: (id) => {
        const target = get().assets.find((a) => a.id === id);
        set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
        if (target) get().pushActivity(`Removed ${target.name}`, -target.value);
        get().recordSnapshot();
      },

      addLiability: (l) => {
        const now = new Date().toISOString();
        const liab: Liability = { ...l, id: newId("lia"), createdAt: now, updatedAt: now };
        set((s) => ({ liabilities: [...s.liabilities, liab] }));
        get().pushActivity(`Added ${liab.name}`, -liab.balance);
        get().recordSnapshot();
        return liab;
      },

      updateLiability: (id, patch) => {
        set((s) => ({
          liabilities: s.liabilities.map((l) =>
            l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l
          ),
        }));
        get().recordSnapshot();
      },

      removeLiability: (id) => {
        const target = get().liabilities.find((l) => l.id === id);
        set((s) => ({ liabilities: s.liabilities.filter((l) => l.id !== id) }));
        if (target) get().pushActivity(`Removed ${target.name}`, target.balance);
        get().recordSnapshot();
      },

      recordSnapshot: () => {
        const { assets, liabilities, snapshots } = get();
        const snap = buildSnapshot(assets, liabilities);
        const idx = snapshots.findIndex((s) => s.date === snap.date);
        const next = [...snapshots];
        if (idx >= 0) next[idx] = snap;
        else next.push(snap);
        next.sort((a, b) => a.date.localeCompare(b.date));
        set({ snapshots: next });
      },

      addAnnotation: (a) => {
        const ann: Annotation = { ...a, id: newId("ann") };
        set((s) => ({ annotations: [...s.annotations, ann] }));
        get().pushActivity(`📌 ${ann.title}`);
        return ann;
      },

      removeAnnotation: (id) =>
        set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) })),

      addGoal: (g) => {
        const goal: Goal = { ...g, id: newId("gol"), createdAt: new Date().toISOString() };
        set((s) => ({ goals: [...s.goals, goal] }));
        return goal;
      },

      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      removeGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      unlockAchievement: (type) => {
        const exists = get().achievements.some((a) => a.type === type);
        if (exists) return false;
        const ach: Achievement = {
          id: newId("ach"),
          type,
          unlockedAt: new Date().toISOString(),
        };
        set((s) => ({ achievements: [...s.achievements, ach] }));
        return true;
      },

      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setPortfolioLink: (value) => {
        const prev = get().linkedPortfolioValue;
        set({
          linkedPortfolioValue: value,
          linkedPortfolioUpdatedAt: new Date().toISOString(),
        });
        // Mirror as a synthetic asset entry
        const existing = get().assets.find((a) => a.id === "asset_portfolio_link");
        const now = new Date().toISOString();
        if (existing) {
          set((s) => ({
            assets: s.assets.map((a) =>
              a.id === "asset_portfolio_link"
                ? { ...a, value, updatedAt: now }
                : a
            ),
          }));
        } else if (value > 0) {
          const synthetic: Asset = {
            id: "asset_portfolio_link",
            name: "FinHub Portfolio",
            category: "investment",
            value,
            isLiquid: true,
            notes: "Linked to FinHub Portfolio",
            autoUpdate: { type: "stockHolding" },
            createdAt: now,
            updatedAt: now,
          };
          set((s) => ({ assets: [...s.assets, synthetic] }));
        }
        if (prev !== value) {
          get().pushActivity(
            `Portfolio synced`,
            value - (prev ?? 0)
          );
          get().recordSnapshot();
        }
      },

      setCryptoPrice: (id, price) => {
        set((s) => ({
          cryptoCache: { ...(s.cryptoCache ?? {}), [id]: { price, ts: Date.now() } },
        }));
        // Update crypto assets that reference this id
        const { assets } = get();
        let changed = false;
        const next = assets.map((a) => {
          if (
            a.category === "crypto" &&
            a.autoUpdate?.type === "crypto" &&
            a.autoUpdate.tickerOrCoinId === id &&
            a.autoUpdate.quantity
          ) {
            changed = true;
            return { ...a, value: price * a.autoUpdate.quantity, updatedAt: new Date().toISOString() };
          }
          return a;
        });
        if (changed) {
          set({ assets: next });
          get().recordSnapshot();
        }
      },

      applyVehicleDepreciation: () => {
        const { assets } = get();
        let changed = false;
        const next = assets.map((a) => {
          if (
            a.category === "vehicle" &&
            a.autoUpdate?.type === "vehicleDepreciation" &&
            a.autoUpdate.purchasePrice &&
            a.autoUpdate.purchaseDate
          ) {
            const v = depreciatedValue(
              a.autoUpdate.purchasePrice,
              a.autoUpdate.purchaseDate,
              a.autoUpdate.depreciationCurve ?? "standard"
            );
            if (Math.abs(v - a.value) > 1) {
              changed = true;
              return { ...a, value: Math.round(v), updatedAt: new Date().toISOString() };
            }
          }
          return a;
        });
        if (changed) {
          set({ assets: next });
          get().recordSnapshot();
        }
      },

      resetAll: () => set({ ...EMPTY_STATE }),

      importJSON: (data) => set({ ...EMPTY_STATE, ...data }),
      exportJSON: () => {
        const s = get();
        return {
          version: s.version,
          assets: s.assets,
          liabilities: s.liabilities,
          snapshots: s.snapshots,
          annotations: s.annotations,
          goals: s.goals,
          achievements: s.achievements,
          activity: s.activity,
          settings: s.settings,
          linkedPortfolioValue: s.linkedPortfolioValue,
          linkedPortfolioUpdatedAt: s.linkedPortfolioUpdatedAt,
          cryptoCache: s.cryptoCache,
        };
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

// Helper: subscribe to hydration on client
export function useHydrated(): boolean {
  if (typeof window === "undefined") return false;
  return useNetWorthStore.persist.hasHydrated();
}
