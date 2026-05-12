import type { BuffettCriterion, FundamentalsSnapshot } from "../types";
import { CRITERION_WEIGHTS } from "../weights";
import { cagr } from "../fundamentals";

export function scoreEarningsGrowth(snap: FundamentalsSnapshot): BuffettCriterion {
  const weight = CRITERION_WEIGHTS["earningsGrowth"] ?? 1.0;
  const recents = snap.annuals.slice(-5);

  if (recents.length < 3) {
    return {
      id: "earningsGrowth",
      name: "Consistent Earnings Growth",
      status: "partial",
      score: 5,
      weight,
      actual: "Insufficient history",
      threshold: "5 profitable years + EPS CAGR > 5%",
      explanation: "Less than 3 years of earnings data available; unable to assess consistency.",
      source: "calculated",
    };
  }

  const epsValues = recents.map((a) => a.eps);
  const hasAllEps = epsValues.every((e) => e != null);
  const allPositive = epsValues.every((e) => e != null && e > 0);

  const firstEps = epsValues[0] ?? null;
  const lastEps = epsValues[epsValues.length - 1] ?? null;
  const years = recents.length - 1;
  const epsCagr =
    firstEps != null && lastEps != null && firstEps > 0 && lastEps > 0
      ? cagr(firstEps, lastEps, years)
      : null;

  const growthPass = epsCagr != null && epsCagr >= 0.05;

  let score: number;
  let status: BuffettCriterion["status"];

  if (allPositive && growthPass) {
    score = 10;
    status = "pass";
  } else if (allPositive || growthPass) {
    score = 5;
    status = "partial";
  } else {
    score = 0;
    status = "fail";
  }

  const cagrStr = epsCagr != null ? `${(epsCagr * 100).toFixed(1)}%` : "N/A";
  const posYears = epsValues.filter((e) => e != null && e > 0).length;

  return {
    id: "earningsGrowth",
    name: "Consistent Earnings Growth",
    status,
    score,
    weight,
    actual: `${posYears}/${recents.length} profitable years · EPS CAGR ${cagrStr}`,
    threshold: "All years profitable · EPS CAGR > 5%",
    explanation: allPositive && growthPass
      ? `EPS has been positive in all ${recents.length} years with a ${cagrStr} compound annual growth rate — a hallmark of a durable business.`
      : !hasAllEps
      ? "EPS data incomplete; result based on available years."
      : !allPositive
      ? `EPS was negative in ${recents.length - posYears} of the last ${recents.length} years, signaling cyclical or structural risk.`
      : `EPS is consistently positive but the ${cagrStr} CAGR falls below the 5% threshold Buffett associates with compounding quality.`,
    source: "calculated",
  };
}
