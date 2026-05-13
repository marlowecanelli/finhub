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
  correlation,
  drawdownStats,
  historicalVaR,
  informationRatio,
  parametricVaR,
  pricesFromReturns,
  rollingSharpe,
  sharpeRatio,
  simpleReturns,
  sortinoRatio,
  STRESS_SCENARIOS,
  trackingError,
  type PricePoint,
} from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BENCHMARK  = "SPY";
const RATE_PROXY = "IEF"; // 7-10Y Treasury ETF — rate sensitivity proxy

type Params = { params: { symbol: string } };

export async function GET(_req: Request, { params }: Params) {
  const sym = params.symbol.toUpperCase();

  const [stockPts, benchPts, ratePts] = await Promise.all([
    getHistory(sym, "5Y").catch((): PricePoint[] => []),
    getHistory(BENCHMARK, "5Y").catch((): PricePoint[] => []),
    getHistory(RATE_PROXY, "5Y").catch((): PricePoint[] => []),
  ]);

  if (stockPts.length < 60) {
    return NextResponse.json(
      { error: "Not enough price history for analytics (need ≥60 days)" },
      { status: 422 }
    );
  }

  // Align all three series on common trading dates
  const { ts, aligned } = alignSeries({
    stock: stockPts,
    bench: benchPts,
    rate:  ratePts,
  });

  if (ts.length < 60) {
    return NextResponse.json(
      { error: "Not enough overlapping history with benchmark" },
      { status: 422 }
    );
  }

  const stockRet = simpleReturns(aligned.stock!);
  const benchRet = simpleReturns(aligned.bench!);
  const rateRet  = simpleReturns(aligned.rate!);

  // ----- Performance -----
  const annReturn     = annualizedReturn(stockRet);
  const annVol        = annualizedVol(stockRet);
  const benchAnnReturn = annualizedReturn(benchRet);
  const benchAnnVol   = annualizedVol(benchRet);

  const dd        = drawdownStats(pricesFromReturns(stockRet));
  const benchDD   = drawdownStats(pricesFromReturns(benchRet));

  const sharpe    = sharpeRatio(stockRet);
  const sortino   = sortinoRatio(stockRet);
  const calmar    = calmarRatio(stockRet, dd.maxDrawdown);
  const benchSharpe = sharpeRatio(benchRet);

  // ----- Factor -----
  const stockBeta  = betaFn(stockRet, benchRet);
  const stockAlpha = alphaFn(stockRet, benchRet, undefined, stockBeta);
  const te         = trackingError(stockRet, benchRet);
  const ir         = informationRatio(stockRet, benchRet);
  const corrSPY    = correlation(stockRet, benchRet);
  const rateBeta   = betaFn(stockRet, rateRet); // +ve = bond-like (long duration)

  // ----- VaR / CVaR (1-day, expressed as fraction loss) -----
  const var95Hist  = historicalVaR(stockRet, 0.95);
  const var99Hist  = historicalVaR(stockRet, 0.99);
  const var95Param = parametricVaR(stockRet, 0.95);
  const var99Param = parametricVaR(stockRet, 0.99);
  const cvar95     = conditionalVaR(stockRet, 0.95);
  const cvar99     = conditionalVaR(stockRet, 0.99);

  // ----- Rolling Sharpe (60-day window) -----
  const rolling   = rollingSharpe(stockRet, 60);
  // ts has ts.length entries, returns has ts.length-1 entries
  const rollingTs = rolling.map((r) => ({
    t: ts[r.idx + 1] ?? ts[ts.length - 1]!,
    v: r.value,
  }));

  // ----- Drawdown series with timestamps -----
  // pricesFromReturns prepends 1.0, so series length === ts.length
  const ddTs = dd.series.map((v, i) => ({
    t: ts[i] ?? ts[ts.length - 1]!,
    v,
  }));

  // ----- Stress tests (β-weighted benchmark shocks) -----
  const stress = STRESS_SCENARIOS.map((s) => ({
    name:            s.name,
    period:          s.period,
    description:     s.description,
    benchShock:      s.spyReturn,
    estimatedReturn: stockBeta * s.spyReturn,
  }));

  return NextResponse.json({
    meta: {
      symbol:      sym,
      benchmark:   BENCHMARK,
      ratesProxy:  RATE_PROXY,
      sampleSize:  stockRet.length,
      startDate:   ts[0],
      endDate:     ts[ts.length - 1],
    },
    summary: {
      annualReturn:       annReturn,
      annualVol:          annVol,
      sharpe,
      sortino,
      calmar,
      maxDrawdown:         dd.maxDrawdown,
      maxDrawdownPeak:     ts[dd.peakIdx]   ?? null,
      maxDrawdownTrough:   ts[dd.troughIdx] ?? null,
      maxDrawdownRecovery: dd.recoveryIdx != null ? (ts[dd.recoveryIdx] ?? null) : null,
      benchAnnualReturn:   benchAnnReturn,
      benchAnnualVol:      benchAnnVol,
      benchSharpe,
      benchMaxDrawdown:    benchDD.maxDrawdown,
    },
    factor: {
      beta:            stockBeta,
      alpha:           stockAlpha,
      trackingError:   te,
      informationRatio: ir,
      correlationSPY:  corrSPY,
      rateBeta,
    },
    var: {
      var95Hist, var99Hist,
      var95Param, var99Param,
      cvar95, cvar99,
    },
    series: {
      drawdown:     ddTs,
      rollingSharpe: rollingTs,
    },
    stress,
  });
}
