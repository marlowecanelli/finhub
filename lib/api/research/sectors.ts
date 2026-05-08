import { getOrFetch } from "@/lib/cache";
import { safeChart, safeQuote } from "./yahoo";
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

const TOP_HOLDINGS: Record<string, string[]> = {
  XLK:  ["AAPL", "MSFT", "NVDA", "AVGO", "ORCL"],
  XLF:  ["BRK-B", "JPM", "V", "MA", "BAC"],
  XLE:  ["XOM", "CVX", "COP", "EOG", "WMB"],
  XLV:  ["LLY", "JNJ", "UNH", "MRK", "ABBV"],
  XLI:  ["GE", "CAT", "RTX", "HON", "UNP"],
  XLY:  ["AMZN", "TSLA", "HD", "MCD", "BKNG"],
  XLP:  ["COST", "WMT", "PG", "KO", "PEP"],
  XLRE: ["PLD", "AMT", "EQIX", "WELL", "DLR"],
  XLU:  ["NEE", "SO", "DUK", "CEG", "AEP"],
  XLB:  ["LIN", "SHW", "ECL", "APD", "FCX"],
  XLC:  ["META", "GOOGL", "GOOG", "NFLX", "DIS"],
};

const TIMEFRAME_DAYS: Record<Timeframe, number | "ytd"> = {
  "1W": 7,
  "1M": 30,
  "3M": 91,
  "6M": 182,
  "YTD": "ytd",
  "1Y": 365,
};

function startDateFor(timeframe: Timeframe): Date {
  const d = TIMEFRAME_DAYS[timeframe];
  if (d === "ytd") {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1);
  }
  const start = new Date();
  start.setDate(start.getDate() - d);
  return start;
}

async function fetchEtf(etf: SectorETF, timeframe: Timeframe): Promise<SectorPerformance | null> {
  const start = startDateFor(timeframe);
  // Fetch slightly earlier so we have a baseline price.
  const earlier = new Date(start);
  earlier.setDate(earlier.getDate() - 5);

  const [chart, quote, holdingsData] = await Promise.all([
    safeChart(etf.ticker, earlier, "1d"),
    safeQuote(etf.ticker),
    Promise.all((TOP_HOLDINGS[etf.ticker] ?? []).map(async t => {
      const h = await safeQuote(t);
      return {
        ticker: t,
        name: (h && !Array.isArray(h) ? h.shortName ?? h.longName : null) ?? t,
        returnPct: (h && !Array.isArray(h)
          ? (timeframe === "1Y" ? (h.fiftyTwoWeekChangePercent ?? 0) : (h.regularMarketChangePercent ?? 0))
          : 0),
        weight: 0,
      };
    })),
  ]);

  if (!chart.length) return null;

  const candles = chart.filter(c => typeof c.close === "number");
  if (candles.length < 2) return null;

  // Find first candle on or after `start`
  const firstAfter = candles.find(c => c.date >= start) ?? candles[0]!;
  const last = candles[candles.length - 1]!;
  const baseline = firstAfter.close ?? last.close ?? 1;
  const current = last.close ?? baseline;
  const returnPct = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;

  // RS ratio vs SPY: skip the second fetch for SPY here to keep it bounded; use return alone as proxy.
  // We approximate RS-Ratio/Momentum as 100 + relative return, scaled.
  const rsRatio = 100 + returnPct * 0.5;
  const rsMomentum = 100 + returnPct * 0.7;

  const last20 = candles.slice(-20);
  const avgVolume = last20.reduce((s, c) => s + (c.volume ?? 0), 0) / Math.max(1, last20.length);
  const lastVolume = last.volume ?? 0;
  const volumeVs20dAvg = avgVolume > 0 ? lastVolume / avgVolume : 1;

  return {
    etf,
    returnPct: parseFloat(returnPct.toFixed(2)),
    rsRatio: parseFloat(rsRatio.toFixed(2)),
    rsMomentum: parseFloat(rsMomentum.toFixed(2)),
    netFlow: 0,
    volumeVs20dAvg: parseFloat(volumeVs20dAvg.toFixed(2)),
    topHoldings: TOP_HOLDINGS[etf.ticker] ?? [],
    constituents: holdingsData,
    historicalReturns: {},
  };
}

export async function fetchSectorPerformance(timeframe: Timeframe = "1M"): Promise<SectorPerformance[]> {
  return getOrFetch(
    `sectors:${timeframe}`,
    async () => {
      const results = await Promise.all(SECTOR_ETFS.map(etf => fetchEtf(etf, timeframe)));
      return results.filter((s): s is SectorPerformance => s !== null);
    },
    15 * 60 * 1000,
  );
}
