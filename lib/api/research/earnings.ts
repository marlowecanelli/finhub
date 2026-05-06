/**
 * Earnings Intelligence API — SEC EDGAR XBRL + Earnings Whispers
 * Source: https://efts.sec.gov/LATEST/search-index, earningswhispers.com
 * Rate limit: ~5 req/s EDGAR, Earnings Whispers rate-limited
 */

import { getOrFetch } from "@/lib/cache";
import type { EarningsEvent, Sector, EarningsTiming, BeatQuality } from "@/lib/types/research";

const EARNINGS_COMPANIES: { ticker: string; name: string; sector: Sector }[] = [
  { ticker: "AAPL",  name: "Apple Inc.",              sector: "Technology" },
  { ticker: "MSFT",  name: "Microsoft Corporation",   sector: "Technology" },
  { ticker: "NVDA",  name: "NVIDIA Corporation",       sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.",            sector: "Communication" },
  { ticker: "META",  name: "Meta Platforms",           sector: "Communication" },
  { ticker: "AMZN",  name: "Amazon.com Inc.",          sector: "Consumer Discretionary" },
  { ticker: "TSLA",  name: "Tesla Inc.",               sector: "Consumer Discretionary" },
  { ticker: "JPM",   name: "JPMorgan Chase",           sector: "Financials" },
  { ticker: "GS",    name: "Goldman Sachs",            sector: "Financials" },
  { ticker: "UNH",   name: "UnitedHealth Group",       sector: "Healthcare" },
  { ticker: "LLY",   name: "Eli Lilly",               sector: "Healthcare" },
  { ticker: "XOM",   name: "Exxon Mobil",             sector: "Energy" },
  { ticker: "CAT",   name: "Caterpillar Inc.",         sector: "Industrials" },
  { ticker: "V",     name: "Visa Inc.",               sector: "Financials" },
  { ticker: "MA",    name: "Mastercard Inc.",          sector: "Financials" },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export function mockEarningsEvents(): EarningsEvent[] {
  return EARNINGS_COMPANIES.map((co, i) => {
    const daysOffset = i * 2 - 5;
    const isPast = daysOffset < 0;
    const timing: EarningsTiming = Math.random() > 0.5 ? "BMO" : "AMC";
    const consensusEPS = parseFloat(rand(0.5, 8.0).toFixed(2));
    const whisperEPS = parseFloat((consensusEPS * rand(1.01, 1.08)).toFixed(2));
    const actualEPS = isPast ? parseFloat((consensusEPS * rand(0.85, 1.15)).toFixed(2)) : undefined;
    const consensusRevenue = parseFloat(rand(5, 120).toFixed(1)) * 1e9;
    const actualRevenue = isPast ? consensusRevenue * rand(0.9, 1.12) : undefined;

    let beatQuality: BeatQuality = "pending";
    if (isPast && actualEPS !== undefined) {
      const epsBeats = actualEPS > consensusEPS;
      const revBeats = actualRevenue !== undefined && actualRevenue > consensusRevenue;
      const guidanceRaised = Math.random() > 0.4;
      if (epsBeats && revBeats && guidanceRaised) beatQuality = "triple-beat";
      else if (epsBeats && revBeats) beatQuality = "double-beat";
      else if (epsBeats) beatQuality = "single-beat";
      else beatQuality = "miss";
    }

    const impliedMovePct = parseFloat(rand(3, 12).toFixed(1));
    const historicalActualMoves = Array.from({ length: 8 }, () =>
      parseFloat((rand(-15, 18)).toFixed(1))
    );
    const historicalImpliedMoves = historicalActualMoves.map(m =>
      parseFloat((Math.abs(m) * rand(0.7, 1.3)).toFixed(1))
    );

    return {
      id: `earn-${co.ticker}`,
      ticker: co.ticker,
      companyName: co.name,
      sector: co.sector,
      earningsDate: daysFromNow(daysOffset),
      timing,
      consensusEPS,
      whisperEPS,
      actualEPS,
      consensusRevenue,
      actualRevenue,
      impliedMovePct,
      historicalActualMoves,
      historicalImpliedMoves,
      beatQuality,
      guidanceRaised: isPast ? Math.random() > 0.4 : undefined,
      postEarningsDrift: {
        d1: parseFloat(rand(-5, 8).toFixed(2)),
        d3: parseFloat(rand(-6, 12).toFixed(2)),
        d5: parseFloat(rand(-8, 15).toFixed(2)),
        d10: parseFloat(rand(-10, 20).toFixed(2)),
      },
    };
  });
}

export async function fetchEarningsEvents(): Promise<EarningsEvent[]> {
  const key = "earnings:all";
  return getOrFetch(key, async () => mockEarningsEvents(), 30 * 60 * 1000);
}
