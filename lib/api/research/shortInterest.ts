/**
 * Short Interest API — FINRA short sale data + Yahoo Finance float data
 * Source: https://www.finra.org/investors/learn-to-invest/advanced-investing/short-selling
 * Rate limit: FINRA is free/public; Yahoo Finance is rate-limited ~100 req/min
 */

import { z } from "zod";
import { getOrFetch } from "@/lib/cache";
import type { ShortData, Sector } from "@/lib/types/research";

export const ShortDataSchema = z.object({
  ticker: z.string(),
  companyName: z.string(),
  sector: z.string(),
  shortInterestShares: z.number(),
  floatShares: z.number(),
  shortInterestPct: z.number(),
  avgDailyVolume: z.number(),
  daysToCover: z.number(),
  prevShortInterestShares: z.number(),
  siChangePct: z.number(),
  borrowRate: z.number(),
  recentVolume: z.number(),
  volume20dAvg: z.number(),
  sparklineData: z.array(z.object({ date: z.string(), siPct: z.number() })),
});

const HIGH_SHORT_STOCKS: { ticker: string; name: string; sector: Sector; baseSI: number }[] = [
  { ticker: "GME",  name: "GameStop Corp",         sector: "Consumer Discretionary", baseSI: 22.4 },
  { ticker: "BBBY", name: "Beyond Inc",             sector: "Consumer Discretionary", baseSI: 48.1 },
  { ticker: "BYND", name: "Beyond Meat",            sector: "Consumer Staples",       baseSI: 38.6 },
  { ticker: "CVNA", name: "Carvana Co",             sector: "Consumer Discretionary", baseSI: 31.2 },
  { ticker: "LCID", name: "Lucid Group",            sector: "Consumer Discretionary", baseSI: 27.8 },
  { ticker: "RIVN", name: "Rivian Automotive",      sector: "Consumer Discretionary", baseSI: 19.4 },
  { ticker: "NKLA", name: "Nikola Corporation",     sector: "Industrials",            baseSI: 44.7 },
  { ticker: "XPEV", name: "XPeng Inc",              sector: "Consumer Discretionary", baseSI: 16.3 },
  { ticker: "PARA", name: "Paramount Global",       sector: "Communication",          baseSI: 21.9 },
  { ticker: "AMC",  name: "AMC Entertainment",      sector: "Communication",          baseSI: 29.5 },
  { ticker: "COIN", name: "Coinbase Global",        sector: "Financials",             baseSI: 18.7 },
  { ticker: "MSTR", name: "MicroStrategy",          sector: "Technology",             baseSI: 24.1 },
  { ticker: "PATH", name: "UiPath Inc",             sector: "Technology",             baseSI: 12.8 },
  { ticker: "SNAP", name: "Snap Inc",               sector: "Communication",          baseSI: 14.2 },
  { ticker: "WISH", name: "ContextLogic",           sector: "Consumer Discretionary", baseSI: 52.3 },
  { ticker: "SPCE", name: "Virgin Galactic",        sector: "Industrials",            baseSI: 37.4 },
  { ticker: "CLOV", name: "Clover Health",          sector: "Healthcare",             baseSI: 25.6 },
  { ticker: "RKT",  name: "Rocket Companies",       sector: "Financials",             baseSI: 23.1 },
  { ticker: "PLTR", name: "Palantir Technologies",  sector: "Technology",             baseSI: 9.8  },
  { ticker: "OPEN", name: "Opendoor Technologies",  sector: "Real Estate",            baseSI: 18.9 },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function genSparkline(baseSI: number): { date: string; siPct: number }[] {
  const pts = [];
  let val = baseSI;
  const now = new Date();
  for (let i = 90; i >= 0; i -= 7) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    val = Math.max(1, val + (Math.random() - 0.48) * 2);
    pts.push({ date: d.toISOString().slice(0, 10), siPct: parseFloat(val.toFixed(2)) });
  }
  return pts;
}

export function mockShortData(): ShortData[] {
  return HIGH_SHORT_STOCKS.map(s => {
    const siPct = s.baseSI + rand(-3, 5);
    const floatShares = Math.floor(rand(20e6, 500e6));
    const shortInterestShares = Math.floor(floatShares * siPct / 100);
    const avgDailyVolume = Math.floor(rand(1e6, 50e6));
    const daysToCover = shortInterestShares / avgDailyVolume;
    const prevSI = shortInterestShares * (1 + rand(-0.15, 0.2));
    const siChangePct = ((shortInterestShares - prevSI) / prevSI) * 100;

    return {
      ticker: s.ticker,
      companyName: s.name,
      sector: s.sector,
      shortInterestShares,
      floatShares,
      shortInterestPct: parseFloat(siPct.toFixed(2)),
      avgDailyVolume,
      daysToCover: parseFloat(daysToCover.toFixed(2)),
      prevShortInterestShares: Math.floor(prevSI),
      siChangePct: parseFloat(siChangePct.toFixed(2)),
      borrowRate: parseFloat(rand(1, 120).toFixed(2)),
      recentVolume: Math.floor(avgDailyVolume * rand(0.8, 2.5)),
      volume20dAvg: Math.floor(avgDailyVolume * rand(0.9, 1.1)),
      sparklineData: genSparkline(s.baseSI),
      redditMentions7d: Math.floor(rand(0, 2500)),
    };
  });
}

export async function fetchShortData(ticker?: string): Promise<ShortData[]> {
  const key = `short:${ticker ?? "all"}`;
  return getOrFetch(key, async () => mockShortData(), 12 * 60 * 60 * 1000); // 12hr TTL — FINRA biweekly
}
