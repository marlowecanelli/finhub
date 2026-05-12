import type { BuffettLabel } from "./types";

export const CRITERION_WEIGHTS: Record<string, number> = {
  moat: 1.5,
  earningsGrowth: 1.0,
  roe: 1.2,
  debt: 1.0,
  margins: 1.0,
  predictability: 1.0,
  management: 1.2,
  capitalAllocation: 1.0,
  valuation: 1.3,
  trackRecord: 0.8,
};

// Must equal 11.0
export const TOTAL_WEIGHT = Object.values(CRITERION_WEIGHTS).reduce(
  (sum, w) => sum + w,
  0
);

export function getLabel(score: number): BuffettLabel {
  if (score >= 8.5) return "Highly Buffett-Worthy";
  if (score >= 6.5) return "Buffett-Worthy";
  if (score >= 5.0) return "Neutral";
  if (score >= 3.0) return "Avoid";
  return "Strongly Avoid";
}

export const LABEL_GOLD: Record<BuffettLabel, string> = {
  "Highly Buffett-Worthy": "#2F6B43",
  "Buffett-Worthy": "#3A7D55",
  Neutral: "#B8862B",
  Avoid: "#8C4A2A",
  "Strongly Avoid": "#8C2A2A",
};

export const DISCLAIMER =
  "This score is an algorithmic interpretation of publicly known investment criteria associated with Warren Buffett. It is not endorsed by Berkshire Hathaway or Mr. Buffett. Not investment advice.";
