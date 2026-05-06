/**
 * Sector Rotation API — derived from SPDR sector ETF price data
 * Source: Yahoo Finance / polygon.io for ETF OHLCV
 * Rate limit: Yahoo Finance ~100 req/min
 */

import { getOrFetch } from "@/lib/cache";
import type { SectorPerformance, SectorETF, Timeframe } from "@/lib/types/research";

export const SECTOR_ETFS: SectorETF[] = [
  { ticker: "XLK",  name: "Technology",             sector: "Technology",             color: "#00D4FF" },
  { ticker: "XLF",  name: "Financials",             sector: "Financials",             color: "#39FF14" },
  { ticker: "XLE",  name: "Energy",                 sector: "Energy",                 color: "#FFB347" },
  { ticker: "XLV",  name: "Healthcare",             sector: "Healthcare",             color: "#FF4545" },
  { ticker: "XLI",  name: "Industrials",            sector: "Industrials",            color: "#A78BFA" },
  { ticker: "XLY",  name: "Consumer Discretionary", sector: "Consumer Discretionary", color: "#F472B6" },
  { ticker: "XLP",  name: "Consumer Staples",       sector: "Consumer Staples",       color: "#34D399" },
  { ticker: "XLRE", name: "Real Estate",            sector: "Real Estate",            color: "#FB923C" },
  { ticker: "XLU",  name: "Utilities",              sector: "Utilities",              color: "#60A5FA" },
  { ticker: "XLB",  name: "Materials",              sector: "Materials",              color: "#FBBF24" },
  { ticker: "XLC",  name: "Communication",          sector: "Communication",          color: "#C084FC" },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const PERF_RANGES: Record<Timeframe, [number, number]> = {
  "1W": [-3, 4],
  "1M": [-8, 12],
  "3M": [-15, 20],
  "6M": [-20, 35],
  "YTD": [-25, 45],
  "1Y": [-30, 55],
};

const TECH_HOLDINGS = ["AAPL", "MSFT", "NVDA", "META", "AVGO"];
const FIN_HOLDINGS  = ["JPM", "BAC", "WFC", "GS", "MS"];
const ENERGY_HOLDINGS = ["XOM", "CVX", "COP", "EOG", "SLB"];
const HEALTH_HOLDINGS = ["UNH", "LLY", "JNJ", "ABBV", "MRK"];
const IND_HOLDINGS  = ["CAT", "RTX", "HON", "UPS", "BA"];
const DISC_HOLDINGS = ["AMZN", "TSLA", "HD", "MCD", "NKE"];
const STAP_HOLDINGS = ["PG", "KO", "PEP", "WMT", "COST"];
const REIT_HOLDINGS = ["AMT", "PLD", "EQIX", "O", "PSA"];
const UTIL_HOLDINGS = ["NEE", "DUK", "SO", "D", "AEP"];
const MAT_HOLDINGS  = ["LIN", "APD", "ECL", "FCX", "NEM"];
const COMM_HOLDINGS = ["META", "GOOGL", "VZ", "T", "NFLX"];

const HOLDINGS_MAP: Record<string, string[]> = {
  XLK: TECH_HOLDINGS, XLF: FIN_HOLDINGS, XLE: ENERGY_HOLDINGS,
  XLV: HEALTH_HOLDINGS, XLI: IND_HOLDINGS, XLY: DISC_HOLDINGS,
  XLP: STAP_HOLDINGS, XLRE: REIT_HOLDINGS, XLU: UTIL_HOLDINGS,
  XLB: MAT_HOLDINGS, XLC: COMM_HOLDINGS,
};

export function mockSectorPerformance(timeframe: Timeframe = "1M"): SectorPerformance[] {
  const [lo, hi] = PERF_RANGES[timeframe];

  return SECTOR_ETFS.map(etf => {
    const returnPct = parseFloat(rand(lo, hi).toFixed(2));
    const rsRatio = parseFloat((100 + rand(-8, 10)).toFixed(2));
    const rsMomentum = parseFloat((100 + rand(-8, 10)).toFixed(2));
    const netFlow = rand(-500, 900) * 1e6;
    const topHoldings = HOLDINGS_MAP[etf.ticker] ?? ["N/A"];

    const constituents = topHoldings.map(ticker => ({
      ticker,
      name: ticker,
      returnPct: parseFloat(rand(lo * 1.2, hi * 1.2).toFixed(2)),
      weight: parseFloat(rand(4, 18).toFixed(2)),
    }));

    const historicalReturns: Record<string, number[]> = {};
    for (let month = 1; month <= 12; month++) {
      const key = month.toString();
      historicalReturns[key] = Array.from({ length: 20 }, () =>
        parseFloat(rand(-5, 8).toFixed(2))
      );
    }

    return {
      etf,
      returnPct,
      rsRatio,
      rsMomentum,
      netFlow,
      volumeVs20dAvg: parseFloat(rand(0.6, 2.0).toFixed(2)),
      topHoldings,
      constituents,
      historicalReturns,
    };
  });
}

export async function fetchSectorPerformance(timeframe: Timeframe = "1M"): Promise<SectorPerformance[]> {
  const key = `sectors:${timeframe}`;
  return getOrFetch(key, async () => mockSectorPerformance(timeframe), 15 * 60 * 1000);
}
