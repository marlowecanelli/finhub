import { getOrFetch } from "@/lib/cache";
import { fredApiKey, fredObservations, fredSeriesMeta } from "./fred";
import type { MacroSeries, MacroSeriesId, MacroStatus, RecessionPeriod, YieldPoint } from "@/lib/types/research";

interface SeriesConfig {
  id: MacroSeriesId;
  title: string;
  shortTitle: string;
  unit: string;
  formatSuffix: string;
  units?: "lin" | "pch" | "pc1";
  target?: number;
  targetLabel?: string;
  classify: (current: number, target?: number) => MacroStatus;
  interpretation: Record<string, string>;
}

const ABOVE_BELOW = (above: MacroStatus = "ABOVE_TARGET", below: MacroStatus = "BELOW_TARGET") =>
  (cur: number, target?: number): MacroStatus => {
    if (target == null) return "AT_TARGET";
    const diff = cur - target;
    if (Math.abs(diff) < 0.2) return "AT_TARGET";
    return diff > 0 ? above : below;
  };

const CONFIGS: SeriesConfig[] = [
  {
    id: "CPIAUCSL", title: "Consumer Price Index for All Urban Consumers", shortTitle: "CPI YoY",
    unit: "Percent", formatSuffix: "%", units: "pc1", target: 2.0, targetLabel: "Fed 2% target",
    classify: ABOVE_BELOW(),
    interpretation: {
      ABOVE_TARGET: "Inflation above the Fed's 2% target — keeps rates higher for longer.",
      AT_TARGET: "CPI near the Fed's 2% target.",
      BELOW_TARGET: "CPI below target — Fed easing path opens up.",
      RECESSION_RISK: "Sharp disinflation alongside weakening demand.",
    },
  },
  {
    id: "PCEPI", title: "Personal Consumption Expenditures Price Index", shortTitle: "PCE YoY",
    unit: "Percent", formatSuffix: "%", units: "pc1", target: 2.0, targetLabel: "Fed preferred gauge",
    classify: ABOVE_BELOW(),
    interpretation: {
      ABOVE_TARGET: "Above 2% — Fed's preferred metric keeps cuts on hold.",
      AT_TARGET: "PCE at target unlocks Fed flexibility.",
      BELOW_TARGET: "Below-target PCE accelerates easing timeline.",
      RECESSION_RISK: "Collapsing PCE signals demand destruction.",
    },
  },
  {
    id: "UNRATE", title: "Unemployment Rate", shortTitle: "Unemployment",
    unit: "Percent", formatSuffix: "%", target: 4.0, targetLabel: "NAIRU estimate ~4%",
    classify: ABOVE_BELOW(),
    interpretation: {
      AT_TARGET: "Near NAIRU. Tight labor without runaway wage growth.",
      ABOVE_TARGET: "Rising unemployment — softening economy.",
      BELOW_TARGET: "Very tight labor — wage pressure persists.",
      RECESSION_RISK: "Rapid rise — Sahm Rule risk.",
    },
  },
  {
    id: "FEDFUNDS", title: "Federal Funds Effective Rate", shortTitle: "Fed Funds",
    unit: "Percent", formatSuffix: "%", target: 2.5, targetLabel: "Long-run neutral",
    classify: ABOVE_BELOW(),
    interpretation: {
      ABOVE_TARGET: "Restrictive policy. Higher-for-longer pressures multiples.",
      AT_TARGET: "Near neutral. Balanced policy.",
      BELOW_TARGET: "Stimulative policy.",
      RECESSION_RISK: "Emergency cuts underway.",
    },
  },
  {
    id: "T10Y2Y", title: "10-Year Treasury Minus 2-Year Treasury", shortTitle: "Yield Curve (10Y-2Y)",
    unit: "Percent", formatSuffix: "%", target: 0, targetLabel: "Inversion = negative spread",
    classify: (cur) => cur < -0.2 ? "RECESSION_RISK" : cur < 0 ? "BELOW_TARGET" : cur < 0.5 ? "AT_TARGET" : "ABOVE_TARGET",
    interpretation: {
      AT_TARGET: "Flat curve — uncertainty.",
      ABOVE_TARGET: "Normal upward curve. Bullish for banks.",
      BELOW_TARGET: "Mild inversion — bears watching.",
      RECESSION_RISK: "Deep inversion. Recession probability elevated.",
    },
  },
  {
    id: "M2SL", title: "M2 Money Stock", shortTitle: "M2 Money Supply",
    unit: "Billions", formatSuffix: "B",
    classify: () => "AT_TARGET",
    interpretation: {
      AT_TARGET: "M2 stable.",
      ABOVE_TARGET: "Rapid expansion — inflationary lag risk.",
      BELOW_TARGET: "Contracting M2 — deflationary pressure.",
      RECESSION_RISK: "Sharp contraction — credit stress.",
    },
  },
  {
    id: "A191RL1Q225SBEA", title: "Real Gross Domestic Product (annualized)", shortTitle: "Real GDP",
    unit: "Percent", formatSuffix: "%", target: 2.0, targetLabel: "Long-run potential",
    classify: (cur) => cur < 0 ? "RECESSION_RISK" : cur < 1.5 ? "BELOW_TARGET" : cur > 3 ? "ABOVE_TARGET" : "AT_TARGET",
    interpretation: {
      AT_TARGET: "Above-trend growth. Cyclicals favored.",
      ABOVE_TARGET: "Economy running hot.",
      BELOW_TARGET: "Below-trend — defensive positioning.",
      RECESSION_RISK: "Negative print — technical recession risk.",
    },
  },
  {
    id: "UMCSENT", title: "University of Michigan Consumer Sentiment", shortTitle: "Consumer Sentiment",
    unit: "Index", formatSuffix: "", target: 80, targetLabel: "Pre-pandemic baseline ~80",
    classify: ABOVE_BELOW(),
    interpretation: {
      AT_TARGET: "Sentiment healthy.",
      ABOVE_TARGET: "Elevated optimism.",
      BELOW_TARGET: "Cautious consumers — discretionary drag.",
      RECESSION_RISK: "Plummeting sentiment — retrenchment risk.",
    },
  },
  {
    id: "ICSA", title: "Initial Claims for Unemployment Insurance", shortTitle: "Initial Jobless Claims",
    unit: "Thousands", formatSuffix: "K", target: 250, targetLabel: "Historical normal ~200-250K",
    classify: (cur, target) => target == null ? "AT_TARGET" : cur > target * 1.4 ? "RECESSION_RISK" : cur > target ? "ABOVE_TARGET" : "AT_TARGET",
    interpretation: {
      AT_TARGET: "Claims in normal range.",
      ABOVE_TARGET: "Rising claims — softening labor.",
      BELOW_TARGET: "Exceptionally low claims.",
      RECESSION_RISK: "Spiking — major layoffs underway.",
    },
  },
  {
    id: "INDPRO", title: "Industrial Production Index", shortTitle: "Industrial Production",
    unit: "Index", formatSuffix: "",
    classify: () => "AT_TARGET",
    interpretation: {
      AT_TARGET: "Modest growth.",
      ABOVE_TARGET: "Strong industrial output.",
      BELOW_TARGET: "Weak production.",
      RECESSION_RISK: "Manufacturing in contraction.",
    },
  },
  {
    id: "HOUST", title: "Housing Starts", shortTitle: "Housing Starts",
    unit: "Thousands", formatSuffix: "K", target: 1500, targetLabel: "Estimated demand ~1.5M",
    classify: ABOVE_BELOW(),
    interpretation: {
      AT_TARGET: "Housing near equilibrium.",
      ABOVE_TARGET: "Housing boom.",
      BELOW_TARGET: "Undersupply persists.",
      RECESSION_RISK: "Housing collapse risk.",
    },
  },
  {
    id: "PERMIT", title: "Building Permits", shortTitle: "Building Permits",
    unit: "Thousands", formatSuffix: "K",
    classify: () => "AT_TARGET",
    interpretation: {
      AT_TARGET: "Permits stable.",
      ABOVE_TARGET: "Strong forward housing pipeline.",
      BELOW_TARGET: "Weak forward pipeline.",
      RECESSION_RISK: "Permits collapsing.",
    },
  },
  {
    id: "RETAILSM44X72USS", title: "Retail Sales (Ex-Auto)", shortTitle: "Retail Sales (Ex-Auto)",
    unit: "Millions", formatSuffix: "M", units: "pc1",
    classify: () => "AT_TARGET",
    interpretation: {
      AT_TARGET: "Consumer spending healthy.",
      ABOVE_TARGET: "Strong consumer.",
      BELOW_TARGET: "Consumer pullback.",
      RECESSION_RISK: "Retail sales collapsing.",
    },
  },
];

function pctChange(latest: number, prior: number | undefined): number {
  if (prior == null || !Number.isFinite(prior) || prior === 0) return 0;
  return ((latest - prior) / Math.abs(prior)) * 100;
}

async function fetchOne(cfg: SeriesConfig): Promise<MacroSeries | null> {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 3);
  const obs = await fredObservations(cfg.id, {
    start: start.toISOString().slice(0, 10),
    units: cfg.units,
  });
  if (!obs.length) return null;

  const meta = await fredSeriesMeta(cfg.id);

  const latest = obs[obs.length - 1]!;
  const prevMonth = obs[obs.length - 2];
  const prevYearObs = obs.find(o => {
    const target = new Date(latest.date);
    target.setFullYear(target.getFullYear() - 1);
    return o.date >= target.toISOString().slice(0, 10);
  }) ?? obs[0];

  const status = cfg.classify(latest.value, cfg.target);

  return {
    id: cfg.id,
    title: cfg.title,
    shortTitle: cfg.shortTitle,
    unit: cfg.unit,
    formatSuffix: cfg.formatSuffix,
    currentValue: latest.value,
    momChange: pctChange(latest.value, prevMonth?.value),
    yoyChange: cfg.units === "pc1" ? latest.value : pctChange(latest.value, prevYearObs?.value),
    lastUpdated: meta?.lastUpdated ? new Date(meta.lastUpdated) : new Date(latest.date),
    observations: obs,
    status,
    target: cfg.target,
    targetLabel: cfg.targetLabel,
    fredUrl: `https://fred.stlouisfed.org/series/${cfg.id}`,
    interpretation: cfg.interpretation,
  };
}

export async function fetchMacroSeries(): Promise<MacroSeries[]> {
  if (!fredApiKey()) return [];
  return getOrFetch(
    "macro:all",
    async () => {
      const results = await Promise.all(CONFIGS.map(fetchOne));
      return results.filter((s): s is MacroSeries => s !== null);
    },
    60 * 60 * 1000,
  );
}

export function fredConfigured(): boolean {
  return !!fredApiKey();
}

const TREASURY_SERIES: { id: string; maturity: string; months: number }[] = [
  { id: "DGS1MO", maturity: "1M", months: 1 },
  { id: "DGS3MO", maturity: "3M", months: 3 },
  { id: "DGS6MO", maturity: "6M", months: 6 },
  { id: "DGS1",   maturity: "1Y", months: 12 },
  { id: "DGS2",   maturity: "2Y", months: 24 },
  { id: "DGS3",   maturity: "3Y", months: 36 },
  { id: "DGS5",   maturity: "5Y", months: 60 },
  { id: "DGS7",   maturity: "7Y", months: 84 },
  { id: "DGS10",  maturity: "10Y", months: 120 },
  { id: "DGS20",  maturity: "20Y", months: 240 },
  { id: "DGS30",  maturity: "30Y", months: 360 },
];

export async function fetchYieldCurve(): Promise<YieldPoint[]> {
  if (!fredApiKey()) return [];
  return getOrFetch(
    "macro:yield-curve",
    async () => {
      const start = new Date();
      start.setDate(start.getDate() - 14);
      const startStr = start.toISOString().slice(0, 10);
      const points = await Promise.all(
        TREASURY_SERIES.map(async s => {
          const obs = await fredObservations(s.id, { start: startStr });
          const latest = obs[obs.length - 1];
          if (!latest) return null;
          return { maturity: s.maturity, months: s.months, yield: latest.value };
        }),
      );
      return points.filter((p): p is YieldPoint => p !== null);
    },
    60 * 60 * 1000,
  );
}

export async function fetchRecessionPeriods(): Promise<RecessionPeriod[]> {
  if (!fredApiKey()) return [];
  return getOrFetch(
    "macro:recessions",
    async () => {
      const obs = await fredObservations("USREC", { start: "1990-01-01" });
      const periods: RecessionPeriod[] = [];
      let inRecession = false;
      let start: Date | null = null;
      for (const o of obs) {
        if (o.value === 1 && !inRecession) {
          inRecession = true;
          start = new Date(o.date);
        } else if (o.value === 0 && inRecession && start) {
          inRecession = false;
          periods.push({ start, end: new Date(o.date) });
          start = null;
        }
      }
      if (inRecession && start) periods.push({ start, end: new Date() });
      return periods;
    },
    24 * 60 * 60 * 1000,
  );
}
