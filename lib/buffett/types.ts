export type BuffettStatus = "pass" | "fail" | "partial";

export type BuffettLabel =
  | "Strongly Avoid"
  | "Avoid"
  | "Neutral"
  | "Buffett-Worthy"
  | "Highly Buffett-Worthy";

export type BuffettCriterion = {
  id: string;
  name: string;
  status: BuffettStatus;
  score: number; // 0 to 10
  weight: number;
  actual: string;
  threshold: string;
  explanation: string;
  source: "calculated" | "ai" | "hybrid";
  reasoning?: string;
};

export type BuffettScoreResponse = {
  ticker: string;
  companyName: string;
  sector: string;
  computedAt: string;
  overall: number; // 1.0 to 10.0
  label: BuffettLabel;
  criteria: BuffettCriterion[];
  quote: { text: string; attribution: string };
  disclaimer: string;
  dataAsOf: string;
};

// ── Fundamentals data types ──────────────────────────────────────────────────

export type AnnualFinancial = {
  year: number;
  revenue: number | null;
  netIncome: number | null;
  grossProfit: number | null;
  eps: number | null;
  netMargin: number | null;
  grossMargin: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  fcf: number | null;
  totalDebt: number | null;
  longTermDebt: number | null;
  equity: number | null;
  roe: number | null;
  sharesOutstanding: number | null;
  sbc: number | null; // stock-based compensation
  roic: number | null;
};

export type FundamentalsSnapshot = {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  description: string;
  // Current quote/stats
  currentPrice: number | null;
  marketCap: number | null;
  peRatio: number | null;
  dividendYield: number | null;
  currentSharesOutstanding: number | null;
  // Ownership
  insiderOwnershipPct: number | null;
  founderLed: boolean;
  // Annual data (oldest first, min 4 years ideally 10)
  annuals: AnnualFinancial[];
  // Weekly price history (5Y, oldest first)
  priceHistory: { date: string; close: number }[];
  // Dividend payments (date + per-share amount)
  dividendHistory: { date: string; amount: number }[];
  // Current (TTM) metrics
  fcfTTM: number | null;
  roicCurrent: number | null;
  // MD&A excerpt for AI criterion
  mdaExcerpt: string;
  dataAsOf: string;
};

// AI assessment returned by Anthropic
export type AiAssessment = {
  moat: { score: number; reasoning: string };
  predictability: { score: number; reasoning: string };
  management: { score: number; reasoning: string };
};

// Screener row stored in DB
export type ScreenerRow = {
  ticker: string;
  company_name: string;
  sector: string | null;
  market_cap: number | null;
  dividend_yield: number | null;
  overall: number;
  label: BuffettLabel;
  payload: BuffettScoreResponse;
  updated_at: string;
};
