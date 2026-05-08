import { getOrFetch } from "@/lib/cache";
import { safeQuoteSummary, safeQuote } from "./yahoo";
import type { ScreenerStock, Sector } from "@/lib/types/research";

const UNIVERSE: { ticker: string; name: string; sector: Sector }[] = [
  { ticker: "AAPL",  name: "Apple Inc.",             sector: "Technology" },
  { ticker: "MSFT",  name: "Microsoft Corp.",        sector: "Technology" },
  { ticker: "NVDA",  name: "NVIDIA Corp.",           sector: "Technology" },
  { ticker: "META",  name: "Meta Platforms",         sector: "Communication" },
  { ticker: "GOOGL", name: "Alphabet Inc.",          sector: "Communication" },
  { ticker: "AMZN",  name: "Amazon.com",             sector: "Consumer Discretionary" },
  { ticker: "TSLA",  name: "Tesla Inc.",             sector: "Consumer Discretionary" },
  { ticker: "JPM",   name: "JPMorgan Chase",         sector: "Financials" },
  { ticker: "BAC",   name: "Bank of America",        sector: "Financials" },
  { ticker: "GS",    name: "Goldman Sachs",          sector: "Financials" },
  { ticker: "V",     name: "Visa Inc.",              sector: "Financials" },
  { ticker: "MA",    name: "Mastercard Inc.",        sector: "Financials" },
  { ticker: "UNH",   name: "UnitedHealth Group",     sector: "Healthcare" },
  { ticker: "LLY",   name: "Eli Lilly",              sector: "Healthcare" },
  { ticker: "JNJ",   name: "Johnson & Johnson",      sector: "Healthcare" },
  { ticker: "ABBV",  name: "AbbVie Inc.",            sector: "Healthcare" },
  { ticker: "XOM",   name: "Exxon Mobil",            sector: "Energy" },
  { ticker: "CVX",   name: "Chevron Corp.",          sector: "Energy" },
  { ticker: "CAT",   name: "Caterpillar Inc.",       sector: "Industrials" },
  { ticker: "RTX",   name: "RTX Corporation",        sector: "Industrials" },
  { ticker: "BA",    name: "Boeing Co.",             sector: "Industrials" },
  { ticker: "HON",   name: "Honeywell Intl.",        sector: "Industrials" },
  { ticker: "PG",    name: "Procter & Gamble",       sector: "Consumer Staples" },
  { ticker: "KO",    name: "Coca-Cola Co.",          sector: "Consumer Staples" },
  { ticker: "PEP",   name: "PepsiCo Inc.",           sector: "Consumer Staples" },
  { ticker: "WMT",   name: "Walmart Inc.",           sector: "Consumer Staples" },
  { ticker: "NEE",   name: "NextEra Energy",         sector: "Utilities" },
  { ticker: "DUK",   name: "Duke Energy",            sector: "Utilities" },
  { ticker: "AMT",   name: "American Tower",         sector: "Real Estate" },
  { ticker: "PLD",   name: "Prologis Inc.",          sector: "Real Estate" },
  { ticker: "LIN",   name: "Linde plc",              sector: "Materials" },
  { ticker: "FCX",   name: "Freeport-McMoRan",       sector: "Materials" },
  { ticker: "AMD",   name: "Advanced Micro Devices", sector: "Technology" },
  { ticker: "INTC",  name: "Intel Corporation",      sector: "Technology" },
  { ticker: "NFLX",  name: "Netflix Inc.",           sector: "Communication" },
  { ticker: "DIS",   name: "Walt Disney Co.",        sector: "Communication" },
  { ticker: "HD",    name: "Home Depot Inc.",        sector: "Consumer Discretionary" },
  { ticker: "MCD",   name: "McDonald's Corp.",       sector: "Consumer Discretionary" },
];

function pct(v: number | undefined | null, scale = 1): number {
  if (v == null || !Number.isFinite(v)) return 0;
  return parseFloat((v * scale).toFixed(2));
}

function num(v: number | undefined | null): number {
  if (v == null || !Number.isFinite(v)) return 0;
  return parseFloat(v.toFixed(2));
}

async function fetchOne(co: { ticker: string; name: string; sector: Sector }): Promise<ScreenerStock | null> {
  const [summary, quote] = await Promise.all([
    safeQuoteSummary(co.ticker, [
      "summaryDetail",
      "defaultKeyStatistics",
      "financialData",
      "majorHoldersBreakdown",
    ]),
    safeQuote(co.ticker),
  ]);

  if (!summary && (!quote || Array.isArray(quote))) return null;
  const q = !Array.isArray(quote) ? quote : null;

  const sd = summary?.summaryDetail;
  const ks = summary?.defaultKeyStatistics;
  const fin = summary?.financialData;
  const holders = summary?.majorHoldersBreakdown;

  const price = q?.regularMarketPrice ?? sd?.regularMarketPreviousClose ?? 0;
  const priceChangePct = q?.regularMarketChangePercent ?? 0;
  const marketCap = q?.marketCap ?? sd?.marketCap ?? 0;
  const pe = sd?.trailingPE ?? q?.trailingPE ?? 0;
  const pb = ks?.priceToBook ?? 0;
  const evEbitda = ks?.enterpriseToEbitda ?? 0;

  const fcf = typeof fin?.freeCashflow === "number" ? fin.freeCashflow : 0;
  const fcfYield = marketCap > 0 ? (fcf / marketCap) * 100 : 0;

  const grossMargin = typeof fin?.grossMargins === "number" ? fin.grossMargins * 100 : 0;
  const netMargin = typeof fin?.profitMargins === "number" ? fin.profitMargins * 100 : 0;
  const roe = typeof fin?.returnOnEquity === "number" ? fin.returnOnEquity * 100 : 0;
  const revGrowth = typeof fin?.revenueGrowth === "number" ? fin.revenueGrowth * 100 : 0;
  const epsGrowth = typeof fin?.earningsGrowth === "number" ? fin.earningsGrowth * 100 : 0;
  const divYield = typeof sd?.dividendYield === "number" ? sd.dividendYield * 100 : 0;
  const shortPct = typeof ks?.shortPercentOfFloat === "number" ? ks.shortPercentOfFloat * 100 : 0;
  const instOwnership = typeof holders?.institutionsPercentHeld === "number" ? holders.institutionsPercentHeld * 100 : 0;
  const momentum = typeof ks?.["52WeekChange"] === "number" ? ks["52WeekChange"] * 100 : (q?.fiftyTwoWeekChangePercent ?? 0);

  return {
    ticker: co.ticker,
    companyName: co.name,
    sector: co.sector,
    marketCap: Math.round(marketCap),
    pe: num(pe),
    pb: num(pb),
    evEbitda: num(evEbitda),
    fcfYield: parseFloat(fcfYield.toFixed(2)),
    grossMargin: parseFloat(grossMargin.toFixed(1)),
    netMargin: parseFloat(netMargin.toFixed(1)),
    roe: parseFloat(roe.toFixed(1)),
    revenueGrowth1y: parseFloat(revGrowth.toFixed(1)),
    revenueGrowth3y: 0,
    revenueGrowth5y: 0,
    epsGrowth: parseFloat(epsGrowth.toFixed(1)),
    dividendYield: parseFloat(divYield.toFixed(2)),
    dividendStreakYears: 0,
    shortInterestPct: parseFloat(shortPct.toFixed(2)),
    institutionalOwnershipPct: parseFloat(instOwnership.toFixed(1)),
    momentum12m: parseFloat(momentum.toFixed(1)),
    price: parseFloat(price.toFixed(2)),
    priceChange1d: pct(priceChangePct),
  };
}

export { PRESET_FILTERS } from "./screenerPresets";

export async function fetchScreenerData(): Promise<ScreenerStock[]> {
  return getOrFetch(
    "screener:universe",
    async () => {
      const results = await Promise.all(UNIVERSE.map(fetchOne));
      return results.filter((s): s is ScreenerStock => s !== null);
    },
    60 * 60 * 1000,
  );
}
