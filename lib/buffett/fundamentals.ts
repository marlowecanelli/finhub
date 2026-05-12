import YahooFinance from "yahoo-finance2";
import type { FundamentalsSnapshot, AnnualFinancial } from "./types";

const yf = new YahooFinance();

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeNum(v: unknown): number | null {
  if (typeof v === "number" && isFinite(v)) return v;
  return null;
}

function safeDate(v: unknown): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
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

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function getFundamentals(ticker: string): Promise<FundamentalsSnapshot | null> {
  const sym = ticker.toUpperCase();

  // Batch fetch all required modules
  const summary = await fetchWithRetry(() =>
    yf.quoteSummary(sym, {
      modules: [
        "assetProfile",
        "summaryDetail",
        "defaultKeyStatistics",
        "financialData",
        "incomeStatementHistory",
        "balanceSheetHistory",
        "cashflowStatementHistory",
        "majorHoldersBreakdown",
        "price",
      ],
      // suppress validation errors on missing/unexpected fields
      validateResult: false,
    } as Parameters<typeof yf.quoteSummary>[1])
  ).catch(() => null);

  if (!summary) return null;

  const assetProfile = summary.assetProfile as Record<string, unknown> | undefined;
  const summaryDetail = summary.summaryDetail as Record<string, unknown> | undefined;
  const keyStats = summary.defaultKeyStatistics as Record<string, unknown> | undefined;
  const financialData = summary.financialData as Record<string, unknown> | undefined;
  const price = summary.price as Record<string, unknown> | undefined;
  const majorHolders = summary.majorHoldersBreakdown as Record<string, unknown> | undefined;

  // ── Income statements ──────────────────────────────────────────────────────
  const rawIncome = (
    (summary.incomeStatementHistory as Record<string, unknown> | undefined)
      ?.incomeStatementHistory as unknown[]
  ) ?? [];

  // ── Balance sheets ─────────────────────────────────────────────────────────
  const rawBalance = (
    (summary.balanceSheetHistory as Record<string, unknown> | undefined)
      ?.balanceSheetStatements as unknown[]
  ) ?? [];

  // ── Cash flows ─────────────────────────────────────────────────────────────
  const rawCashflow = (
    (summary.cashflowStatementHistory as Record<string, unknown> | undefined)
      ?.cashflowStatements as unknown[]
  ) ?? [];

  if (rawIncome.length < 2) return null; // need at least 2 years

  // ── Build annual records ───────────────────────────────────────────────────
  const annualMap: Map<number, Partial<AnnualFinancial>> = new Map();

  function getOrCreate(year: number): Partial<AnnualFinancial> {
    if (!annualMap.has(year)) annualMap.set(year, { year });
    return annualMap.get(year)!;
  }

  for (const row of rawIncome) {
    const r = row as Record<string, unknown>;
    const endDate = safeDate(r.endDate);
    if (!endDate) continue;
    const year = endDate.getFullYear();
    const rec = getOrCreate(year);
    const revenue = safeNum(r.totalRevenue);
    const netIncome = safeNum(r.netIncome);
    const grossProfit = safeNum(r.grossProfit);
    const eps = safeNum(r.dilutedEps) ?? safeNum(r.basicEps);
    rec.revenue = revenue;
    rec.netIncome = netIncome;
    rec.grossProfit = grossProfit;
    rec.eps = eps;
    rec.netMargin = revenue && revenue !== 0 && netIncome != null ? netIncome / revenue : null;
    rec.grossMargin = revenue && revenue !== 0 && grossProfit != null ? grossProfit / revenue : null;
  }

  for (const row of rawBalance) {
    const r = row as Record<string, unknown>;
    const endDate = safeDate(r.endDate);
    if (!endDate) continue;
    const year = endDate.getFullYear();
    const rec = getOrCreate(year);
    const equity = safeNum(r.totalStockholdersEquity);
    const longTermDebt = safeNum(r.longTermDebt);
    const totalDebt = safeNum(r.totalDebt) ?? (longTermDebt ?? 0);
    const shares = safeNum(r.commonStock) ?? safeNum(r.commonSharesOutstanding);
    rec.equity = equity;
    rec.totalDebt = totalDebt;
    rec.longTermDebt = longTermDebt;
    rec.sharesOutstanding = shares;
    // ROE
    if (rec.netIncome != null && equity && equity !== 0) {
      rec.roe = rec.netIncome / equity;
    }
  }

  for (const row of rawCashflow) {
    const r = row as Record<string, unknown>;
    const endDate = safeDate(r.endDate);
    if (!endDate) continue;
    const year = endDate.getFullYear();
    const rec = getOrCreate(year);
    const ocf = safeNum(r.totalCashFromOperatingActivities);
    const capex = safeNum(r.capitalExpenditures);
    const sbc = safeNum(r.stockBasedCompensation);
    rec.operatingCashFlow = ocf;
    rec.capex = capex;
    rec.sbc = sbc;
    rec.fcf = ocf != null && capex != null ? ocf + capex : ocf ?? null; // capex is negative in Yahoo
    // ROIC approximation
    if (rec.netIncome != null && rec.equity != null) {
      const ie = safeNum(r.interestExpense) ?? 0;
      rec.roic = computeROIC(rec.netIncome, ie, 0.21, rec.totalDebt ?? 0, rec.equity);
    }
  }

  // Sort annuals oldest-first
  const annuals: AnnualFinancial[] = Array.from(annualMap.values())
    .filter((a) => a.year != null)
    .sort((a, b) => a.year! - b.year!)
    .map((a) => ({
      year: a.year ?? 0,
      revenue: a.revenue ?? null,
      netIncome: a.netIncome ?? null,
      grossProfit: a.grossProfit ?? null,
      eps: a.eps ?? null,
      netMargin: a.netMargin ?? null,
      grossMargin: a.grossMargin ?? null,
      operatingCashFlow: a.operatingCashFlow ?? null,
      capex: a.capex ?? null,
      fcf: a.fcf ?? null,
      totalDebt: a.totalDebt ?? null,
      longTermDebt: a.longTermDebt ?? null,
      equity: a.equity ?? null,
      roe: a.roe ?? null,
      sharesOutstanding: a.sharesOutstanding ?? null,
      sbc: a.sbc ?? null,
      roic: a.roic ?? null,
    }));

  if (annuals.length < 2) return null;

  // ── Price history (5Y weekly) ──────────────────────────────────────────────
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const priceHistory = await fetchWithRetry(() =>
    yf.historical(sym, { period1: fiveYearsAgo, interval: "1wk" })
  ).catch(() => []);

  const sortedHistory = (priceHistory ?? [])
    .filter((p) => p.close != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p) => ({
      date: new Date(p.date).toISOString().slice(0, 10),
      close: p.close!,
    }));

  // ── Dividend history ───────────────────────────────────────────────────────
  let dividendHistory: { date: string; amount: number }[] = [];
  try {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const divRaw = await fetchWithRetry(() =>
      yf.historical(sym, {
        period1: tenYearsAgo,
        interval: "1mo",
        events: "dividends",
      })
    ).catch(() => []);

    dividendHistory = (divRaw ?? [])
      .filter((item) => {
        const it = item as unknown as Record<string, unknown>;
        return "dividends" in it && it.dividends != null;
      })
      .map((item) => {
        const it = item as unknown as Record<string, unknown>;
        return {
          date: new Date(it.date as Date).toISOString().slice(0, 10),
          amount: safeNum(it.dividends) ?? 0,
        };
      })
      .filter((d) => d.amount > 0);
  } catch {
    // dividend history optional
  }

  // ── Current metrics ────────────────────────────────────────────────────────
  const currentPrice =
    safeNum(price?.regularMarketPrice) ?? safeNum(summaryDetail?.open) ?? null;
  const marketCap = safeNum(price?.marketCap) ?? safeNum(summaryDetail?.marketCap) ?? null;
  const peRatio = safeNum(summaryDetail?.trailingPE) ?? null;
  const dividendYield = safeNum(summaryDetail?.dividendYield) ?? null;
  const currentShares =
    safeNum(keyStats?.sharesOutstanding) ??
    annuals[annuals.length - 1]?.sharesOutstanding ??
    null;

  const insiderPct =
    safeNum((majorHolders as Record<string, unknown> | undefined)?.insidersPercentHeld) ??
    safeNum(keyStats?.insiderPercentHeld) ??
    null;

  const fcfTTM = safeNum(financialData?.freeCashflow) ?? null;
  const roicCurrent = safeNum(financialData?.returnOnAssets) ?? null; // fallback if not available

  // Founder-led heuristic: check if any officer has "Founder" in title
  const officers = (assetProfile?.companyOfficers as unknown[] | undefined) ?? [];
  const founderLed = officers.some((o) => {
    const off = o as Record<string, unknown>;
    return typeof off.title === "string" && /founder/i.test(off.title);
  });

  // ── MD&A excerpt for AI criterion ─────────────────────────────────────────
  const description = typeof assetProfile?.longBusinessSummary === "string"
    ? (assetProfile.longBusinessSummary as string)
    : "";

  return {
    ticker: sym,
    companyName:
      (price?.longName as string) ??
      (price?.shortName as string) ??
      sym,
    sector: (assetProfile?.sector as string) ?? "",
    industry: (assetProfile?.industry as string) ?? "",
    description,
    currentPrice,
    marketCap,
    peRatio,
    dividendYield,
    currentSharesOutstanding: currentShares,
    insiderOwnershipPct: insiderPct,
    founderLed,
    annuals,
    priceHistory: sortedHistory,
    dividendHistory,
    fcfTTM,
    roicCurrent,
    mdaExcerpt: description.slice(0, 4000),
    dataAsOf: new Date().toISOString(),
  };
}

// ── Utilities used by criteria ────────────────────────────────────────────────

export function cagr(
  startValue: number,
  endValue: number,
  years: number
): number | null {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return null;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export { linearSlope };
