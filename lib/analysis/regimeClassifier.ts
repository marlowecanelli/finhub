import type { MacroSeries } from "@/lib/types/research";

export type MacroRegime =
  | "Goldilocks"
  | "Overheating"
  | "Stagflation Risk"
  | "Recession Risk"
  | "Recovery"
  | "Disinflation"
  | "Deflation Risk"
  | "Unknown";

export interface RegimeResult {
  regime: MacroRegime;
  confidence: number;
  description: string;
  equityImplication: string;
  sectorRotation: string;
}

const REGIME_INTERPRETATIONS: Record<MacroRegime, Omit<RegimeResult, "regime" | "confidence">> = {
  Goldilocks: {
    description: "Moderate growth, moderate inflation, employment near NAIRU. The ideal macro environment for equities.",
    equityImplication: "Broadly bullish. P/E expansion likely. Growth and quality factors outperform.",
    sectorRotation: "Technology, Financials, Consumer Discretionary lead. Defensives lag.",
  },
  Overheating: {
    description: "Strong growth but inflation running hot. Fed is hawkish. Real rates rising.",
    equityImplication: "Mixed. Earnings strong but multiples compress. Value beats growth.",
    sectorRotation: "Energy, Materials, Financials outperform. Duration-sensitive sectors struggle.",
  },
  "Stagflation Risk": {
    description: "Inflation elevated while growth slows. Worst macro combination for risk assets.",
    equityImplication: "Bearish. Both growth and value under pressure. Hard assets and commodities preferred.",
    sectorRotation: "Energy, Materials, Consumer Staples. Avoid Consumer Discretionary, Real Estate.",
  },
  "Recession Risk": {
    description: "Yield curve inverted, growth slowing, unemployment rising. Recession likely within 12-18 months.",
    equityImplication: "Defensive posture warranted. Markets typically bottom 6 months into recession.",
    sectorRotation: "Healthcare, Consumer Staples, Utilities. Short Financials and Industrials.",
  },
  Recovery: {
    description: "Post-recession rebound. Growth accelerating from a low base, inflation contained.",
    equityImplication: "Strongly bullish. Maximum deployment into risk assets.",
    sectorRotation: "Cyclicals, Small Caps, Financials. Emerging markets outperform.",
  },
  Disinflation: {
    description: "Inflation falling toward target. Fed pivoting dovish. Real rates declining.",
    equityImplication: "Bullish for growth/tech. Long duration assets benefit.",
    sectorRotation: "Technology, Real Estate, Utilities. Quality growth over value.",
  },
  "Deflation Risk": {
    description: "CPI/PCE falling below target. Demand collapse risk. Deflationary spiral possible.",
    equityImplication: "Highly defensive. Cash and bonds outperform equities.",
    sectorRotation: "Consumer Staples, Utilities. Avoid cyclicals entirely.",
  },
  Unknown: {
    description: "Macro signals are conflicting or insufficient data available.",
    equityImplication: "No strong directional view. Balanced positioning.",
    sectorRotation: "Neutral across sectors. Monitor leading indicators.",
  },
};

export function classifyMacroRegime(series: MacroSeries[]): RegimeResult {
  const cpi = series.find(s => s.id === "CPIAUCSL");
  const unrate = series.find(s => s.id === "UNRATE");
  const t10y2y = series.find(s => s.id === "T10Y2Y");
  const gdp = series.find(s => s.id === "A191RL1Q225SBEA");

  const cpiVal = cpi?.currentValue ?? 3.0;
  const unrateVal = unrate?.currentValue ?? 4.0;
  const yieldSpread = t10y2y?.currentValue ?? 0.0;
  const gdpVal = gdp?.currentValue ?? 2.0;

  let regime: MacroRegime = "Unknown";
  let confidence = 0.6;

  if (yieldSpread < -0.3 && gdpVal < 1.0) {
    regime = "Recession Risk";
    confidence = 0.85;
  } else if (cpiVal > 5 && unrateVal < 4) {
    regime = "Stagflation Risk";
    confidence = 0.78;
  } else if (cpiVal > 3.5 && gdpVal > 2.5) {
    regime = "Overheating";
    confidence = 0.72;
  } else if (cpiVal < 2 && gdpVal > 0) {
    regime = "Disinflation";
    confidence = 0.7;
  } else if (cpiVal < 1 && gdpVal < 0) {
    regime = "Deflation Risk";
    confidence = 0.8;
  } else if (gdpVal > 3 && cpiVal < 2.5 && unrateVal < 4.5) {
    regime = "Goldilocks";
    confidence = 0.82;
  } else if (gdpVal > 2 && cpiVal < 3 && yieldSpread > 0) {
    regime = "Recovery";
    confidence = 0.68;
  } else if (cpiVal >= 2 && cpiVal <= 3.5 && unrateVal <= 4.5 && gdpVal >= 1.5) {
    regime = "Goldilocks";
    confidence = 0.65;
  } else {
    regime = "Unknown";
    confidence = 0.5;
  }

  return {
    regime,
    confidence,
    ...REGIME_INTERPRETATIONS[regime],
  };
}
