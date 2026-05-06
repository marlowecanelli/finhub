/**
 * Macro Economic API — FRED (Federal Reserve Economic Data)
 * Source: https://api.stlouisfed.org/fred/series/observations
 * Rate limit: 120 req/min with free API key
 */

import { z } from "zod";
import { getOrFetch } from "@/lib/cache";
import type { MacroSeries, MacroSeriesId, MacroObservation, RecessionPeriod, YieldPoint } from "@/lib/types/research";

export const MacroObservationSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export const MacroSeriesSchema = z.object({
  id: z.string(),
  title: z.string(),
  shortTitle: z.string(),
  unit: z.string(),
  formatSuffix: z.string(),
  currentValue: z.number(),
  momChange: z.number(),
  yoyChange: z.number(),
  lastUpdated: z.coerce.date(),
  observations: z.array(MacroObservationSchema),
  status: z.enum(["AT_TARGET", "ABOVE_TARGET", "BELOW_TARGET", "RECESSION_RISK"]),
  target: z.number().optional(),
  targetLabel: z.string().optional(),
  fredUrl: z.string(),
});

function genMonthlyObs(startVal: number, months = 24, volatility = 0.05): MacroObservation[] {
  const obs: MacroObservation[] = [];
  let val = startVal;
  const now = new Date();
  for (let i = months; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    val = val * (1 + (Math.random() - 0.5) * volatility);
    obs.push({ date: d.toISOString().slice(0, 10), value: parseFloat(val.toFixed(2)) });
  }
  return obs;
}

function genWeeklyObs(startVal: number, weeks = 52, volatility = 0.03): MacroObservation[] {
  const obs: MacroObservation[] = [];
  let val = startVal;
  const now = new Date();
  for (let i = weeks; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    val = val * (1 + (Math.random() - 0.5) * volatility);
    obs.push({ date: d.toISOString().slice(0, 10), value: parseFloat(val.toFixed(0)) });
  }
  return obs;
}

function genQuarterlyObs(startVal: number, quarters = 16, volatility = 0.04): MacroObservation[] {
  const obs: MacroObservation[] = [];
  let val = startVal;
  const now = new Date();
  for (let i = quarters; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
    val = val + (Math.random() - 0.48) * volatility * 10;
    obs.push({ date: d.toISOString().slice(0, 10), value: parseFloat(val.toFixed(1)) });
  }
  return obs;
}

export function mockMacroSeries(): MacroSeries[] {
  const cpiObs = genMonthlyObs(3.2, 24, 0.04);
  const pceObs = genMonthlyObs(2.8, 24, 0.03);
  const unrateObs = genMonthlyObs(3.9, 24, 0.02);
  const fedfundsObs = genMonthlyObs(5.33, 24, 0.01);
  const t10y2yObs = genMonthlyObs(-0.42, 24, 0.15).map(o => ({ ...o, value: parseFloat((o.value).toFixed(2)) }));
  const m2Obs = genMonthlyObs(20800, 24, 0.008);
  const gdpObs = genQuarterlyObs(2.8, 16, 0.03);
  const umcsentObs = genMonthlyObs(72.4, 24, 0.04);
  const icsaObs = genWeeklyObs(215000, 52, 0.06);
  const indproObs = genMonthlyObs(103.2, 24, 0.015);
  const houstObs = genMonthlyObs(1380, 24, 0.06);
  const permitObs = genMonthlyObs(1450, 24, 0.06);
  const retailObs = genMonthlyObs(498000, 24, 0.025);

  return [
    {
      id: "CPIAUCSL",
      title: "Consumer Price Index for All Urban Consumers",
      shortTitle: "CPI (All Items)",
      unit: "Index",
      formatSuffix: "%",
      currentValue: 3.2,
      momChange: 0.1,
      yoyChange: 3.2,
      lastUpdated: new Date(),
      observations: cpiObs,
      status: "ABOVE_TARGET",
      target: 2.0,
      targetLabel: "Fed 2% target",
      fredUrl: "https://fred.stlouisfed.org/series/CPIAUCSL",
      interpretation: {
        ABOVE_TARGET: "Inflation remains above the Fed's 2% target, maintaining pressure for rates to stay higher for longer. Watch for sticky shelter and services components.",
        AT_TARGET: "CPI is near the Fed's 2% target. Expect rate cut discussions to intensify at upcoming FOMC meetings.",
        BELOW_TARGET: "CPI has fallen below target, raising deflation concerns. The Fed may pivot to cuts or QE.",
        RECESSION_RISK: "CPI is falling sharply alongside weakening demand — a stagflation-to-recession transition may be underway.",
      },
    },
    {
      id: "PCEPI",
      title: "Personal Consumption Expenditures Price Index",
      shortTitle: "PCE Inflation",
      unit: "Percent",
      formatSuffix: "%",
      currentValue: 2.8,
      momChange: 0.1,
      yoyChange: 2.8,
      lastUpdated: new Date(),
      observations: pceObs,
      status: "ABOVE_TARGET",
      target: 2.0,
      targetLabel: "Fed preferred inflation gauge",
      fredUrl: "https://fred.stlouisfed.org/series/PCEPI",
      interpretation: {
        ABOVE_TARGET: "PCE is the Fed's preferred inflation metric. Above 2% keeps rate cuts on hold — listen carefully to FOMC language on 'confidence' in disinflation.",
        AT_TARGET: "PCE at target unlocks Fed optionality. Rate cuts become politically and mechanically viable.",
        BELOW_TARGET: "Below-target PCE accelerates the Fed easing timeline. Risk assets historically rally 60-90 days after PCE crosses below 2%.",
        RECESSION_RISK: "Collapsing PCE signals demand destruction. Earnings estimates are likely too high.",
      },
    },
    {
      id: "UNRATE",
      title: "Unemployment Rate",
      shortTitle: "Unemployment",
      unit: "Percent",
      formatSuffix: "%",
      currentValue: 3.9,
      momChange: 0.1,
      yoyChange: 0.3,
      lastUpdated: new Date(),
      observations: unrateObs,
      status: "AT_TARGET",
      target: 4.0,
      targetLabel: "NAIRU estimate ~4%",
      fredUrl: "https://fred.stlouisfed.org/series/UNRATE",
      interpretation: {
        AT_TARGET: "Unemployment near NAIRU. Goldilocks: tight labor market without triggering wage-price spiral. Favorable for consumer spending.",
        ABOVE_TARGET: "Rising unemployment signals economic softening. Watch for Fed dovish pivot and potential earnings cuts in consumer discretionary.",
        BELOW_TARGET: "Extremely tight labor market pressures wages and prices. Fed remains hawkish.",
        RECESSION_RISK: "Unemployment rising rapidly — Sahm Rule may be triggered. Historically a lagging indicator; equity markets often bottom before unemployment peaks.",
      },
    },
    {
      id: "FEDFUNDS",
      title: "Federal Funds Effective Rate",
      shortTitle: "Fed Funds Rate",
      unit: "Percent",
      formatSuffix: "%",
      currentValue: 5.33,
      momChange: 0.0,
      yoyChange: 0.0,
      lastUpdated: new Date(),
      observations: fedfundsObs,
      status: "ABOVE_TARGET",
      target: 2.5,
      targetLabel: "Long-run neutral rate estimate",
      fredUrl: "https://fred.stlouisfed.org/series/FEDFUNDS",
      interpretation: {
        ABOVE_TARGET: "Policy is restrictive. Higher-for-longer pressures P/E multiples and growth stocks. Value and financials historically outperform.",
        AT_TARGET: "Rates near neutral. Balanced policy supports broad equity performance.",
        BELOW_TARGET: "Stimulative policy. Growth and tech historically outperform. Watch for asset bubbles.",
        RECESSION_RISK: "Emergency cuts underway. Markets look through initial panic toward recovery timeline.",
      },
    },
    {
      id: "T10Y2Y",
      title: "10-Year Treasury Minus 2-Year Treasury",
      shortTitle: "Yield Curve (10Y-2Y)",
      unit: "Percent",
      formatSuffix: "%",
      currentValue: -0.42,
      momChange: 0.08,
      yoyChange: 0.31,
      lastUpdated: new Date(),
      observations: t10y2yObs,
      status: "RECESSION_RISK",
      target: 0,
      targetLabel: "Inversion = negative spread",
      fredUrl: "https://fred.stlouisfed.org/series/T10Y2Y",
      interpretation: {
        AT_TARGET: "Flat curve signals uncertainty about growth. Watch for direction of travel.",
        ABOVE_TARGET: "Normal upward-sloping curve. Historically bullish for banks and risk assets.",
        BELOW_TARGET: "Mildly inverted. Bears watching — sustained inversion precedes most recessions by 12-18 months.",
        RECESSION_RISK: "Deep inversion active. NY Fed recession probability model elevated. Historically markets are 8-18 months from a recession.",
      },
    },
    {
      id: "M2SL",
      title: "M2 Money Stock",
      shortTitle: "M2 Money Supply",
      unit: "Billions",
      formatSuffix: "B",
      currentValue: 20847,
      momChange: 0.2,
      yoyChange: -1.8,
      lastUpdated: new Date(),
      observations: m2Obs,
      status: "BELOW_TARGET",
      fredUrl: "https://fred.stlouisfed.org/series/M2SL",
      interpretation: {
        AT_TARGET: "M2 stable. Moderate liquidity conditions.",
        ABOVE_TARGET: "M2 expanding rapidly — watch for inflationary lag effect (typically 12-18 months).",
        BELOW_TARGET: "M2 contracting — historically rare. Deflationary pressure may emerge. Bonds outperform in this regime.",
        RECESSION_RISK: "Sharp M2 contraction historically correlated with banking stress and credit crunch.",
      },
    },
    {
      id: "A191RL1Q225SBEA",
      title: "Real Gross Domestic Product",
      shortTitle: "Real GDP Growth",
      unit: "Percent Change",
      formatSuffix: "%",
      currentValue: 2.8,
      momChange: 0.0,
      yoyChange: 0.3,
      lastUpdated: new Date(),
      observations: gdpObs,
      status: "AT_TARGET",
      target: 2.0,
      targetLabel: "Long-run potential growth",
      fredUrl: "https://fred.stlouisfed.org/series/A191RL1Q225SBEA",
      interpretation: {
        AT_TARGET: "Above-trend growth. Corporate earnings revisions skew positive. Cyclicals outperform.",
        ABOVE_TARGET: "Economy running hot. Potential for inflation re-acceleration if labor market stays tight.",
        BELOW_TARGET: "Below-trend growth. Defensive positioning warranted. Monitor leading indicators.",
        RECESSION_RISK: "Two consecutive negative quarters — technical recession. Historically S&P 500 bottoms ~6 months into recession.",
      },
    },
    {
      id: "UMCSENT",
      title: "University of Michigan Consumer Sentiment",
      shortTitle: "Consumer Sentiment",
      unit: "Index",
      formatSuffix: "",
      currentValue: 72.4,
      momChange: -1.2,
      yoyChange: 4.3,
      lastUpdated: new Date(),
      observations: umcsentObs,
      status: "BELOW_TARGET",
      target: 80,
      targetLabel: "Pre-pandemic baseline ~80",
      fredUrl: "https://fred.stlouisfed.org/series/UMCSENT",
      interpretation: {
        AT_TARGET: "Sentiment healthy. Consumer spending likely to remain supportive.",
        ABOVE_TARGET: "Elevated optimism. Historically can precede spending surge or mean-reversion.",
        BELOW_TARGET: "Cautious consumers drag on discretionary spending. Retailers, restaurants at risk.",
        RECESSION_RISK: "Plummeting sentiment signals consumer retrenchment. Defensive rotation warranted.",
      },
    },
    {
      id: "ICSA",
      title: "Initial Claims for Unemployment Insurance",
      shortTitle: "Initial Jobless Claims",
      unit: "Thousands",
      formatSuffix: "K",
      currentValue: 215,
      momChange: 3.2,
      yoyChange: 12.4,
      lastUpdated: new Date(),
      observations: icsaObs.map(o => ({ ...o, value: Math.floor(o.value / 1000) })),
      status: "AT_TARGET",
      target: 250,
      targetLabel: "Historical normal ~200-250K",
      fredUrl: "https://fred.stlouisfed.org/series/ICSA",
      interpretation: {
        AT_TARGET: "Claims in normal range. Labor market healthy.",
        ABOVE_TARGET: "Rising claims signal deteriorating labor market. Leading indicator of unemployment rate uptick.",
        BELOW_TARGET: "Exceptionally low claims. Labor market very tight — watch for wage inflation.",
        RECESSION_RISK: "Claims spiking rapidly. Major layoffs underway — track sector concentration.",
      },
    },
    {
      id: "INDPRO",
      title: "Industrial Production Index",
      shortTitle: "Industrial Production",
      unit: "Index",
      formatSuffix: "",
      currentValue: 103.2,
      momChange: 0.3,
      yoyChange: 1.1,
      lastUpdated: new Date(),
      observations: indproObs,
      status: "AT_TARGET",
      fredUrl: "https://fred.stlouisfed.org/series/INDPRO",
      interpretation: {
        AT_TARGET: "Industrial production growing modestly. Industrials and materials historically perform in line.",
        ABOVE_TARGET: "Strong industrial output signals broad economic health.",
        BELOW_TARGET: "Weak industrial production often leads broader slowdown.",
        RECESSION_RISK: "Industrial contraction — manufacturing sector in recession.",
      },
    },
    {
      id: "HOUST",
      title: "Housing Starts",
      shortTitle: "Housing Starts",
      unit: "Thousands",
      formatSuffix: "K",
      currentValue: 1380,
      momChange: -1.8,
      yoyChange: 3.2,
      lastUpdated: new Date(),
      observations: houstObs,
      status: "BELOW_TARGET",
      target: 1500,
      targetLabel: "Estimated demand ~1.5M units",
      fredUrl: "https://fred.stlouisfed.org/series/HOUST",
      interpretation: {
        AT_TARGET: "Housing activity near equilibrium. XLRE and homebuilders neutral.",
        ABOVE_TARGET: "Housing boom. Watch lumber, copper, homebuilders (DHI, LEN).",
        BELOW_TARGET: "Undersupply persists. Home prices sticky. Affordability crisis.",
        RECESSION_RISK: "Housing collapse historically leads broader recession by 6-12 months.",
      },
    },
    {
      id: "RETAILSM44X72USS",
      title: "Advance Retail Sales: Retail Trade (Ex-Auto)",
      shortTitle: "Retail Sales (Ex-Auto)",
      unit: "Millions",
      formatSuffix: "M",
      currentValue: 498542,
      momChange: 0.4,
      yoyChange: 2.8,
      lastUpdated: new Date(),
      observations: retailObs,
      status: "AT_TARGET",
      fredUrl: "https://fred.stlouisfed.org/series/RETAILSM44X72USS",
      interpretation: {
        AT_TARGET: "Consumer spending healthy. Consumer discretionary and retail broadly stable.",
        ABOVE_TARGET: "Strong consumer spending fuels GDP growth.",
        BELOW_TARGET: "Consumer pullback risks drag on earnings for discretionary names.",
        RECESSION_RISK: "Retail sales collapsing — consumer-driven recession underway.",
      },
    },
  ];
}

export async function fetchMacroSeries(seriesId?: MacroSeriesId): Promise<MacroSeries[]> {
  const key = `macro:${seriesId ?? "all"}`;
  return getOrFetch(key, async () => {
    // In production: fetch from https://api.stlouisfed.org/fred/series/observations
    return mockMacroSeries();
  }, 60 * 60 * 1000); // 1hr TTL — FRED data updates infrequently
}

export function mockRecessionPeriods(): RecessionPeriod[] {
  return [
    { start: new Date("2001-03-01"), end: new Date("2001-11-01") },
    { start: new Date("2007-12-01"), end: new Date("2009-06-01") },
    { start: new Date("2020-02-01"), end: new Date("2020-04-01") },
  ];
}

export function mockYieldCurve(): YieldPoint[] {
  return [
    { maturity: "1M", months: 1, yield: 5.32 },
    { maturity: "3M", months: 3, yield: 5.29 },
    { maturity: "6M", months: 6, yield: 5.18 },
    { maturity: "1Y", months: 12, yield: 4.94 },
    { maturity: "2Y", months: 24, yield: 4.75 },
    { maturity: "3Y", months: 36, yield: 4.62 },
    { maturity: "5Y", months: 60, yield: 4.51 },
    { maturity: "7Y", months: 84, yield: 4.48 },
    { maturity: "10Y", months: 120, yield: 4.33 },
    { maturity: "20Y", months: 240, yield: 4.58 },
    { maturity: "30Y", months: 360, yield: 4.49 },
  ];
}
