/**
 * Portfolio analytics. Pure functions, deterministic, server- and client-safe.
 *
 * Conventions:
 *   - Returns are simple daily returns: r_t = P_t / P_{t-1} - 1
 *   - 252 trading days per year for annualization
 *   - Risk-free rate is annual; converted to daily via /252 when needed
 *   - All ratios are annualized unless otherwise noted
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TRADING_DAYS = 252;
export const DEFAULT_RF_ANNUAL = 0.045; // ~13-week T-bill ballpark

export const STRESS_SCENARIOS: ReadonlyArray<{
  name: string;
  period: string;
  spyReturn: number; // benchmark return during the window
  description: string;
}> = [
  { name: "GFC 2008",        period: "Sep 2008 – Mar 2009", spyReturn: -0.502, description: "Lehman, credit freeze" },
  { name: "COVID Crash",     period: "Feb – Mar 2020",      spyReturn: -0.339, description: "Pandemic shutdowns" },
  { name: "2022 Drawdown",   period: "Jan – Oct 2022",      spyReturn: -0.246, description: "Fed hiking cycle" },
  { name: "Dot-Com Bust",    period: "Mar 2000 – Oct 2002", spyReturn: -0.491, description: "Tech bubble unwind" },
  { name: "Black Monday",    period: "Oct 19, 1987",        spyReturn: -0.204, description: "Single-day shock" },
  { name: "Volmageddon 2018",period: "Jan – Feb 2018",      spyReturn: -0.101, description: "VIX spike" },
] as const;

// ---------------------------------------------------------------------------
// Basic statistics
// ---------------------------------------------------------------------------

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/** Sample standard deviation (Bessel-corrected). */
export function stdDev(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) ** 2;
  return Math.sqrt(s / (n - 1));
}

/** Downside deviation: std dev of returns below a target (default 0). */
export function downsideStdDev(xs: number[], target = 0): number {
  const n = xs.length;
  if (n < 2) return 0;
  let s = 0;
  let count = 0;
  for (const x of xs) {
    if (x < target) {
      s += (x - target) ** 2;
      count++;
    }
  }
  if (count < 2) return 0;
  return Math.sqrt(s / (count - 1));
}

export function covariance(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let s = 0;
  for (let i = 0; i < n; i++) s += (xs[i]! - mx) * (ys[i]! - my);
  return s / (n - 1);
}

export function correlation(xs: number[], ys: number[]): number {
  const sx = stdDev(xs);
  const sy = stdDev(ys);
  if (sx === 0 || sy === 0) return 0;
  return covariance(xs, ys) / (sx * sy);
}

// ---------------------------------------------------------------------------
// Returns + alignment
// ---------------------------------------------------------------------------

export type PricePoint = { t: number; c: number };

export function simpleReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const a = prices[i - 1]!;
    const b = prices[i]!;
    if (a > 0) out.push(b / a - 1);
  }
  return out;
}

/**
 * Align price series across a common set of timestamps. Uses the union of
 * timestamps and forward-fills the latest known price for each symbol.
 * Drops any leading timestamps where one or more symbols have no price yet.
 */
export function alignSeries(
  byKey: Record<string, PricePoint[]>
): { ts: number[]; aligned: Record<string, number[]> } {
  const keys = Object.keys(byKey);
  if (keys.length === 0) return { ts: [], aligned: {} };

  const tsSet = new Set<number>();
  for (const k of keys) for (const p of byKey[k]!) tsSet.add(p.t);
  const allTs = Array.from(tsSet).sort((a, b) => a - b);

  const idx: Record<string, number> = {};
  const last: Record<string, number | null> = {};
  for (const k of keys) {
    idx[k] = 0;
    last[k] = null;
  }

  const tsKept: number[] = [];
  const aligned: Record<string, number[]> = Object.fromEntries(keys.map((k) => [k, []]));

  for (const t of allTs) {
    for (const k of keys) {
      const series = byKey[k]!;
      while (idx[k]! < series.length && series[idx[k]!]!.t <= t) {
        last[k] = series[idx[k]!]!.c;
        idx[k]!++;
      }
    }
    if (keys.every((k) => last[k] != null)) {
      tsKept.push(t);
      for (const k of keys) aligned[k]!.push(last[k]!);
    }
  }

  return { ts: tsKept, aligned };
}

/**
 * Build portfolio-level daily returns from weighted constituent returns.
 * Assumes weights are constant (rebalanced to target each day) — standard
 * simplifying assumption for ex-ante risk analytics.
 */
export function portfolioReturns(weights: number[], assetReturns: number[][]): number[] {
  if (assetReturns.length === 0) return [];
  const n = assetReturns[0]!.length;
  const out: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let r = 0;
    for (let j = 0; j < weights.length; j++) {
      r += weights[j]! * (assetReturns[j]![i] ?? 0);
    }
    out[i] = r;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Performance & risk-adjusted return
// ---------------------------------------------------------------------------

/** Annualized arithmetic return from daily returns. */
export function annualizedReturn(returns: number[]): number {
  return mean(returns) * TRADING_DAYS;
}

/** Annualized volatility from daily returns. */
export function annualizedVol(returns: number[]): number {
  return stdDev(returns) * Math.sqrt(TRADING_DAYS);
}

/** Annualized Sharpe = (E[r] - rf) / σ, all annualized. */
export function sharpeRatio(returns: number[], rfAnnual = DEFAULT_RF_ANNUAL): number {
  const rfDaily = rfAnnual / TRADING_DAYS;
  const sd = stdDev(returns);
  if (sd === 0) return 0;
  return ((mean(returns) - rfDaily) / sd) * Math.sqrt(TRADING_DAYS);
}

/** Annualized Sortino — like Sharpe but uses downside deviation. */
export function sortinoRatio(returns: number[], rfAnnual = DEFAULT_RF_ANNUAL): number {
  const rfDaily = rfAnnual / TRADING_DAYS;
  const dd = downsideStdDev(returns, rfDaily);
  if (dd === 0) return 0;
  return ((mean(returns) - rfDaily) / dd) * Math.sqrt(TRADING_DAYS);
}

/** Calmar = annualized return / |max drawdown|. */
export function calmarRatio(returns: number[], maxDDFraction: number): number {
  if (maxDDFraction === 0) return 0;
  return annualizedReturn(returns) / Math.abs(maxDDFraction);
}

// ---------------------------------------------------------------------------
// Drawdown
// ---------------------------------------------------------------------------

export type DrawdownStats = {
  /** Negative number, e.g. -0.34 for a 34% drawdown */
  maxDrawdown: number;
  peakIdx: number;
  troughIdx: number;
  /** Index where running peak was matched again, or null if not recovered. */
  recoveryIdx: number | null;
  /** Drawdown at each timestamp (≤ 0). */
  series: number[];
};

/**
 * Compute drawdown statistics from a price series. The series is rebased
 * internally (only ratios matter), so any scaling is fine.
 */
export function drawdownStats(prices: number[]): DrawdownStats {
  const n = prices.length;
  const series: number[] = new Array(n).fill(0);
  if (n === 0) {
    return { maxDrawdown: 0, peakIdx: 0, troughIdx: 0, recoveryIdx: null, series };
  }

  let peak = prices[0]!;
  let peakIdx = 0;
  let maxDD = 0;
  let mdPeakIdx = 0;
  let mdTroughIdx = 0;

  for (let i = 0; i < n; i++) {
    const p = prices[i]!;
    if (p > peak) {
      peak = p;
      peakIdx = i;
    }
    const dd = peak > 0 ? p / peak - 1 : 0;
    series[i] = dd;
    if (dd < maxDD) {
      maxDD = dd;
      mdPeakIdx = peakIdx;
      mdTroughIdx = i;
    }
  }

  let recoveryIdx: number | null = null;
  const peakValue = prices[mdPeakIdx]!;
  for (let i = mdTroughIdx + 1; i < n; i++) {
    if (prices[i]! >= peakValue) {
      recoveryIdx = i;
      break;
    }
  }

  return { maxDrawdown: maxDD, peakIdx: mdPeakIdx, troughIdx: mdTroughIdx, recoveryIdx, series };
}

/** Synthesize a price series from daily returns, starting at 1.0. */
export function pricesFromReturns(returns: number[]): number[] {
  const out: number[] = [1];
  for (const r of returns) out.push(out[out.length - 1]! * (1 + r));
  return out;
}

// ---------------------------------------------------------------------------
// Beta / Alpha / Tracking error
// ---------------------------------------------------------------------------

/** CAPM-style beta of portfolio vs benchmark. */
export function beta(portReturns: number[], benchReturns: number[]): number {
  const v = stdDev(benchReturns);
  if (v === 0) return 0;
  return covariance(portReturns, benchReturns) / (v * v);
}

/** Annualized CAPM alpha: r_p - [rf + β·(r_b - rf)]. */
export function alpha(
  portReturns: number[],
  benchReturns: number[],
  rfAnnual = DEFAULT_RF_ANNUAL,
  betaValue?: number
): number {
  const b = betaValue ?? beta(portReturns, benchReturns);
  const rp = annualizedReturn(portReturns);
  const rb = annualizedReturn(benchReturns);
  return rp - (rfAnnual + b * (rb - rfAnnual));
}

/** Annualized tracking error: std(r_p - r_b) · √252. */
export function trackingError(portReturns: number[], benchReturns: number[]): number {
  const n = Math.min(portReturns.length, benchReturns.length);
  const diff: number[] = [];
  for (let i = 0; i < n; i++) diff.push(portReturns[i]! - benchReturns[i]!);
  return stdDev(diff) * Math.sqrt(TRADING_DAYS);
}

/** Annualized Information Ratio = (r_p - r_b) / TE. */
export function informationRatio(portReturns: number[], benchReturns: number[]): number {
  const te = trackingError(portReturns, benchReturns);
  if (te === 0) return 0;
  const excess = annualizedReturn(portReturns) - annualizedReturn(benchReturns);
  return excess / te;
}

// ---------------------------------------------------------------------------
// VaR / CVaR
// ---------------------------------------------------------------------------

/**
 * Historical VaR. Returns the absolute-value loss at the (1 − confidence)
 * left tail of the empirical return distribution. e.g. confidence=0.95 →
 * 5th percentile of returns, returned as a positive number.
 */
export function historicalVaR(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const q = 1 - confidence;
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(q * sorted.length)));
  const v = sorted[idx]!;
  return v < 0 ? -v : 0;
}

/** Parametric (Gaussian) VaR. */
export function parametricVaR(returns: number[], confidence: number): number {
  if (returns.length < 2) return 0;
  const m = mean(returns);
  const s = stdDev(returns);
  const z = inverseNormalCDF(1 - confidence);
  const loss = -(m + z * s);
  return loss > 0 ? loss : 0;
}

/** Conditional VaR (Expected Shortfall) — average loss in the tail. */
export function conditionalVaR(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.max(1, Math.floor((1 - confidence) * sorted.length));
  let s = 0;
  for (let i = 0; i < cutoff; i++) s += sorted[i]!;
  const avg = s / cutoff;
  return avg < 0 ? -avg : 0;
}

/**
 * Acklam-style approximation of the inverse normal CDF.
 * Accurate to ~1e-9 across the support.
 */
export function inverseNormalCDF(p: number): number {
  if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number, r: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  q = p - 0.5;
  r = q * q;
  return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
}

// ---------------------------------------------------------------------------
// Composition: correlation, covariance, risk contribution
// ---------------------------------------------------------------------------

export function correlationMatrix(returnsByAsset: number[][]): number[][] {
  const n = returnsByAsset.length;
  const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    m[i]![i] = 1;
    for (let j = i + 1; j < n; j++) {
      const c = correlation(returnsByAsset[i]!, returnsByAsset[j]!);
      m[i]![j] = c;
      m[j]![i] = c;
    }
  }
  return m;
}

export function covarianceMatrix(returnsByAsset: number[][]): number[][] {
  const n = returnsByAsset.length;
  const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const c = i === j ? stdDev(returnsByAsset[i]!) ** 2 : covariance(returnsByAsset[i]!, returnsByAsset[j]!);
      m[i]![j] = c;
      m[j]![i] = c;
    }
  }
  return m;
}

/**
 * Euler decomposition of portfolio variance. Returns each asset's % share
 * of total portfolio risk (sums to 1.0). Negative contributions possible
 * for hedging assets.
 */
export function riskContribution(weights: number[], cov: number[][]): number[] {
  const n = weights.length;
  // marginal_i = (Cov · w)_i
  const marginal: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) marginal[i]! += cov[i]![j]! * weights[j]!;
  }
  let portVar = 0;
  for (let i = 0; i < n; i++) portVar += weights[i]! * marginal[i]!;
  if (portVar <= 0) return new Array(n).fill(1 / n);
  return weights.map((w, i) => (w * marginal[i]!) / portVar);
}

/**
 * Diversification ratio: (Σ w_i · σ_i) / σ_p. >1 means diversification benefit;
 * 1.0 means no benefit (all assets perfectly correlated).
 */
export function diversificationRatio(
  weights: number[],
  assetVols: number[],
  portfolioVol: number
): number {
  if (portfolioVol === 0) return 1;
  let weighted = 0;
  for (let i = 0; i < weights.length; i++) weighted += weights[i]! * assetVols[i]!;
  return weighted / portfolioVol;
}

// ---------------------------------------------------------------------------
// Rolling stats
// ---------------------------------------------------------------------------

export function rollingSharpe(
  returns: number[],
  windowDays: number,
  rfAnnual = DEFAULT_RF_ANNUAL
): { idx: number; value: number }[] {
  const out: { idx: number; value: number }[] = [];
  if (returns.length < windowDays) return out;
  for (let i = windowDays; i <= returns.length; i++) {
    const win = returns.slice(i - windowDays, i);
    out.push({ idx: i - 1, value: sharpeRatio(win, rfAnnual) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Concentration (Herfindahl)
// ---------------------------------------------------------------------------

/**
 * Herfindahl-Hirschman Index of weights, returned on 0–1 scale.
 * 1/N = perfectly diversified across N assets; 1.0 = single-asset.
 */
export function herfindahl(weights: number[]): number {
  let h = 0;
  for (const w of weights) h += w * w;
  return h;
}

/** Effective number of bets = 1 / HHI. */
export function effectiveBets(weights: number[]): number {
  const h = herfindahl(weights);
  return h > 0 ? 1 / h : 0;
}
