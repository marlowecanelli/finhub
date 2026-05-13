import YahooFinance from "yahoo-finance2";
import type { FundamentalsSnapshot, AnnualFinancial } from "./types";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 1, delay = 1500): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await sleep(delay);
    return fetchWithRetry(fn, retries - 1, delay * 2);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeNum(v: unknown): number | null {
  if (typeof v === "number" && isFinite(v)) return v;
  return null;
}

function linearSlope(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((acc, x, i) => acc + (x - meanX) * ((ys[i] ?? 0) - meanY), 0);
  const den = xs.reduce((acc, x) => acc + (x - meanX) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

function computeROIC(
  netIncome: number | null,
  interestExpense: number | null,
  taxRate: number,
  totalDebt: number | null,
  equity: number | null
): number | null {
  if (netIncome == null || equity == null) return null;
  const ie = interestExpense ?? 0;
  const debt = totalDebt ?? 0;
  const nopat = netIncome + ie * (1 - taxRate);
  const ic = equity + debt;
  if (ic <= 0) return null;
  return nopat / ic;
}

// Convert a fundamentalsTimeSeries row to a plain record for safe access
function toRecord(row: unknown): Record<string, unknown> {
  return (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function getFundamentals(ticker: string): Promise<FundamentalsSnapshot | null> {
  const sym = ticker.toUpperCase();
  const sixYearsAgo = new Date();
  sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
  const period1 = sixYearsAgo.toISOString().slice(0, 10);

  // ── Parallel fetch ────────────────────────────────────────────────────────
  const [summary, finRows, bsRows, cfRows] = await Promise.all([
    // Current company metadata (no history modules — those are deprecated)
    fetchWithRetry(() =>
      yf.quoteSummary(sym, {
        modules: [
          "assetProfile",
          "summaryDetail",
          "defaultKeyStatistics",
          "financialData",
          "majorHoldersBreakdown",
          "price",
        ],
      })
    ).catch(() => null),

    // Income statement history via fundamentalsTimeSeries
    fetchWithRetry(() =>
      yf.fundamentalsTimeSeries(sym, { period1, type: "annual", module: "financials" })
    ).catch(() => [] as unknown[]),

    // Balance sheet history
    fetchWithRetry(() =>
      yf.fundamentalsTimeSeries(sym, { period1, type: "annual", module: "balance-sheet" })
    ).catch(() => [] as unknown[]),

    // Cash flow history
    fetchWithRetry(() =>
      yf.fundamentalsTimeSeries(sym, { period1, type: "annual", module: "cash-flow" })
    ).catch(() => [] as unknown[]),
  ]);

  if (!summary) return null;
  if ((finRows as unknown[]).length < 2) return null;

  const assetProfile   = summary.assetProfile   as Record<string, unknown> | undefined;
  const summaryDetail  = summary.summaryDetail   as Record<string, unknown> | undefined;
  const keyStats       = summary.defaultKeyStatistics as Record<string, unknown> | undefined;
  const financialData  = summary.financialData   as Record<string, unknown> | undefined;
  const price          = summary.price           as Record<string, unknown> | undefined;
  const majorHolders   = summary.majorHoldersBreakdown as Record<string, unknown> | undefined;

  // ── Build lookup maps by fiscal year (date.getFullYear()) ─────────────────
  // fundamentalsTimeSeries rows have a Date object in the `date` field

  function rowYear(row: unknown): number | null {
    const r = toRecord(row);
    const d = r["date"];
    if (d instanceof Date && !isNaN(d.getTime())) return d.getFullYear();
    if (typeof d === "string" || typeof d === "number") {
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed.getFullYear();
    }
    return null;
  }

  const bsByYear  = new Map<number, Record<string, unknown>>();
  const cfByYear  = new Map<number, Record<string, unknown>>();
  for (const row of bsRows as unknown[]) {
    const yr = rowYear(row);
    if (yr != null) bsByYear.set(yr, toRecord(row));
  }
  for (const row of cfRows as unknown[]) {
    const yr = rowYear(row);
    if (yr != null) cfByYear.set(yr, toRecord(row));
  }

  // ── Assemble AnnualFinancial records ──────────────────────────────────────
  const annualMap = new Map<number, Partial<AnnualFinancial>>();

  for (const row of finRows as unknown[]) {
    const yr = rowYear(row);
    if (yr == null) continue;
    const f = toRecord(row);

    const revenue    = safeNum(f["totalRevenue"])   ?? safeNum(f["operatingRevenue"]);
    const netIncome  = safeNum(f["netIncome"])       ?? safeNum(f["netIncomeCommonStockholders"]);
    const grossProfit = safeNum(f["grossProfit"]);
    // New API uses dilutedEPS (uppercase S); fall back to basicEPS
    const eps        = safeNum(f["dilutedEPS"])      ?? safeNum(f["basicEPS"]);
    const ie         = safeNum(f["interestExpense"]); // positive amount in new API

    const bs = bsByYear.get(yr) ?? {};
    const cf = cfByYear.get(yr) ?? {};

    const equity       = safeNum(bs["stockholdersEquity"])   ?? safeNum(bs["commonStockEquity"]);
    const longTermDebt = safeNum(bs["longTermDebt"]);
    const totalDebt    = safeNum(bs["totalDebt"])            ?? longTermDebt ?? 0;
    const shares       = safeNum(bs["ordinarySharesNumber"]) ?? safeNum(bs["shareIssued"]);

    // operatingCashFlow: new API field name (positive)
    const ocf  = safeNum(cf["operatingCashFlow"])    ?? safeNum(cf["cashFlowFromContinuingOperatingActivities"]);
    // capitalExpenditure: negative in new API (same convention as old)
    const capex = safeNum(cf["capitalExpenditure"]);
    const sbc  = safeNum(cf["stockBasedCompensation"]);
    // freeCashFlow provided directly, or compute from ocf + capex (capex is negative)
    const fcf  = safeNum(cf["freeCashFlow"])         ??
      (ocf != null && capex != null ? ocf + capex : ocf ?? null);

    const netMargin   = revenue && revenue !== 0 && netIncome != null ? netIncome / revenue : null;
    const grossMargin = revenue && revenue !== 0 && grossProfit != null ? grossProfit / revenue : null;
    const roe         = netIncome != null && equity && equity !== 0 ? netIncome / equity : null;
    const roic        = computeROIC(netIncome, ie, 0.21, totalDebt, equity);

    annualMap.set(yr, {
      year: yr,
      revenue,
      netIncome,
      grossProfit,
      eps,
      netMargin,
      grossMargin,
      operatingCashFlow: ocf,
      capex,
      fcf,
      totalDebt,
      longTermDebt,
      equity,
      roe,
      sharesOutstanding: shares,
      sbc,
      roic,
    });
  }

  // Sort oldest-first; normalise to AnnualFinancial
  const annuals: AnnualFinancial[] = Array.from(annualMap.values())
    .filter((a) => a.year != null)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
    .map((a) => ({
      year:              a.year               ?? 0,
      revenue:           a.revenue            ?? null,
      netIncome:         a.netIncome          ?? null,
      grossProfit:       a.grossProfit        ?? null,
      eps:               a.eps                ?? null,
      netMargin:         a.netMargin          ?? null,
      grossMargin:       a.grossMargin        ?? null,
      operatingCashFlow: a.operatingCashFlow  ?? null,
      capex:             a.capex              ?? null,
      fcf:               a.fcf               ?? null,
      totalDebt:         a.totalDebt          ?? null,
      longTermDebt:      a.longTermDebt       ?? null,
      equity:            a.equity             ?? null,
      roe:               a.roe               ?? null,
      sharesOutstanding: a.sharesOutstanding  ?? null,
      sbc:               a.sbc               ?? null,
      roic:              a.roic              ?? null,
    }));

  if (annuals.length < 2) return null;

  // ── Price history (5Y weekly) ─────────────────────────────────────────────
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const priceHistory = await fetchWithRetry(() =>
    yf.historical(sym, { period1: fiveYearsAgo, interval: "1wk" })
  ).catch(() => []);

  const sortedHistory = (priceHistory ?? [])
    .filter((p) => p.close != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p) => ({
      date:  new Date(p.date).toISOString().slice(0, 10),
      close: p.close!,
    }));

  // ── Dividend history (10Y monthly) ───────────────────────────────────────
  let dividendHistory: { date: string; amount: number }[] = [];
  try {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const divRaw = await fetchWithRetry(() =>
      yf.historical(sym, { period1: tenYearsAgo, interval: "1mo", events: "dividends" })
    ).catch(() => []);

    dividendHistory = (divRaw ?? [])
      .filter((item) => {
        const it = item as unknown as Record<string, unknown>;
        return "dividends" in it && it.dividends != null;
      })
      .map((item) => {
        const it = item as unknown as Record<string, unknown>;
        return {
          date:   new Date(it["date"] as Date).toISOString().slice(0, 10),
          amount: safeNum(it["dividends"]) ?? 0,
        };
      })
      .filter((d) => d.amount > 0);
  } catch {
    // optional — no-op
  }

  // ── Current metrics from quoteSummary ─────────────────────────────────────
  const currentPrice =
    safeNum(price?.["regularMarketPrice"]) ?? safeNum(summaryDetail?.["open"]) ?? null;
  const marketCap =
    safeNum(price?.["marketCap"]) ?? safeNum(summaryDetail?.["marketCap"]) ?? null;
  const peRatio        = safeNum(summaryDetail?.["trailingPE"]) ?? null;
  const dividendYield  = safeNum(summaryDetail?.["dividendYield"]) ?? null;
  const currentShares  =
    safeNum(keyStats?.["sharesOutstanding"]) ??
    annuals[annuals.length - 1]?.sharesOutstanding ??
    null;

  const insiderPct =
    safeNum(majorHolders?.["insidersPercentHeld"]) ??
    safeNum(keyStats?.["insiderPercentHeld"]) ??
    null;

  const fcfTTM      = safeNum(financialData?.["freeCashflow"]) ?? null;
  const roicCurrent =
    safeNum(financialData?.["returnOnEquity"]) ??   // prefer ROE as ROIC proxy
    safeNum(financialData?.["returnOnAssets"]) ??
    null;

  // Founder-led: any officer with "Founder" in their title
  const officers   = (assetProfile?.["companyOfficers"] as unknown[] | undefined) ?? [];
  const founderLed = officers.some((o) => {
    const off = o as Record<string, unknown>;
    return typeof off["title"] === "string" && /founder/i.test(off["title"] as string);
  });

  const description =
    typeof assetProfile?.["longBusinessSummary"] === "string"
      ? (assetProfile["longBusinessSummary"] as string)
      : "";

  return {
    ticker:    sym,
    companyName:
      (price?.["longName"]  as string | undefined) ??
      (price?.["shortName"] as string | undefined) ??
      sym,
    sector:   (assetProfile?.["sector"]   as string | undefined) ?? "",
    industry: (assetProfile?.["industry"] as string | undefined) ?? "",
    description,
    currentPrice,
    marketCap,
    peRatio,
    dividendYield,
    currentSharesOutstanding: currentShares,
    insiderOwnershipPct:      insiderPct,
    founderLed,
    annuals,
    priceHistory:    sortedHistory,
    dividendHistory,
    fcfTTM,
    roicCurrent,
    mdaExcerpt: description.slice(0, 4000),
    dataAsOf:   new Date().toISOString(),
  };
}

// ── Utilities used by criteria ────────────────────────────────────────────────

export function cagr(startValue: number, endValue: number, years: number): number | null {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return null;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean     = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export { linearSlope };
