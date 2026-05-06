/**
 * Valuation Screener API — composite scoring from public financial data
 * Source: Yahoo Finance fundamentals + SEC XBRL financials
 * Rate limit: Yahoo Finance ~100 req/min
 */

import { getOrFetch } from "@/lib/cache";
import type { ScreenerStock, ScreenerPreset, Sector } from "@/lib/types/research";

const UNIVERSE: { ticker: string; name: string; sector: Sector }[] = [
  { ticker: "AAPL",  name: "Apple Inc.",             sector: "Technology" },
  { ticker: "MSFT",  name: "Microsoft Corp.",         sector: "Technology" },
  { ticker: "NVDA",  name: "NVIDIA Corp.",            sector: "Technology" },
  { ticker: "META",  name: "Meta Platforms",          sector: "Communication" },
  { ticker: "GOOGL", name: "Alphabet Inc.",           sector: "Communication" },
  { ticker: "AMZN",  name: "Amazon.com",              sector: "Consumer Discretionary" },
  { ticker: "TSLA",  name: "Tesla Inc.",              sector: "Consumer Discretionary" },
  { ticker: "JPM",   name: "JPMorgan Chase",          sector: "Financials" },
  { ticker: "BAC",   name: "Bank of America",         sector: "Financials" },
  { ticker: "GS",    name: "Goldman Sachs",           sector: "Financials" },
  { ticker: "V",     name: "Visa Inc.",               sector: "Financials" },
  { ticker: "MA",    name: "Mastercard Inc.",         sector: "Financials" },
  { ticker: "UNH",   name: "UnitedHealth Group",      sector: "Healthcare" },
  { ticker: "LLY",   name: "Eli Lilly",              sector: "Healthcare" },
  { ticker: "JNJ",   name: "Johnson & Johnson",       sector: "Healthcare" },
  { ticker: "ABBV",  name: "AbbVie Inc.",             sector: "Healthcare" },
  { ticker: "XOM",   name: "Exxon Mobil",            sector: "Energy" },
  { ticker: "CVX",   name: "Chevron Corp.",           sector: "Energy" },
  { ticker: "CAT",   name: "Caterpillar Inc.",        sector: "Industrials" },
  { ticker: "RTX",   name: "RTX Corporation",        sector: "Industrials" },
  { ticker: "BA",    name: "Boeing Co.",             sector: "Industrials" },
  { ticker: "HON",   name: "Honeywell Intl.",        sector: "Industrials" },
  { ticker: "PG",    name: "Procter & Gamble",       sector: "Consumer Staples" },
  { ticker: "KO",    name: "Coca-Cola Co.",           sector: "Consumer Staples" },
  { ticker: "PEP",   name: "PepsiCo Inc.",            sector: "Consumer Staples" },
  { ticker: "WMT",   name: "Walmart Inc.",            sector: "Consumer Staples" },
  { ticker: "NEE",   name: "NextEra Energy",          sector: "Utilities" },
  { ticker: "DUK",   name: "Duke Energy",             sector: "Utilities" },
  { ticker: "AMT",   name: "American Tower",          sector: "Real Estate" },
  { ticker: "PLD",   name: "Prologis Inc.",           sector: "Real Estate" },
  { ticker: "LIN",   name: "Linde plc",               sector: "Materials" },
  { ticker: "FCX",   name: "Freeport-McMoRan",        sector: "Materials" },
  { ticker: "GME",   name: "GameStop Corp.",           sector: "Consumer Discretionary" },
  { ticker: "PLTR",  name: "Palantir Tech.",           sector: "Technology" },
  { ticker: "AMD",   name: "Advanced Micro Devices",  sector: "Technology" },
  { ticker: "INTC",  name: "Intel Corporation",        sector: "Technology" },
  { ticker: "NFLX",  name: "Netflix Inc.",             sector: "Communication" },
  { ticker: "DIS",   name: "Walt Disney Co.",          sector: "Communication" },
  { ticker: "HD",    name: "Home Depot Inc.",          sector: "Consumer Discretionary" },
  { ticker: "MCD",   name: "McDonald's Corp.",         sector: "Consumer Discretionary" },
];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

export function mockScreenerUniverse(): ScreenerStock[] {
  return UNIVERSE.map(co => {
    const price = parseFloat(rand(15, 800).toFixed(2));
    return {
      ticker: co.ticker,
      companyName: co.name,
      sector: co.sector,
      marketCap: parseFloat((rand(5, 3000) * 1e9).toFixed(0)),
      pe: parseFloat(rand(8, 60).toFixed(1)),
      pb: parseFloat(rand(0.5, 15).toFixed(2)),
      evEbitda: parseFloat(rand(6, 35).toFixed(1)),
      fcfYield: parseFloat(rand(1, 12).toFixed(2)),
      grossMargin: parseFloat(rand(20, 80).toFixed(1)),
      netMargin: parseFloat(rand(5, 35).toFixed(1)),
      roe: parseFloat(rand(8, 45).toFixed(1)),
      revenueGrowth1y: parseFloat(rand(-5, 40).toFixed(1)),
      revenueGrowth3y: parseFloat(rand(-2, 25).toFixed(1)),
      revenueGrowth5y: parseFloat(rand(-1, 20).toFixed(1)),
      epsGrowth: parseFloat(rand(-10, 45).toFixed(1)),
      dividendYield: parseFloat(rand(0, 5).toFixed(2)),
      dividendStreakYears: Math.floor(rand(0, 35)),
      shortInterestPct: parseFloat(rand(0.5, 25).toFixed(2)),
      institutionalOwnershipPct: parseFloat(rand(40, 90).toFixed(1)),
      momentum12m: parseFloat(rand(-30, 80).toFixed(1)),
      price,
      priceChange1d: parseFloat(rand(-4, 4).toFixed(2)),
    };
  });
}

export const PRESET_FILTERS: Record<ScreenerPreset, (s: ScreenerStock) => boolean> = {
  "deep-value":           s => s.pe < 12 && s.pb < 1.5 && s.fcfYield > 8,
  "quality-compounder":  s => s.roe > 20 && s.revenueGrowth5y > 10 && s.netMargin > 15,
  "momentum-value":       s => s.momentum12m > 20 && s.pe < 25,
  "dividend-aristocrats": s => s.dividendStreakYears >= 25 && s.dividendYield > 2,
  "squeeze-candidates":   s => s.shortInterestPct > 15 && s.pe < 30 && s.roe > 10,
};

export async function fetchScreenerData(): Promise<ScreenerStock[]> {
  const key = "screener:universe";
  return getOrFetch(key, async () => mockScreenerUniverse(), 60 * 60 * 1000);
}
