import type { BuffettCriterion, FundamentalsSnapshot, AiAssessment } from "../types";
import { CRITERION_WEIGHTS } from "../weights";

export function scoreMoat(snap: FundamentalsSnapshot, ai: AiAssessment | null): BuffettCriterion {
  const weight = CRITERION_WEIGHTS["moat"] ?? 1.5;

  if (!ai) {
    return {
      id: "moat",
      name: "Economic Moat",
      status: "partial",
      score: 5,
      weight,
      actual: "AI assessment unavailable",
      threshold: "Wide moat = 10, Narrow = 6, None = 2",
      explanation: "Moat assessment could not be completed; scored neutral due to unavailable AI assessment.",
      source: "ai",
    };
  }

  const raw = ai.moat.score;
  const score = Math.round(Math.max(0, Math.min(10, raw)) * 10) / 10;
  const status = score >= 7 ? "pass" : score >= 4 ? "partial" : "fail";
  const widthLabel = score >= 8 ? "Wide" : score >= 5 ? "Narrow" : "None";

  return {
    id: "moat",
    name: "Economic Moat",
    status,
    score,
    weight,
    actual: `AI assessment: ${widthLabel} moat (${score.toFixed(1)}/10)`,
    threshold: "Wide moat (≥8) = pass · Narrow (4–7) = partial · None (<4) = fail",
    explanation: (ai.moat.reasoning.split(". ")[0] ?? ai.moat.reasoning) + ".",
    source: "ai",
    reasoning: ai.moat.reasoning,
  };
}
