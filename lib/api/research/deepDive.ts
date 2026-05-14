import "server-only";
import { safeQuote, safeQuoteSummary, safeChart } from "./yahoo";
import { getOrFetch } from "@/lib/cache";

export interface DeepDiveResponse {
  ticker: string;
  found: boolean;
  profile: {
    name: string;
    sector: string;
    industry: string;
    employees: number | null;
    website: string;
    description: string;
  };
  quote: {
    price: number;
    change: number;
    changePct: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    marketCap: number | null;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  };
  valuation: {
    peRatio: number | null;
    forwardPE: number | null;
    pegRatio: number | null;
    priceToBook: number | null;
    priceToSales: number | null;
    evToEbitda: number | null;
    dividendYield: number | null;
    profitMargin: number | null;
    operatingMargin: number | null;
    returnOnEquity: number | null;
    returnOnAssets: number | null;
    debtToEquity: number | null;
    currentRatio: number | null;
    beta: number | null;
  };
  analyst: {
    targetMean: number | null;
    targetHigh: number | null;
    targetLow: number | null;
    recommendation: string | null;
    numberOfAnalysts: number | null;
    upside: number | null;
  };
  earnings: {
    epsTrailing: number | null;
    epsForward: number | null;
    earningsGrowth: number | null;
    revenueGrowth: number | null;
    nextEarningsDate: string | null;
  };
  chart: { date: string; close: number }[];
  insiders: {
    name: string;
    role: string;
    type: string;
    shares: number;
    value: number;
    date: string | null;
  }[];
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "object" && v && "raw" in (v as Record<string, unknown>)) {
    const raw = (v as { raw?: unknown }).raw;
    if (typeof raw === "number") return raw;
  }
  return null;
}

export async function fetchDeepDive(ticker: string): Promise<DeepDiveResponse> {
  const sym = ticker.toUpperCase();
  return getOrFetch(`deepDive:${sym}`, async () => {
    const [quote, summary] = await Promise.all([
      safeQuote(sym),
      safeQuoteSummary(sym, [
        "assetProfile",
        "summaryDetail",
        "defaultKeyStatistics",
        "financialData",
        "earnings",
        "earningsTrend",
        "calendarEvents",
        "insiderTransactions",
        "price",
      ]),
    ]);

    if (!quote && !summary) {
      return {
        ticker: sym,
        found: false,
      } as unknown as DeepDiveResponse;
    }

    const chartPeriod = new Date();
    chartPeriod.setFullYear(chartPeriod.getFullYear() - 1);
    const chartData = await safeChart(sym, chartPeriod, "1d");
    const chart = chartData
      .filter(c => c.close !== null && c.close !== undefined)
      .map(c => ({
        date: (c.date instanceof Date ? c.date : new Date(c.date)).toISOString().slice(0, 10),
        close: c.close as number,
      }));

    const profile = summary?.assetProfile;
    const price = summary?.price;
    const detail = summary?.summaryDetail;
    const stats = summary?.defaultKeyStatistics;
    const finData = summary?.financialData;
    const earnings = summary?.earnings;
    const trend = summary?.earningsTrend;
    const cal = summary?.calendarEvents;
    const insiderRaw = summary?.insiderTransactions?.transactions ?? [];

    const targetMean = num(finData?.targetMeanPrice);
    const currentPrice = num(finData?.currentPrice) ?? quote?.regularMarketPrice ?? 0;
    const upside = targetMean && currentPrice ? ((targetMean - currentPrice) / currentPrice) * 100 : null;

    const next0 = trend?.trend?.[0];

    const nextEarningsRaw = cal?.earnings?.earningsDate?.[0];
    const nextEarningsDate = nextEarningsRaw
      ? (nextEarningsRaw instanceof Date ? nextEarningsRaw : new Date(nextEarningsRaw as unknown as string)).toISOString()
      : null;

    return {
      ticker: sym,
      found: true,
      profile: {
        name: price?.longName || price?.shortName || quote?.shortName || sym,
        sector: profile?.sector || "—",
        industry: profile?.industry || "—",
        employees: num(profile?.fullTimeEmployees),
        website: profile?.website || "",
        description: profile?.longBusinessSummary || "",
      },
      quote: {
        price: currentPrice,
        change: quote?.regularMarketChange ?? 0,
        changePct: quote?.regularMarketChangePercent ?? 0,
        open: quote?.regularMarketOpen ?? 0,
        high: quote?.regularMarketDayHigh ?? 0,
        low: quote?.regularMarketDayLow ?? 0,
        volume: quote?.regularMarketVolume ?? 0,
        marketCap: num(price?.marketCap),
        fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh ?? 0,
        fiftyTwoWeekLow: quote?.fiftyTwoWeekLow ?? 0,
      },
      valuation: {
        peRatio: num(detail?.trailingPE) ?? num(stats?.trailingEps),
        forwardPE: num(detail?.forwardPE) ?? num(stats?.forwardPE),
        pegRatio: num(stats?.pegRatio),
        priceToBook: num(stats?.priceToBook),
        priceToSales: num(detail?.priceToSalesTrailing12Months),
        evToEbitda: num(stats?.enterpriseToEbitda),
        dividendYield: num(detail?.dividendYield),
        profitMargin: num(finData?.profitMargins),
        operatingMargin: num(finData?.operatingMargins),
        returnOnEquity: num(finData?.returnOnEquity),
        returnOnAssets: num(finData?.returnOnAssets),
        debtToEquity: num(finData?.debtToEquity),
        currentRatio: num(finData?.currentRatio),
        beta: num(detail?.beta) ?? num(stats?.beta),
      },
      analyst: {
        targetMean,
        targetHigh: num(finData?.targetHighPrice),
        targetLow: num(finData?.targetLowPrice),
        recommendation: finData?.recommendationKey || null,
        numberOfAnalysts: num(finData?.numberOfAnalystOpinions),
        upside,
      },
      earnings: {
        epsTrailing: num(stats?.trailingEps),
        epsForward: num(stats?.forwardEps),
        earningsGrowth: num(next0?.growth) ?? num(finData?.earningsGrowth),
        revenueGrowth: num(finData?.revenueGrowth),
        nextEarningsDate,
      },
      chart,
      insiders: insiderRaw.slice(0, 20).map(t => ({
        name: t.filerName || "—",
        role: t.filerRelation || "—",
        type: t.transactionText || "—",
        shares: t.shares ?? 0,
        value: num(t.value) ?? 0,
        date: t.startDate
          ? (t.startDate instanceof Date ? t.startDate : new Date(t.startDate as unknown as string)).toISOString()
          : null,
      })),
    };
  }, 5 * 60 * 1000);
}
