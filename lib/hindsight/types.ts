export type PricePoint = {
  /** ISO date YYYY-MM-DD */
  date: string;
  /** Adjusted close (dividend & split adjusted) */
  close: number;
};

export type Dividend = {
  date: string;
  amount: number;
};

export type Holding = {
  ticker: string;
  /** Weight 0..1 */
  weight: number;
};

export type CrisisEvent = {
  date: string;
  label: string;
};

export type ScenarioKey =
  | "gfc-2008"
  | "covid-2020"
  | "rate-hikes-2022"
  | "dotcom-2000"
  | "black-monday-1987"
  | "custom";

export type Scenario = {
  key: ScenarioKey;
  name: string;
  start: string;
  end: string;
  teaser: string;
  narrative: string;
  keyEvents: CrisisEvent[];
};

export type TimeMachineResult = {
  ticker: string;
  startDate: string;
  endDate: string;
  amount: number;
  reinvestDividends: boolean;
  finalValue: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
  sharesToday: number;
  dividendsEarned: number;
  series: PricePoint[];
  benchmarkSeries: PricePoint[];
  benchmarkFinalValue: number;
};

export type StressHoldingResult = {
  ticker: string;
  weight: number;
  lossPct: number;
  recoveryDays: number | null;
  contributionToDrawdown: number;
};

export type StressScenarioResult = {
  scenario: Scenario;
  series: PricePoint[];
  benchmarkSeries: PricePoint[];
  startValue: number;
  endValue: number;
  bottomValue: number;
  bottomDate: string;
  recoveryDate: string | null;
  daysToBottom: number;
  daysToRecovery: number | null;
  drawdownPct: number;
  worstDay: { date: string; pct: number } | null;
  holdings: StressHoldingResult[];
};
