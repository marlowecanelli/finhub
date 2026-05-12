import type { BuffettCriterion, FundamentalsSnapshot, AiAssessment } from "../types";
import { CRITERION_WEIGHTS } from "../weights";

export function scorePredictability(snap: FundamentalsSnapshot, ai: AiAssessment | null): BuffettCriterion {
  const weight = CRITERION_WEIGHTS["predictability"] ?? 1.0;

  if (!ai) {
    return {
      id: "predictability",
      name: "Predictable Business",
      status: "partial",
      score: 5,
      weight,
      actual: "AI assessment unavailable",
      threshold: "Low revenue/earnings volatility in a stable industry",
      explanation: "Business predictability assessment could not be completed; scored neutral.",
      source: "ai",
    };
  }

  const raw = ai.predictability.score;
  const score = Math.round(Math.max(0, Math.min(10, raw)) * 10) / 10;
  const status = score >= 7 ? "pass" : score >= 4 ? "partial" : "fail";
  const predictabilityLabel = score >= 8 ? "Highly predictable" : score >= 5 ? "Moderately predictable" : "Unpredictable";

  return {
    id: "predictability",
    name: "Predictable Business",
    status,
    score,
    weight,
    actual: `${predictabilityLabel} · ${snap.sector}/${snap.industry}`,
    threshold: "High predictability = pass · Moderate = partial · Cyclical/volatile = fail",
    explanation: (ai.predictability.reasoning.split(". ")[0] ?? ai.predictability.reasoning) + ".",
    source: "ai",
    reasoning: ai.predictability.reasoning,
  };
}
