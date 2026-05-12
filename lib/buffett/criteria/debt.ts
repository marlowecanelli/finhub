import type { BuffettCriterion, FundamentalsSnapshot } from "../types";
import { CRITERION_WEIGHTS } from "../weights";

export function scoreDebt(snap: FundamentalsSnapshot): BuffettCriterion {
  const weight = CRITERION_WEIGHTS["debt"] ?? 1.0;
  const latest = snap.annuals[snap.annuals.length - 1] ?? null;

  const equity = latest?.equity ?? null;
  const totalDebt = latest?.totalDebt ?? null;
  const longTermDebt = latest?.longTermDebt ?? null;
  const netIncome = latest?.netIncome ?? null;

  if (equity == null || totalDebt == null) {
    return {
      id: "debt",
      name: "Low Debt",
      status: "partial",
      score: 5,
      weight,
      actual: "Insufficient balance sheet data",
      threshold: "D/E < 0.5 or LT debt < 2× net income",
      explanation: "Balance sheet data unavailable; debt criterion scored neutral.",
      source: "calculated",
    };
  }

  const deRatio = equity !== 0 ? totalDebt / equity : null;

  const ltDebtToIncome =
    longTermDebt != null && netIncome != null && netIncome > 0
      ? longTermDebt / netIncome
      : null;

  const dePass = deRatio != null && deRatio < 0.5;
  const ltPass = ltDebtToIncome != null && ltDebtToIncome < 2.0;

  const passes = dePass || ltPass;
  const fails =
    (deRatio != null && deRatio > 1.0) &&
    (ltDebtToIncome == null || ltDebtToIncome >= 4.0);

  let score: number;
  let status: BuffettCriterion["status"];

  if (passes) {
    const dePct = deRatio != null ? 1 - Math.min(deRatio / 0.5, 1) : 1;
    score = 7 + dePct * 3;
    status = "pass";
  } else if (!fails) {
    score = 5;
    status = "partial";
  } else {
    score = deRatio != null ? Math.max(0, 5 - ((deRatio - 1.0) / 1.0) * 5) : 2;
    status = "fail";
  }

  score = Math.round(score * 10) / 10;

  const deStr = deRatio != null ? deRatio.toFixed(2) : "N/A";
  const ltStr = ltDebtToIncome != null ? `${ltDebtToIncome.toFixed(1)}× income` : "N/A";

  return {
    id: "debt",
    name: "Low Debt",
    status,
    score,
    weight,
    actual: `D/E: ${deStr} · LT Debt: ${ltStr}`,
    threshold: "D/E < 0.5 or LT debt < 2× net income",
    explanation:
      passes
        ? `With a D/E ratio of ${deStr}, the balance sheet carries minimal leverage — giving management flexibility to invest opportunistically.`
        : fails
        ? `A D/E ratio of ${deStr} signals heavy leverage that Buffett would view as a structural vulnerability during downturns.`
        : `Debt levels are moderate — neither concerning enough to fail nor lean enough to pass Buffett's conservative threshold.`,
    source: "calculated",
  };
}
