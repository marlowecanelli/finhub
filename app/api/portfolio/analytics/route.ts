import { NextResponse } from "next/server";
import { getHistory } from "@/lib/yahoo";
import {
  alignSeries,
  alpha as alphaFn,
  annualizedReturn,
  annualizedVol,
  beta as betaFn,
  calmarRatio,
  conditionalVaR,
  correlationMatrix,
  covarianceMatrix,
  diversificationRatio,
  drawdownStats,
  effectiveBets,
  herfindahl,
  historicalVaR,
  informationRatio,
  parametricVaR,
  pricesFromReturns,
  portfolioReturns,
  riskContribution,
  rollingSharpe,
  sharpeRatio,
  simpleReturns,
  sortinoRatio,
  stdDev,
  STRESS_SCENARIOS,
  TRADING_DAYS,
  trackingError,
  type PricePoint,
} from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BENCHMARK = "SPY";
const RATE_PROXY = "IEF"; // 7-10Y Treasury — used for interest-rate sensitivity beta

type Position = { symbol: string; value: number };

type Body = {
  positions?: Position[];
  /** Annual risk-free rate as decimal (e.g. 0.045 = 4.5%). Optional. */
  rfAnnual?: number;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const positions = (body.positions ?? []).filter(
    (p): p is Position => Boolean(p?.symbol) && typeof p.value === "number" && p.value > 0
  );

  if (positions.length === 0) {
    return NextResponse.json({ error: "No positions provided" }, { status: 400 });
  }

  // Normalize weights
  const totalValue = positions.reduce((s, p) => s + p.value, 0);
  const symbols = positions.map((p) => p.symbol.toUpperCase());
  const weights = positions.map((p) => p.value / totalValue);

  // Fetch 5Y daily history for each holding + SPY benchmark + IEF rate proxy
  const fetchTargets = Array.from(new Set([...symbols, BENCHMARK, RATE_PROXY]));
  const histories = await Promise.all(
    fetchTargets.map(async (sym) => {
      try {
        const points = await getHistory(sym, "5Y");
        return [sym, points] as [string, PricePoint[]];
      } catch {
        return [sym, [] as PricePoint[]] as [string, PricePoint[]];
      }
    })
  );

  const priceMap: Record<string, PricePoint[]> = Object.fromEntries(histories);

  // Drop holdings without data — keep weights of remaining renormalized
  const valid: { symbol: string; weight: number; series: PricePoint[] }[] = [];
  for (let i = 0; i < symbols.length; i++) {
    const s = symbols[i]!;
    const ser = priceMap[s] ?? [];
    if (ser.length > 30) {
      valid.push({ symbol: s, weight: weights[i]!, series: ser });
    }
  }

  if (valid.length === 0) {
    return NextResponse.json({ error: "No price history available for any holding" }, { status: 422 });
  }

  const wSum = valid.reduce((s, v) => s + v.weight, 0);
  for (const v of valid) v.weight = v.weight / wSum;

  // Align all asset series + benchmark on a common date set
  const alignKeys: Record<string, PricePoint[]> = { __bench: priceMap[BENCHMARK] ?? [], __rate: priceMap[RATE_PROXY] ?? [] };
  for (const v of valid) alignKeys[v.symbol] = v.series;

  const { ts, aligned } = alignSeries(alignKeys);

  if (ts.length < 60) {
    return NextResponse.json({ error: "Not enough overlapping price history (need ≥60 days)" }, { status: 422 });
  }

  // Compute returns
  const assetReturns = valid.map((v) => simpleReturns(aligned[v.symbol]!));
  const benchReturns = simpleReturns(aligned.__bench!);
  const rateReturns = simpleReturns(aligned.__rate!);
  const w = valid.map((v) => v.weight);

  const portRet = portfolioReturns(w, assetReturns);

  // ----- Performance -----
  const annReturn = annualizedReturn(portRet);
  const annVol = annualizedVol(portRet);
  const benchAnnReturn = annualizedReturn(benchReturns);
  const benchAnnVol = annualizedVol(benchReturns);

  const dd = drawdownStats(pricesFromReturns(portRet));
  const benchDD = drawdownStats(pricesFromReturns(benchReturns));

  const sharpe = sharpeRatio(portRet);
  const sortino = sortinoRatio(portRet);
  const calmar = calmarRatio(portRet, dd.maxDrawdown);

  const benchSharpe = sharpeRatio(benchReturns);

  const portfolioBeta = betaFn(portRet, benchReturns);
  const portfolioAlpha = alphaFn(portRet, benchReturns, undefined, portfolioBeta);
  const te = trackingError(portRet, benchReturns);
  const ir = informationRatio(portRet, benchReturns);

  // Rate sensitivity: beta vs IEF (7-10Y Treasuries).
  // Positive ⇒ moves with bonds (long duration), negative ⇒ moves opposite (short duration).
  const rateBeta = betaFn(portRet, rateReturns);

  // ----- VaR / CVaR (1-day, expressed as fraction loss) -----
  const var95Hist = historicalVaR(portRet, 0.95);
  const var99Hist = historicalVaR(portRet, 0.99);
  const var95Param = parametricVaR(portRet, 0.95);
  const var99Param = parametricVaR(portRet, 0.99);
  const cvar95 = conditionalVaR(portRet, 0.95);
  const cvar99 = conditionalVaR(portRet, 0.99);

  // ----- Composition -----
  const corrMat = correlationMatrix(assetReturns);
  const covMat = covarianceMatrix(assetReturns);
  const riskContribPct = riskContribution(w, covMat);
  const assetVols = assetReturns.map((r) => stdDev(r) * Math.sqrt(TRADING_DAYS));
  const divRatio = diversificationRatio(w, assetVols, annVol);
  const hhi = herfindahl(w);
  const effBets = effectiveBets(w);

  // ----- Per-asset stats -----
  const perAsset = valid.map((v, i) => ({
    symbol: v.symbol,
    weight: v.weight,
    annualReturn: annualizedReturn(assetReturns[i]!),
    annualVol: assetVols[i]!,
    sharpe: sharpeRatio(assetReturns[i]!),
    beta: betaFn(assetReturns[i]!, benchReturns),
    correlationToPortfolio: 0, // filled below
    riskContributionPct: riskContribPct[i]!,
    maxDrawdown: drawdownStats(pricesFromReturns(assetReturns[i]!)).maxDrawdown,
  }));
  // Correlation of each asset to total portfolio
  for (let i = 0; i < perAsset.length; i++) {
    perAsset[i]!.correlationToPortfolio = correlationToPortfolio(assetReturns[i]!, portRet);
  }

  // ----- Rolling Sharpe (60-day window) -----
  const rolling = rollingSharpe(portRet, 60);
  // Map to (timestamp, value) — ts has ts.length entries, returns has ts.length-1
  // rolling[k].idx is index into returns array
  const rollingTs = rolling.map((r) => ({ t: ts[r.idx + 1] ?? ts[ts.length - 1]!, v: r.value }));

  // ----- Drawdown series with timestamps -----
  // dd.series is over price series of length ts.length (since pricesFromReturns prepends 1.0
  // and we feed it portRet of length ts.length-1 → series length = ts.length)
  const ddTs = dd.series.map((v, i) => ({ t: ts[i] ?? ts[ts.length - 1]!, v }));

  // ----- Stress tests (β-weighted shock) -----
  const stress = STRESS_SCENARIOS.map((s) => ({
    name: s.name,
    period: s.period,
    description: s.description,
    benchShock: s.spyReturn,
    estimatedReturn: portfolioBeta * s.spyReturn,
  }));

  // ----- Concentration: top weights -----
  const sortedByWeight = [...valid].sort((a, b) => b.weight - a.weight);
  const top1 = sortedByWeight[0]?.weight ?? 0;
  const top3 = sortedByWeight.slice(0, 3).reduce((s, x) => s + x.weight, 0);
  const top5 = sortedByWeight.slice(0, 5).reduce((s, x) => s + x.weight, 0);

  return NextResponse.json({
    meta: {
      sampleSize: portRet.length,
      startDate: ts[0],
      endDate: ts[ts.length - 1],
      benchmark: BENCHMARK,
      ratesProxy: RATE_PROXY,
      rfAnnual: body.rfAnnual ?? 0.045,
      droppedSymbols: symbols.filter((s) => !valid.find((v) => v.symbol === s)),
    },
    summary: {
      annualReturn: annReturn,
      annualVol: annVol,
      sharpe,
      sortino,
      calmar,
      maxDrawdown: dd.maxDrawdown,
      maxDrawdownPeak: ts[dd.peakIdx] ?? null,
      maxDrawdownTrough: ts[dd.troughIdx] ?? null,
      maxDrawdownRecovery: dd.recoveryIdx != null ? ts[dd.recoveryIdx] ?? null : null,
      benchAnnualReturn: benchAnnReturn,
      benchAnnualVol: benchAnnVol,
      benchSharpe,
      benchMaxDrawdown: benchDD.maxDrawdown,
    },
    factor: {
      beta: portfolioBeta,
      alpha: portfolioAlpha,
      trackingError: te,
      informationRatio: ir,
      rateBeta,
    },
    var: {
      var95Hist, var99Hist,
      var95Param, var99Param,
      cvar95, cvar99,
    },
    composition: {
      symbols: valid.map((v) => v.symbol),
      weights: w,
      correlationMatrix: corrMat,
      diversificationRatio: divRatio,
      herfindahl: hhi,
      effectiveBets: effBets,
      top1Weight: top1,
      top3Weight: top3,
      top5Weight: top5,
    },
    perAsset,
    series: {
      drawdown: ddTs,
      rollingSharpe: rollingTs,
    },
    stress,
  });
}

function correlationToPortfolio(asset: number[], port: number[]): number {
  const sx = stdDev(asset);
  const sy = stdDev(port);
  if (sx === 0 || sy === 0) return 0;
  const n = Math.min(asset.length, port.length);
  let covXY = 0;
  const mx = asset.reduce((s, x) => s + x, 0) / asset.length;
  const my = port.reduce((s, x) => s + x, 0) / port.length;
  for (let i = 0; i < n; i++) covXY += (asset[i]! - mx) * (port[i]! - my);
  covXY /= n - 1;
  return covXY / (sx * sy);
}
