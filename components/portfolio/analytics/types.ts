export type AnalyticsResponse = {
  meta: {
    sampleSize: number;
    startDate: number;
    endDate: number;
    benchmark: string;
    ratesProxy: string;
    rfAnnual: number;
    droppedSymbols: string[];
  };
  summary: {
    annualReturn: number;
    annualVol: number;
    sharpe: number;
    sortino: number;
    calmar: number;
    maxDrawdown: number;
    maxDrawdownPeak: number | null;
    maxDrawdownTrough: number | null;
    maxDrawdownRecovery: number | null;
    benchAnnualReturn: number;
    benchAnnualVol: number;
    benchSharpe: number;
    benchMaxDrawdown: number;
  };
  factor: {
    beta: number;
    alpha: number;
    trackingError: number;
    informationRatio: number;
    rateBeta: number;
  };
  var: {
    var95Hist: number;
    var99Hist: number;
    var95Param: number;
    var99Param: number;
    cvar95: number;
    cvar99: number;
  };
  composition: {
    symbols: string[];
    weights: number[];
    correlationMatrix: number[][];
    diversificationRatio: number;
    herfindahl: number;
    effectiveBets: number;
    top1Weight: number;
    top3Weight: number;
    top5Weight: number;
  };
  perAsset: Array<{
    symbol: string;
    weight: number;
    annualReturn: number;
    annualVol: number;
    sharpe: number;
    beta: number;
    correlationToPortfolio: number;
    riskContributionPct: number;
    maxDrawdown: number;
  }>;
  series: {
    drawdown: { t: number; v: number }[];
    rollingSharpe: { t: number; v: number }[];
  };
  stress: Array<{
    name: string;
    period: string;
    description: string;
    benchShock: number;
    estimatedReturn: number;
  }>;
};

export type AnalyticsPosition = { symbol: string; value: number };
