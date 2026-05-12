import type { BuffettCriterion, FundamentalsSnapshot } from "../types";
import { CRITERION_WEIGHTS } from "../weights";
import { linearSlope } from "../fundamentals";

export function scoreMargins(snap: FundamentalsSnapshot): BuffettCriterion {
  const weight = CRITERION_WEIGHTS["margins"] ?? 1.0;
  const recents = snap.annuals.slice(-5);

  const marginValues = recents
    .map((a) => {
      if (a.netMargin != null) return a.netMargin;
      if (a.netIncome != null && a.revenue != null && a.revenue !== 0) {
        return a.netIncome / a.revenue;
      }
      return null;
    })
    .filter((v): v is number => v != null);

  if (marginValues.length < 2) {
    return {
      id: "margins",
      name: "High Profit Margins",
      status: "partial",
      score: 5,
      weight,
      actual: "Insufficient data",
      threshold: "Net margin > 10% + stable/expanding",
      explanation: "Insufficient margin history to assess consistency.",
      source: "calculated",
    };
  }

  const avgMargin = marginValues.reduce((a, b) => a + b, 0) / marginValues.length;
  const xs = marginValues.map((_, i) => i);
  const slope = linearSlope(xs, marginValues);
  const isExpanding = slope >= 0;
  const isStable = Math.abs(slope) < 0.005;

  const above10 = avgMargin >= 0.10;
  const above5 = avgMargin >= 0.05;

  let score: number;
  let status: BuffettCriterion["status"];

  if (above10 && (isExpanding || isStable)) {
    score = Math.min(10, 7 + (avgMargin - 0.10) / 0.10 * 3);
    status = "pass";
  } else if (above10 && !isExpanding) {
    score = 5;
    status = "partial";
  } else if (above5 && (isExpanding || isStable)) {
    score = 4;
    status = "partial";
  } else {
    score = Math.max(0, avgMargin / 0.05 * 3);
    status = "fail";
  }

  score = Math.round(score * 10) / 10;

  const avgPct = (avgMargin * 100).toFixed(1);
  const trendStr = isExpanding ? "expanding" : isStable ? "stable" : "contracting";

  return {
    id: "margins",
    name: "High Profit Margins",
    status,
    score,
    weight,
    actual: `Avg net margin: ${avgPct}% · Trend: ${trendStr}`,
    threshold: "Net margin > 10% and stable or expanding",
    explanation:
      status === "pass"
        ? `A ${avgPct}% average net margin that is ${trendStr} signals strong pricing power and disciplined cost management.`
        : above10
        ? `Margins exceed 10% but are contracting — a sign that competitive pressure or rising costs are eroding the moat.`
        : above5
        ? `Net margins in the 5–10% range are acceptable but below Buffett's preferred threshold; trend direction is ${trendStr}.`
        : `Net margins below 5% suggest the business lacks pricing power or operates in a structurally low-margin industry.`,
    source: "calculated",
  };
}
