import type { Dividend, Holding, PricePoint, StressScenarioResult, Scenario } from "./types";

export type TimeMachineInput = {
  amount: number;
  reinvestDividends: boolean;
  prices: PricePoint[];
  dividends: Dividend[];
  benchmark: PricePoint[];
};

export type TimeMachineCalc = {
  finalValue: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
  sharesToday: number;
  dividendsEarned: number;
  series: PricePoint[];
  benchmarkSeries: PricePoint[];
  benchmarkFinalValue: number;
};

function priceOnOrAfter(prices: PricePoint[], date: string): number | null {
  for (const p of prices) {
    if (p.date >= date) return p.close;
  }
  return null;
}

export function calcTimeMachine(input: TimeMachineInput): TimeMachineCalc {
  const { amount, reinvestDividends, prices, dividends, benchmark } = input;
  if (prices.length === 0) {
    return {
      finalValue: 0,
      totalReturnPct: 0,
      annualizedReturnPct: 0,
      sharesToday: 0,
      dividendsEarned: 0,
      series: [],
      benchmarkSeries: [],
      benchmarkFinalValue: 0,
    };
  }
  const start = prices[0]!;
  const end = prices[prices.length - 1]!;
  let shares = amount / start.close;
  let dividendsEarned = 0;

  // Build a date->price map for dividend reinvestment
  const priceMap = new Map(prices.map((p) => [p.date, p.close]));

  for (const div of dividends) {
    if (div.date < start.date || div.date > end.date) continue;
    const cash = shares * div.amount;
    dividendsEarned += cash;
    if (reinvestDividends) {
      const px = priceMap.get(div.date) ?? priceOnOrAfter(prices, div.date);
      if (px && px > 0) shares += cash / px;
    }
  }

  const finalValue = reinvestDividends
    ? shares * end.close
    : shares * end.close + dividendsEarned;

  const totalReturnPct = ((finalValue - amount) / amount) * 100;
  const startTime = new Date(start.date).getTime();
  const endTime = new Date(end.date).getTime();
  const years = Math.max((endTime - startTime) / (365.25 * 24 * 3600 * 1000), 1 / 365);
  const annualizedReturnPct = (Math.pow(finalValue / amount, 1 / years) - 1) * 100;

  // Normalize ticker series to dollar value of investment
  const series: PricePoint[] = prices.map((p) => ({
    date: p.date,
    close: (p.close / start.close) * amount,
  }));

  // Benchmark normalized to same starting investment
  const benchStart = benchmark[0]?.close ?? 1;
  const benchmarkSeries: PricePoint[] = benchmark.map((p) => ({
    date: p.date,
    close: (p.close / benchStart) * amount,
  }));
  const benchmarkFinalValue = benchmarkSeries.length
    ? benchmarkSeries[benchmarkSeries.length - 1]!.close
    : 0;

  return {
    finalValue,
    totalReturnPct,
    annualizedReturnPct,
    sharesToday: shares,
    dividendsEarned,
    series,
    benchmarkSeries,
    benchmarkFinalValue,
  };
}

// ---------- Stress test ----------

export type HoldingPrices = {
  ticker: string;
  weight: number;
  prices: PricePoint[]; // for the scenario window
  recoveryPrices: PricePoint[]; // extended window through today
};

export function alignByDate(seriesList: PricePoint[][]): string[] {
  if (seriesList.length === 0) return [];
  const sets = seriesList.map((s) => new Set(s.map((p) => p.date)));
  const base = seriesList[0]!;
  return base.map((p) => p.date).filter((d) => sets.every((s) => s.has(d)));
}

export function buildPortfolioSeries(
  holdings: HoldingPrices[],
  useRecovery = false
): PricePoint[] {
  const list = holdings.map((h) => (useRecovery ? h.recoveryPrices : h.prices));
  const dates = alignByDate(list);
  if (dates.length === 0) return [];

  const startPriceByTicker: Record<string, number> = {};
  for (const h of holdings) {
    const series = useRecovery ? h.recoveryPrices : h.prices;
    const startIdx = series.findIndex((p) => p.date === dates[0]);
    startPriceByTicker[h.ticker] = series[startIdx]?.close ?? 1;
  }

  return dates.map((d) => {
    let val = 0;
    for (const h of holdings) {
      const series = useRecovery ? h.recoveryPrices : h.prices;
      const point = series.find((p) => p.date === d);
      if (!point) continue;
      const norm = point.close / (startPriceByTicker[h.ticker] ?? 1);
      val += h.weight * norm;
    }
    return { date: d, close: val };
  });
}

export function calcStress(
  scenario: Scenario,
  holdings: HoldingPrices[],
  benchmark: PricePoint[]
): Omit<StressScenarioResult, "scenario"> & { scenario: Scenario } {
  const portfolio = buildPortfolioSeries(holdings, false);
  const recovery = buildPortfolioSeries(holdings, true);

  if (portfolio.length === 0) {
    return {
      scenario,
      series: [],
      benchmarkSeries: [],
      startValue: 0,
      endValue: 0,
      bottomValue: 0,
      bottomDate: scenario.start,
      recoveryDate: null,
      daysToBottom: 0,
      daysToRecovery: null,
      drawdownPct: 0,
      worstDay: null,
      holdings: [],
    };
  }

  const startValue = portfolio[0]!.close;

  // Find bottom in scenario window
  let bottomIdx = 0;
  for (let i = 1; i < portfolio.length; i++) {
    if (portfolio[i]!.close < portfolio[bottomIdx]!.close) bottomIdx = i;
  }
  const bottom = portfolio[bottomIdx]!;
  const drawdownPct = ((bottom.close - startValue) / startValue) * 100;

  // Recovery: continue past scenario end using recovery series
  let recoveryDate: string | null = null;
  if (recovery.length > 0) {
    const bottomDateInRecovery = recovery.findIndex((p) => p.date >= bottom.date);
    if (bottomDateInRecovery >= 0) {
      const startNorm = recovery[0]!.close;
      for (let i = bottomDateInRecovery; i < recovery.length; i++) {
        if (recovery[i]!.close >= startNorm) {
          recoveryDate = recovery[i]!.date;
          break;
        }
      }
    }
  }

  const daysBetween = (a: string, b: string) =>
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / (24 * 3600 * 1000));

  // Worst single day
  let worstDay: { date: string; pct: number } | null = null;
  for (let i = 1; i < portfolio.length; i++) {
    const cur = portfolio[i]!;
    const prev = portfolio[i - 1]!;
    const pct = ((cur.close - prev.close) / prev.close) * 100;
    if (!worstDay || pct < worstDay.pct) {
      worstDay = { date: cur.date, pct };
    }
  }

  // Per-holding loss & contribution
  const totalDrawdown = Math.abs(drawdownPct);
  const holdingResults = holdings.map((h) => {
    const series = h.prices;
    if (series.length === 0) {
      return {
        ticker: h.ticker,
        weight: h.weight,
        lossPct: 0,
        recoveryDays: null as number | null,
        contributionToDrawdown: 0,
      };
    }
    const sStart = series[0]!.close;
    let sBottomIdx = 0;
    for (let i = 1; i < series.length; i++) {
      if (series[i]!.close < series[sBottomIdx]!.close) sBottomIdx = i;
    }
    const sBottom = series[sBottomIdx]!;
    const lossPct = ((sBottom.close - sStart) / sStart) * 100;

    let rec: number | null = null;
    const fullSeries = h.recoveryPrices;
    if (fullSeries.length > 0) {
      for (let i = 0; i < fullSeries.length; i++) {
        const fp = fullSeries[i]!;
        if (fp.date < sBottom.date) continue;
        if (fp.close >= sStart) {
          rec = daysBetween(sBottom.date, fp.date);
          break;
        }
      }
    }

    const contribution = totalDrawdown > 0 ? (h.weight * Math.abs(lossPct)) / totalDrawdown : 0;
    return {
      ticker: h.ticker,
      weight: h.weight,
      lossPct,
      recoveryDays: rec,
      contributionToDrawdown: contribution,
    };
  });

  // Benchmark normalized to portfolio's starting value (1)
  const benchStart = benchmark[0]?.close ?? 1;
  const benchmarkSeries = benchmark.map((p) => ({
    date: p.date,
    close: p.close / benchStart,
  }));

  return {
    scenario,
    series: portfolio,
    benchmarkSeries,
    startValue,
    endValue: portfolio[portfolio.length - 1]!.close,
    bottomValue: bottom.close,
    bottomDate: bottom.date,
    recoveryDate,
    daysToBottom: daysBetween(portfolio[0]!.date, bottom.date),
    daysToRecovery: recoveryDate ? daysBetween(bottom.date, recoveryDate) : null,
    drawdownPct,
    worstDay,
    holdings: holdingResults,
  };
}

export function parseHoldingsText(text: string): Holding[] {
  const out: Holding[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9.\-^=]+)\s+([\d.]+)\s*%?$/);
    if (!m) continue;
    const w = parseFloat(m[2] ?? "");
    if (!isFinite(w) || w <= 0) continue;
    out.push({ ticker: (m[1] ?? "").toUpperCase(), weight: w });
  }
  const total = out.reduce((s, h) => s + h.weight, 0);
  if (total <= 0) return [];
  return out.map((h) => ({ ...h, weight: h.weight / total }));
}
