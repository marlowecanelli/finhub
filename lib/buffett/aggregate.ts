import type { BuffettCriterion, BuffettLabel } from "./types";
import { TOTAL_WEIGHT, getLabel } from "./weights";

export function aggregateScore(criteria: BuffettCriterion[]): {
  overall: number;
  label: BuffettLabel;
} {
  if (criteria.length === 0) return { overall: 5.0, label: "Neutral" };

  const weightedSum = criteria.reduce(
    (acc, c) => acc + c.score * c.weight,
    0
  );
  const totalUsedWeight = criteria.reduce((acc, c) => acc + c.weight, 0);

  // Use actual total weight (TOTAL_WEIGHT) as denominator so missing
  // criteria don't artificially inflate the score
  const raw = (weightedSum / TOTAL_WEIGHT) * (totalUsedWeight / TOTAL_WEIGHT > 0.5 ? 1 : 0.9);
  const clamped = Math.max(1.0, Math.min(10.0, raw));
  const overall = Math.round(clamped * 10) / 10;

  return { overall, label: getLabel(overall) };
}
