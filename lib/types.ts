export type Recommendation =
  | "Strong Sell"
  | "Sell"
  | "Hold"
  | "Buy"
  | "Strong Buy";

export type AiAnalysis = {
  score: number; // 1-10
  recommendation: Recommendation;
  bull_case: string[];
  bear_case: string[];
  key_risks: string[];
  summary: string;
  generated_at: string; // ISO
  cached: boolean;
};

export function recommendationFromScore(score: number): Recommendation {
  if (score <= 2) return "Strong Sell";
  if (score <= 4) return "Sell";
  if (score <= 6) return "Hold";
  if (score <= 8) return "Buy";
  return "Strong Buy";
}
