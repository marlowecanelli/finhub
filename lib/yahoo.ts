import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

export type Timeframe = "1D" | "5D" | "1M" | "3M" | "1Y" | "5Y" | "All";

export type HistoryPoint = {
  t: number; // unix seconds
  c: number; // close
};

type ChartInterval = "1m" | "5m" | "15m" | "30m" | "60m" | "1d" | "1wk" | "1mo";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const TIMEFRAME_MAP: Record<Timeframe, { period1: Date; interval: ChartInterval }> = {
  "1D": { period1: daysAgo(1),   interval: "5m" },
  "5D": { period1: daysAgo(5),   interval: "30m" },
  "1M": { period1: daysAgo(30),  interval: "1d" },
  "3M": { period1: daysAgo(90),  interval: "1d" },
  "1Y": { period1: daysAgo(365), interval: "1d" },
  "5Y": { period1: daysAgo(1825), interval: "1wk" },
  All:  { period1: new Date("1985-01-01"), interval: "1mo" },
};

export function getChartParams(tf: Timeframe) {
  return TIMEFRAME_MAP[tf];
}

export type QuoteSnapshot = {
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  marketState: string | null;
};

export type TickerSummary = {
  quote: QuoteSnapshot;
  stats: {
    marketCap: number | null;
    peRatio: number | null;
    forwardPe: number | null;
    eps: number | null;
    dividendYield: number | null;
    week52High: number | null;
    week52Low: number | null;
    beta: number | null;
    volume: number | null;
    avgVolume: number | null;
  };
  profile: {
    longName: string | null;
    description: string | null;
    sector: string | null;
    industry: string | null;
    ceo: string | null;
    employees: number | null;
    website: string | null;
    headquarters: string | null;
  };
  financialsQuarterly: Array<{
    quarter: string;
    revenue: number | null;
    netIncome: number | null;
    profitMargin: number | null;
  }>;
};

export async function getTickerSummary(symbol: string): Promise<TickerSummary> {
  const sym = symbol.toUpperCase();

  const summary = await yahooFinance.quoteSummary(sym, {
    modules: [
      "price",
      "summaryDetail",
      "defaultKeyStatistics",
      "assetProfile",
      "incomeStatementHistoryQuarterly",
      "financialData",
    ],
  });

  const price = summary.price;
  const detail = summary.summaryDetail;
  const stats = summary.defaultKeyStatistics;
  const profile = summary.assetProfile;
  const fin = summary.financialData;
  const income = summary.incomeStatementHistoryQuarterly;

  if (!price?.regularMarketPrice && !detail?.regularMarketOpen) {
    throw new Error(`No data for ${sym}`);
  }

  const current = price?.regularMarketPrice ?? null;
  const prev = price?.regularMarketPreviousClose ?? detail?.previousClose ?? null;
  const change =
    current != null && prev != null ? current - prev : null;
  const changePct =
    current != null && prev && prev !== 0 ? ((current - prev) / prev) * 100 : null;

  const address = [profile?.address1, profile?.city, profile?.state, profile?.country]
    .filter(Boolean)
    .join(", ");

  const ceo = profile?.companyOfficers?.find((o) => /ceo|chief executive/i.test(o.title ?? ""))
    ?.name ?? profile?.companyOfficers?.[0]?.name ?? null;

  const quarterlyRaw = income?.incomeStatementHistory ?? [];
  const financialsQuarterly = quarterlyRaw
    .slice(0, 4)
    .reverse()
    .map((q) => {
      const revenue = q.totalRevenue ?? null;
      const netIncome = q.netIncome ?? null;
      const margin =
        revenue && netIncome != null && revenue !== 0
          ? (netIncome / revenue) * 100
          : null;
      const endDate = q.endDate ? new Date(q.endDate) : null;
      return {
        quarter: endDate
          ? `Q${Math.floor(endDate.getUTCMonth() / 3) + 1} '${String(endDate.getUTCFullYear()).slice(2)}`
          : "",
        revenue,
        netIncome,
        profitMargin: margin,
      };
    });

  return {
    quote: {
      symbol: sym,
      name: price?.longName ?? price?.shortName ?? sym,
      exchange: price?.exchangeName ?? null,
      currency: price?.currency ?? "USD",
      price: current,
      previousClose: prev,
      change,
      changePercent: changePct,
      marketState: price?.marketState ?? null,
    },
    stats: {
      marketCap: price?.marketCap ?? detail?.marketCap ?? null,
      peRatio: detail?.trailingPE ?? null,
      forwardPe: detail?.forwardPE ?? null,
      eps: stats?.trailingEps ?? null,
      dividendYield: detail?.dividendYield ?? null,
      week52High: detail?.fiftyTwoWeekHigh ?? null,
      week52Low: detail?.fiftyTwoWeekLow ?? null,
      beta: stats?.beta ?? detail?.beta ?? null,
      volume: detail?.volume ?? price?.regularMarketVolume ?? null,
      avgVolume: detail?.averageVolume ?? null,
    },
    profile: {
      longName: price?.longName ?? null,
      description: profile?.longBusinessSummary ?? null,
      sector: profile?.sector ?? null,
      industry: profile?.industry ?? null,
      ceo,
      employees: profile?.fullTimeEmployees ?? null,
      website: profile?.website ?? null,
      headquarters: address || null,
    },
    financialsQuarterly,
  };

  void fin;
}

export async function getHistory(
  symbol: string,
  tf: Timeframe
): Promise<HistoryPoint[]> {
  const { period1, interval } = getChartParams(tf);
  const res = await yahooFinance.chart(symbol.toUpperCase(), {
    period1,
    interval,
  });
  const quotes = res.quotes ?? [];
  return quotes
    .filter((q) => q.close != null && q.date != null)
    .map((q) => ({
      t: Math.floor(new Date(q.date as Date).getTime() / 1000),
      c: q.close as number,
    }));
}

export type TickerNewsItem = {
  uuid: string;
  title: string;
  publisher: string | null;
  link: string;
  providerPublishTime: number | null;
};

export async function getTickerNews(
  symbol: string,
  count = 10
): Promise<TickerNewsItem[]> {
  const res = await yahooFinance.search(symbol.toUpperCase(), {
    newsCount: count,
    quotesCount: 0,
  });
  const items = res.news ?? [];
  return items.slice(0, count).map((n) => ({
    uuid: n.uuid,
    title: n.title,
    publisher: n.publisher ?? null,
    link: n.link,
    providerPublishTime: n.providerPublishTime
      ? Math.floor(new Date(n.providerPublishTime as unknown as string | Date).getTime() / 1000)
      : null,
  }));
}

export type SearchSuggestion = {
  symbol: string;
  name: string;
  exchange: string | null;
  type: string | null;
};

export async function searchTickers(query: string): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];
  const res = await yahooFinance.search(query, {
    quotesCount: 8,
    newsCount: 0,
    enableFuzzyQuery: true,
  });
  const quotes = res.quotes ?? [];
  return quotes
    .filter((q): q is typeof q & { symbol: string } =>
      Boolean("symbol" in q && q.symbol)
    )
    .map((q) => ({
      symbol: q.symbol,
      name: String(("longname" in q && q.longname) || ("shortname" in q && q.shortname) || q.symbol),
      exchange: "exchange" in q && typeof q.exchange === "string" ? q.exchange : null,
      type: "quoteType" in q && typeof q.quoteType === "string" ? q.quoteType : null,
    }));
}
