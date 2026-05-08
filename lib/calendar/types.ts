export type EventType =
  | "earnings"
  | "dividend"
  | "economic"
  | "ipo"
  | "split"
  | "opex"
  | "holiday"
  | "conference"
  | "crypto"
  | "treasury"
  | "lockup"
  | "custom";

export type EventTiming = "bmo" | "amc" | "dmh" | "all_day";
export type EventImportance = "low" | "medium" | "high" | "critical";

export type EarningsMetadata = {
  kind: "earnings";
  fiscalQuarter?: string | null;
  epsEstimate?: number | null;
  revenueEstimate?: number | null;
  lastEpsActual?: number | null;
  lastEpsEstimate?: number | null;
  lastSurprisePct?: number | null;
  marketCap?: number | null;
  marketCapTier?: "mega" | "large" | "mid" | "small" | "micro" | null;
  impliedMovePct?: number | null;
};

export type DividendMetadata = {
  kind: "dividend";
  amount: number;
  yieldPct?: number | null;
  isSpecial?: boolean;
  changeVsPrior?: "up" | "down" | "flat" | null;
  recordDate?: string | null;
  paymentDate?: string | null;
};

export type EconomicMetadata = {
  kind: "economic";
  consensusForecast?: string | null;
  previousReading?: string | null;
  unit?: string | null;
  releaseAgency?: string | null;
};

export type IpoMetadata = {
  kind: "ipo";
  expectedTicker?: string | null;
  priceLow?: number | null;
  priceHigh?: number | null;
  sharesOffered?: number | null;
  dealSize?: number | null;
  underwriters?: string[];
  sector?: string | null;
  status?: "filed" | "priced" | "trading" | null;
};

export type SplitMetadata = {
  kind: "split";
  ratioFrom: number;
  ratioTo: number;
  isReverse: boolean;
};

export type OpexMetadata = {
  kind: "opex";
  category: "weekly" | "monthly" | "quarterly" | "leaps";
  isTripleWitching: boolean;
};

export type HolidayMetadata = {
  kind: "holiday";
  market: "US" | "LSE" | "TSE" | "HKEX";
  isHalfDay: boolean;
  earlyClose?: string | null;
};

export type ConferenceMetadata = {
  kind: "conference";
  organizer?: string | null;
  url?: string | null;
  location?: string | null;
};

export type CryptoMetadata = {
  kind: "crypto";
  asset: string;
  category: "halving" | "fork" | "unlock" | "upgrade";
};

export type TreasuryMetadata = {
  kind: "treasury";
  instrument: "2Y" | "3Y" | "5Y" | "7Y" | "10Y" | "20Y" | "30Y" | "TIPS" | "FRN";
  amount?: number | null;
};

export type LockupMetadata = {
  kind: "lockup";
  ipoDate: string;
  estimated: boolean;
};

export type CustomMetadata = {
  kind: "custom";
};

export type CalendarEventMetadata =
  | EarningsMetadata
  | DividendMetadata
  | EconomicMetadata
  | IpoMetadata
  | SplitMetadata
  | OpexMetadata
  | HolidayMetadata
  | ConferenceMetadata
  | CryptoMetadata
  | TreasuryMetadata
  | LockupMetadata
  | CustomMetadata;

export type CalendarEvent = {
  id: string;
  event_type: EventType;
  ticker: string | null;
  title: string;
  description: string | null;
  event_date: string; // ISO
  timing: EventTiming;
  importance: EventImportance;
  metadata: CalendarEventMetadata;
  source: string;
  external_id?: string | null;
  ai_brief?: string | null;
};

export type CalendarEventInput = Omit<CalendarEvent, "id"> & {
  external_id: string;
};

export type CalendarFilters = {
  from: string;
  to: string;
  types?: EventType[];
  tickers?: string[];
  importance?: EventImportance[];
  watchlistOnly?: boolean;
  search?: string;
};

export type CalendarSettings = {
  user_id: string;
  visible_event_types: EventType[];
  watchlist_only: boolean;
  timezone: string;
  default_view: "month" | "week" | "agenda" | "heatmap";
  email_digest_enabled: boolean;
  email_digest_hour: number;
  push_notifications_enabled: boolean;
  alert_lead_time_minutes: number;
  feed_token: string;
};
