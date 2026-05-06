// ─── Shared Research Types ───────────────────────────────────────────────────

export type Sector =
  | "Technology"
  | "Financials"
  | "Energy"
  | "Healthcare"
  | "Industrials"
  | "Consumer Discretionary"
  | "Consumer Staples"
  | "Real Estate"
  | "Utilities"
  | "Materials"
  | "Communication";

export type MarketStatus = "OPEN" | "AFTER_HOURS" | "CLOSED";

// ─── Insider Trading ─────────────────────────────────────────────────────────

export type InsiderRole =
  | "CEO"
  | "CFO"
  | "COO"
  | "Director"
  | "10%+ Owner"
  | "General Counsel"
  | "VP"
  | "SVP"
  | "EVP"
  | "President"
  | "CTO"
  | "CMO"
  | "CHRO";

export type TransactionType = "PURCHASE" | "SALE" | "SALE_10B5_1";

export type AnomalyFlag =
  | "LARGE_PURCHASE"
  | "CEO_BUY"
  | "CLUSTER_BUY"
  | "FIRST_PURCHASE"
  | "NEAR_52W_LOW"
  | "POST_DECLINE"
  | "OPEN_MARKET_ONLY";

export type AnomalyLabel = "routine" | "notable" | "significant" | "high-conviction";

export interface AnomalyScore {
  score: number;
  flags: AnomalyFlag[];
  label: AnomalyLabel;
}

export interface InsiderTransaction {
  id: string;
  ticker: string;
  companyName: string;
  sector: Sector;
  insiderName: string;
  insiderRole: InsiderRole;
  transactionType: TransactionType;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  ownershipChangePct: number;
  filingDate: Date;
  transactionDate: Date;
  secFilingUrl: string;
  stockPriceAt52wLow: number;
  stockPriceCurrent: number;
  stock52wHigh: number;
  stock52wLow: number;
  priorPurchaseDate?: Date;
  stockPriceChange60d: number;
  isOptionExercise: boolean;
  isGift: boolean;
  anomalyScore?: AnomalyScore;
}

// ─── Short Interest ───────────────────────────────────────────────────────────

export interface ShortData {
  ticker: string;
  companyName: string;
  sector: Sector;
  shortInterestShares: number;
  floatShares: number;
  shortInterestPct: number;
  avgDailyVolume: number;
  daysToCover: number;
  prevShortInterestShares: number;
  siChangePct: number;
  borrowRate: number;
  recentVolume: number;
  volume20dAvg: number;
  sparklineData: { date: string; siPct: number }[];
  squeezeScore?: number;
  squeezeBreakdown?: SqueezeScoreBreakdown;
  redditMentions7d?: number;
}

export interface SqueezeScoreBreakdown {
  siPctScore: number;
  daysToCoverScore: number;
  siTrendScore: number;
  borrowRateScore: number;
  relativeVolumeScore: number;
  total: number;
}

// ─── Macro ────────────────────────────────────────────────────────────────────

export type MacroSeriesId =
  | "CPIAUCSL"
  | "PCEPI"
  | "UNRATE"
  | "FEDFUNDS"
  | "T10Y2Y"
  | "M2SL"
  | "A191RL1Q225SBEA"
  | "UMCSENT"
  | "ICSA"
  | "INDPRO"
  | "HOUST"
  | "PERMIT"
  | "RETAILSM44X72USS"
  | "USREC";

export type MacroStatus = "AT_TARGET" | "ABOVE_TARGET" | "BELOW_TARGET" | "RECESSION_RISK";

export interface MacroObservation {
  date: string;
  value: number;
}

export interface MacroSeries {
  id: MacroSeriesId;
  title: string;
  shortTitle: string;
  unit: string;
  formatSuffix: string;
  currentValue: number;
  momChange: number;
  yoyChange: number;
  lastUpdated: Date;
  observations: MacroObservation[];
  status: MacroStatus;
  target?: number;
  targetLabel?: string;
  fredUrl: string;
  interpretation: Record<string, string>;
}

export interface YieldPoint {
  maturity: string;
  months: number;
  yield: number;
}

export interface RecessionPeriod {
  start: Date;
  end: Date;
}

// ─── Sector Rotation ─────────────────────────────────────────────────────────

export type Timeframe = "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y";

export interface SectorETF {
  ticker: string;
  name: string;
  sector: Sector;
  color: string;
}

export interface SectorPerformance {
  etf: SectorETF;
  returnPct: number;
  rsRatio: number;
  rsMomentum: number;
  netFlow: number;
  volumeVs20dAvg: number;
  topHoldings: string[];
  constituents: ConstituentStock[];
  historicalReturns: Record<string, number[]>;
}

export interface ConstituentStock {
  ticker: string;
  name: string;
  returnPct: number;
  weight: number;
}

// ─── Earnings ────────────────────────────────────────────────────────────────

export type EarningsTiming = "BMO" | "AMC" | "TNS";
export type BeatQuality = "triple-beat" | "double-beat" | "single-beat" | "miss" | "pending";

export interface EarningsEvent {
  id: string;
  ticker: string;
  companyName: string;
  sector: Sector;
  earningsDate: Date;
  timing: EarningsTiming;
  consensusEPS: number;
  whisperEPS: number;
  actualEPS?: number;
  consensusRevenue: number;
  actualRevenue?: number;
  impliedMovePct: number;
  historicalActualMoves: number[];
  historicalImpliedMoves: number[];
  beatQuality: BeatQuality;
  guidanceRaised?: boolean;
  postEarningsDrift: {
    d1: number;
    d3: number;
    d5: number;
    d10: number;
  };
}

// ─── Options Flow ─────────────────────────────────────────────────────────────

export type OptionType = "CALL" | "PUT";
export type FlowSentiment = "BULLISH_SWEEP" | "BEARISH_SWEEP" | "NEUTRAL_SPREAD";

export interface OptionsOrder {
  id: string;
  ticker: string;
  expiry: Date;
  strike: number;
  optionType: OptionType;
  premium: number;
  contracts: number;
  openInterest: number;
  volume: number;
  sentiment: FlowSentiment;
  timestamp: Date;
  isUnusual: boolean;
}

// ─── Institutional Ownership ─────────────────────────────────────────────────

export interface InstitutionalHolder {
  fund: string;
  sharesHeld: number;
  portfolioPct: number;
  quarterChangeShares: number;
  quarterChangePct: number;
  isNew: boolean;
  isClosed: boolean;
  historicalPerformilePct: number;
}

export interface InstitutionalOwnership {
  ticker: string;
  totalInstOwnershipPct: number;
  prevInstOwnershipPct: number;
  top25Holders: InstitutionalHolder[];
  newPositions: number;
  closedPositions: number;
  concentrationRisk: boolean;
  smartMoneyScore: number;
}

// ─── Dark Pool ────────────────────────────────────────────────────────────────

export interface DarkPoolPrint {
  id: string;
  ticker: string;
  shares: number;
  price: number;
  totalValue: number;
  timestamp: Date;
  aboveMidpoint: boolean;
  darkPoolPct: number;
  exchangeVolume: number;
  darkPoolVolume: number;
  accumulationSignal: boolean;
}

// ─── Economic Calendar ────────────────────────────────────────────────────────

export type MarketImpact = "HIGH" | "MEDIUM" | "LOW";

export interface CalendarRelease {
  id: string;
  name: string;
  releaseTime: Date;
  previousValue: number;
  consensusValue?: number;
  actualValue?: number;
  unit: string;
  impact: MarketImpact;
  beat: boolean | null;
  historicalVsConsensus: { date: string; actual: number; consensus: number }[];
}

// ─── Congress Trades ──────────────────────────────────────────────────────────

export type Party = "D" | "R" | "I";
export type Chamber = "Senate" | "House";

export interface CongressTrade {
  id: string;
  name: string;
  party: Party;
  state: string;
  chamber: Chamber;
  ticker: string;
  companyName: string;
  sector: Sector;
  transactionType: "Buy" | "Sell" | "Exchange";
  amountMin: number;
  amountMax: number;
  transactionDate: Date;
  disclosureDate: Date;
  disclosureLagDays: number;
  committeeOverlap: boolean;
  committeeNames: string[];
  postTradeReturn?: number;
}

// ─── Analyst Ratings ─────────────────────────────────────────────────────────

export type AnalystRating =
  | "Strong Buy"
  | "Buy"
  | "Hold"
  | "Sell"
  | "Strong Sell";

export interface AnalystRatingChange {
  id: string;
  firm: string;
  analyst: string;
  previousRating: AnalystRating;
  newRating: AnalystRating;
  previousPriceTarget?: number;
  newPriceTarget?: number;
  changeDate: Date;
  firmAccuracyScore: number;
}

export interface AnalystConsensus {
  ticker: string;
  companyName: string;
  consensus: AnalystRating;
  distribution: Record<AnalystRating, number>;
  lowTarget: number;
  medianTarget: number;
  highTarget: number;
  currentPrice: number;
  recentChanges: AnalystRatingChange[];
  epsRevisions: { date: string; estimate: number }[];
}

// ─── Screener ────────────────────────────────────────────────────────────────

export interface ScreenerStock {
  ticker: string;
  companyName: string;
  sector: Sector;
  marketCap: number;
  pe: number;
  pb: number;
  evEbitda: number;
  fcfYield: number;
  grossMargin: number;
  netMargin: number;
  roe: number;
  revenueGrowth1y: number;
  revenueGrowth3y: number;
  revenueGrowth5y: number;
  epsGrowth: number;
  dividendYield: number;
  dividendStreakYears: number;
  shortInterestPct: number;
  institutionalOwnershipPct: number;
  momentum12m: number;
  price: number;
  priceChange1d: number;
}

export type ScreenerPreset =
  | "deep-value"
  | "quality-compounder"
  | "momentum-value"
  | "dividend-aristocrats"
  | "squeeze-candidates";

// ─── Top Bar ─────────────────────────────────────────────────────────────────

export interface QuickTicker {
  symbol: string;
  price: number;
  delta: number;
  deltaPct: number;
}
