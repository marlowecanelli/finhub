import type { ScreenerStock, ScreenerPreset } from "@/lib/types/research";

export const PRESET_FILTERS: Record<ScreenerPreset, (s: ScreenerStock) => boolean> = {
  "deep-value":           s => s.pe > 0 && s.pe < 12 && s.pb > 0 && s.pb < 1.5 && s.fcfYield > 8,
  "quality-compounder":   s => s.roe > 20 && s.revenueGrowth1y > 10 && s.netMargin > 15,
  "momentum-value":       s => s.momentum12m > 20 && s.pe > 0 && s.pe < 25,
  "dividend-aristocrats": s => s.dividendStreakYears >= 25 && s.dividendYield > 2,
  "squeeze-candidates":   s => s.shortInterestPct > 15 && s.pe > 0 && s.pe < 30 && s.roe > 10,
};
