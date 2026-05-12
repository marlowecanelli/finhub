import type { BuffettCriterion, FundamentalsSnapshot } from "../types";
import { CRITERION_WEIGHTS } from "../weights";

export function scoreROE(snap: FundamentalsSnapshot): BuffettCriterion {
  const weight = CRITERION_WEIGHTS["roe"] ?? 1.2;
  const recents = snap.annuals.slice(-5);

  const roeValues = recents
    .map((a) => {
      if (a.roe != null) return a.roe;
      if (a.netIncome != null && a.equity != null && a.equity !== 0) {
        return a.netIncome / a.equity;
      }
      return null;
    })
    .filter((v): v is number => v != null);

  if (roeValues.length < 2) {
    return {
      id: "roe",
      name: "Strong Return on Equity",
      status: "partial",
      score: 5,
      weight,
      actual: "Insufficient data",
      threshold: "5-year avg ROE > 15%",
      explanation: "Insufficient equity or net income data to compute multi-year ROE.",
      source: "calculated",
    };
  }

  const avgRoe = roeValues.reduce((a, b) => a + b, 0) / roeValues.length;
  const avgRoePct = avgRoe * 100;

  let score: number;
  let status: BuffettCriterion["status"];

  if (avgRoe >= 0.15) {
    score = Math.min(10, 5 + (avgRoe - 0.15) / 0.15 * 5);
    status = "pass";
  } else if (avgRoe >= 0.10) {
    score = ((avgRoe - 0.10) / 0.05) * 5;
    status = "partial";
  } else {
    score = Math.max(0, avgRoe / 0.10 * 2);
    status = "fail";
  }

  score = Math.round(score * 10) / 10;

  return {
    id: "roe",
    name: "Strong Return on Equity",
    status,
    score,
    weight,
    actual: `${roeValues.length}-year avg ROE: ${avgRoePct.toFixed(1)}%`,
    threshold: "Avg ROE > 15% (pass) · 10–15% (partial) · < 10% (fail)",
    explanation:
      avgRoe >= 0.15
        ? `A ${avgRoePct.toFixed(1)}% average ROE over ${roeValues.length} years demonstrates that management consistently earns exceptional returns on shareholders' capital.`
        : avgRoe >= 0.10
        ? `An average ROE of ${avgRoePct.toFixed(1)}% is adequate but falls short of Buffett's 15% threshold for truly outstanding capital efficiency.`
        : `An average ROE of ${avgRoePct.toFixed(1)}% falls below the 10% minimum — the business is not earning attractive returns on equity.`,
    source: "calculated",
  };
}
