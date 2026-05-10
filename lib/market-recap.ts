import type { SupabaseClient } from "@supabase/supabase-js";
import YahooFinance from "yahoo-finance2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IndexSnapshot = {
  symbol: string;
  label: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
};

export type TopMover = {
  symbol: string;
  name: string;
  changePct: number;
  price: number;
};

export type SectorSnapshot = {
  symbol: string;
  label: string;
  changePct: number | null;
};

export type MarketRecap = {
  id: string;
  recap_date: string;           // "YYYY-MM-DD"
  headline: string;
  paragraph_movers: string;
  paragraph_why: string;
  paragraph_tomorrow: string;
  indices_data: IndexSnapshot[];
  top_movers: TopMover[];
  sectors_data: SectorSnapshot[];
  generated_at: string;
};

/** Lightweight summary used for the archive index (no paragraph text). */
export type RecapSummary = {
  recap_date: string;
  headline: string;
  sp_change_pct: number | null; // extracted from indices_data[0] (^GSPC)
};

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const INDICES: { symbol: string; label: string }[] = [
  { symbol: "^GSPC",  label: "S&P 500"   },
  { symbol: "^IXIC",  label: "Nasdaq"    },
  { symbol: "^DJI",   label: "Dow Jones" },
  { symbol: "^RUT",   label: "Russell 2000" },
  { symbol: "^VIX",   label: "VIX"       },
  { symbol: "^TNX",   label: "10-Yr Yield" },
  { symbol: "GC=F",   label: "Gold"      },
  { symbol: "CL=F",   label: "Oil (WTI)" },
  { symbol: "BTC-USD",label: "Bitcoin"   },
];

const SECTORS: { symbol: string; label: string }[] = [
  { symbol: "XLK",  label: "Technology"    },
  { symbol: "XLF",  label: "Financials"    },
  { symbol: "XLV",  label: "Health Care"   },
  { symbol: "XLE",  label: "Energy"        },
  { symbol: "XLI",  label: "Industrials"   },
  { symbol: "XLC",  label: "Comm. Services"},
  { symbol: "XLY",  label: "Cons. Discr."  },
  { symbol: "XLP",  label: "Cons. Staples" },
  { symbol: "XLRE", label: "Real Estate"   },
  { symbol: "XLB",  label: "Materials"     },
  { symbol: "XLU",  label: "Utilities"     },
];

// Top-30 S&P 500 names used for finding daily movers
const SP500_SAMPLE = [
  "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","AVGO","BRK-B","JPM",
  "LLY","UNH","V","XOM","MA","HD","COST","PG","WMT","NFLX",
  "AMD","ORCL","BAC","KO","PEP","ABBV","MRK","TMO","CSCO","CRM",
];

// ---------------------------------------------------------------------------
// Market data fetch
// ---------------------------------------------------------------------------

export async function fetchMarketSnapshot(): Promise<{
  indices: IndexSnapshot[];
  sectors: SectorSnapshot[];
  topMovers: TopMover[];
}> {
  const yf = new YahooFinance();

  const allSymbols = [
    ...INDICES.map((i) => i.symbol),
    ...SECTORS.map((s) => s.symbol),
    ...SP500_SAMPLE,
  ];

  const results = await yf.quote(allSymbols).catch(() => []);
  const quoteMap = new Map<string, (typeof results extends (infer T)[] ? T : never)>();
  for (const q of Array.isArray(results) ? results : [results]) {
    if (q && typeof q === "object" && "symbol" in q) {
      quoteMap.set((q as { symbol: string }).symbol, q);
    }
  }

  const indices: IndexSnapshot[] = INDICES.map(({ symbol, label }) => {
    const q = quoteMap.get(symbol) as
      | { regularMarketPrice?: number; regularMarketChange?: number; regularMarketChangePercent?: number }
      | undefined;
    return {
      symbol,
      label,
      price:      q?.regularMarketPrice     ?? null,
      change:     q?.regularMarketChange    ?? null,
      changePct:  q?.regularMarketChangePercent ?? null,
    };
  });

  const sectors: SectorSnapshot[] = SECTORS.map(({ symbol, label }) => {
    const q = quoteMap.get(symbol) as
      | { regularMarketChangePercent?: number }
      | undefined;
    return {
      symbol,
      label,
      changePct: q?.regularMarketChangePercent ?? null,
    };
  });

  type QuoteEntry = {
    symbol: string;
    shortName?: string;
    longName?: string;
    regularMarketPrice?: number;
    regularMarketChangePercent?: number;
  };

  const spMoverRaw: QuoteEntry[] = SP500_SAMPLE.map((sym) => quoteMap.get(sym) as QuoteEntry).filter(Boolean);
  const sorted = [...spMoverRaw].sort(
    (a, b) => Math.abs(b.regularMarketChangePercent ?? 0) - Math.abs(a.regularMarketChangePercent ?? 0)
  );
  const topMovers: TopMover[] = sorted.slice(0, 8).map((q) => ({
    symbol: q.symbol,
    name: (q.shortName ?? q.longName ?? q.symbol).replace(/, Inc\.?/i, "").slice(0, 20),
    changePct: q.regularMarketChangePercent ?? 0,
    price: q.regularMarketPrice ?? 0,
  }));

  return { indices, sectors, topMovers };
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

export async function getLatestRecap(supabase: SupabaseClient): Promise<MarketRecap | null> {
  const { data, error } = await supabase
    .from("market_recaps")
    .select("*")
    .order("recap_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as MarketRecap;
}

export async function getRecapByDate(
  supabase: SupabaseClient,
  date: string
): Promise<MarketRecap | null> {
  const { data, error } = await supabase
    .from("market_recaps")
    .select("*")
    .eq("recap_date", date)
    .maybeSingle();
  if (error || !data) return null;
  return data as MarketRecap;
}

/** Returns lightweight summaries for the past 30 calendar days, newest first. */
export async function getArchive(supabase: SupabaseClient): Promise<RecapSummary[]> {
  const since = new Date();
  since.setDate(since.getDate() - 31);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("market_recaps")
    .select("recap_date, headline, indices_data")
    .gte("recap_date", sinceStr)
    .order("recap_date", { ascending: false });

  if (error || !data) return [];

  return (data as { recap_date: string; headline: string; indices_data: IndexSnapshot[] }[]).map(
    (row) => {
      const sp = row.indices_data?.find?.((i) => i.symbol === "^GSPC");
      return {
        recap_date: row.recap_date,
        headline: row.headline,
        sp_change_pct: sp?.changePct ?? null,
      };
    }
  );
}
