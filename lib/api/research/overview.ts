import "server-only";
import { safeQuote } from "./yahoo";
import { getOrFetch } from "@/lib/cache";

const INDEX_SYMBOLS = [
  { symbol: "^GSPC", label: "S&P 500", short: "SPX" },
  { symbol: "^IXIC", label: "Nasdaq",  short: "NDX" },
  { symbol: "^DJI",  label: "Dow Jones", short: "DJI" },
  { symbol: "^RUT",  label: "Russell 2000", short: "RUT" },
  { symbol: "^VIX",  label: "VIX (Fear)", short: "VIX" },
  { symbol: "DX-Y.NYB", label: "Dollar Index", short: "DXY" },
  { symbol: "GC=F",  label: "Gold", short: "XAU" },
  { symbol: "CL=F",  label: "Crude Oil", short: "WTI" },
  { symbol: "BTC-USD", label: "Bitcoin", short: "BTC" },
  { symbol: "^TNX",  label: "10Y Yield", short: "TNX" },
];

const MOVER_UNIVERSE = [
  "AAPL","MSFT","NVDA","GOOGL","AMZN","META","TSLA","AVGO","BRK-B","LLY",
  "UNH","JPM","V","XOM","JNJ","WMT","MA","PG","HD","COST","ORCL","BAC",
  "ABBV","KO","CVX","MRK","PEP","NFLX","ADBE","CRM","AMD","INTC","QCOM",
  "TXN","CSCO","DIS","MCD","PFE","TMO","ABT","ACN","NKE","LIN","GS","CAT",
  "DE","BA","BLK","SCHW","T",
];

export interface IndexQuote {
  symbol: string;
  label: string;
  short: string;
  price: number;
  change: number;
  changePct: number;
}

export interface MoverQuote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
}

export interface OverviewResponse {
  indices: IndexQuote[];
  gainers: MoverQuote[];
  losers: MoverQuote[];
  mostActive: MoverQuote[];
  asOf: string;
  marketStatus: "OPEN" | "CLOSED" | "PRE" | "POST";
}

function marketStatus(): "OPEN" | "CLOSED" | "PRE" | "POST" {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMins = now.getUTCMinutes();
  const dow = now.getUTCDay();
  if (dow === 0 || dow === 6) return "CLOSED";
  // US market hours in UTC (approximate, ignoring DST):
  // 9:30-16:00 ET ≈ 13:30-20:00 UTC (EST) or 14:30-21:00 (EDT)
  const t = utcHours * 60 + utcMins;
  if (t >= 13 * 60 + 30 && t <= 20 * 60) return "OPEN";
  if (t >= 8 * 60 && t < 13 * 60 + 30) return "PRE";
  if (t > 20 * 60 && t <= 24 * 60) return "POST";
  return "CLOSED";
}

export async function fetchOverview(): Promise<OverviewResponse> {
  return getOrFetch("overview:all", async () => {
    const indexResults = await Promise.all(
      INDEX_SYMBOLS.map(async s => {
        const q = await safeQuote(s.symbol);
        if (!q) return null;
        return {
          symbol: s.symbol,
          label: s.label,
          short: s.short,
          price: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePct: q.regularMarketChangePercent ?? 0,
        } as IndexQuote;
      })
    );

    const moverResults = await Promise.all(
      MOVER_UNIVERSE.map(async sym => {
        const q = await safeQuote(sym);
        if (!q || !q.regularMarketPrice) return null;
        return {
          symbol: sym,
          name: q.shortName || q.longName || sym,
          price: q.regularMarketPrice,
          changePct: q.regularMarketChangePercent ?? 0,
          volume: q.regularMarketVolume ?? 0,
        } as MoverQuote;
      })
    );

    const movers = moverResults.filter((m): m is MoverQuote => m !== null);
    const gainers = [...movers].sort((a, b) => b.changePct - a.changePct).slice(0, 10);
    const losers = [...movers].sort((a, b) => a.changePct - b.changePct).slice(0, 10);
    const mostActive = [...movers].sort((a, b) => b.volume - a.volume).slice(0, 10);

    return {
      indices: indexResults.filter((q): q is IndexQuote => q !== null),
      gainers,
      losers,
      mostActive,
      asOf: new Date().toISOString(),
      marketStatus: marketStatus(),
    };
  }, 60 * 1000); // 1 min cache
}
