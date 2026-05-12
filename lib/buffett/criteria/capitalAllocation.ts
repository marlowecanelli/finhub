import type { BuffettCriterion, FundamentalsSnapshot } from "../types";
import { CRITERION_WEIGHTS } from "../weights";

function countDividendRaiseStreak(dividendHistory: { date: string; amount: number }[]): number {
  if (dividendHistory.length < 4) return 0;

  const byYear: Map<number, number> = new Map();
  for (const d of dividendHistory) {
    const year = parseInt(d.date.slice(0, 4), 10);
    byYear.set(year, Math.max(byYear.get(year) ?? 0, d.amount));
  }

  const years = Array.from(byYear.entries()).sort((a, b) => b[0] - a[0]);
  let streak = 0;
  for (let i = 0; i < years.length - 1; i++) {
    const curr = years[i];
    const prev = years[i + 1];
    if (curr == null || prev == null) break;
    if (curr[1] >= prev[1]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function scoreCapitalAllocation(snap: FundamentalsSnapshot): BuffettCriterion {
  const weight = CRITERION_WEIGHTS["capitalAllocation"] ?? 1.0;
  const recents = snap.annuals.slice(-5);

  // ── Sub-check 1: Share count trend ──────────────────────────────────────────
  const shareValues = recents
    .map((a) => a.sharesOutstanding)
    .filter((v): v is number => v != null);

  let shareScore = 5;
  if (shareValues.length >= 2) {
    const first = shareValues[0] ?? 0;
    const last = shareValues[shareValues.length - 1] ?? 0;
    if (last < first) {
      const decline = first > 0 ? (first - last) / first : 0;
      shareScore = Math.min(10, 7 + decline / 0.1 * 3);
    } else if (first > 0 && last > first * 1.1) {
      shareScore = 2;
    } else {
      shareScore = 5;
    }
  }

  // ── Sub-check 2: Dividend raise streak ──────────────────────────────────────
  const streak = countDividendRaiseStreak(snap.dividendHistory);
  let divScore: number;
  if (streak >= 10) divScore = 10;
  else if (streak >= 5) divScore = 8;
  else if (streak >= 2) divScore = 5;
  else if (snap.dividendHistory.length === 0) divScore = 5;
  else divScore = 2;

  // ── Sub-check 3: SBC as % of revenue ────────────────────────────────────────
  const sbcRatios = recents
    .map((a) => {
      if (a.sbc != null && a.revenue != null && a.revenue > 0) {
        return Math.abs(a.sbc) / a.revenue;
      }
      return null;
    })
    .filter((v): v is number => v != null);

  let sbcScore = 7;
  if (sbcRatios.length > 0) {
    const avgSbc = sbcRatios.reduce((a, b) => a + b, 0) / sbcRatios.length;
    if (avgSbc < 0.03) sbcScore = 10;
    else if (avgSbc < 0.05) sbcScore = 7;
    else if (avgSbc < 0.08) sbcScore = 4;
    else sbcScore = 1;
  }

  const composite = (shareScore + divScore + sbcScore) / 3;
  const score = Math.round(composite * 10) / 10;

  let status: BuffettCriterion["status"];
  if (score >= 7) status = "pass";
  else if (score >= 4) status = "partial";
  else status = "fail";

  const firstShare = shareValues[0];
  const lastShare = shareValues[shareValues.length - 1];
  const shareStr =
    shareValues.length >= 2 && firstShare != null && lastShare != null
      ? lastShare < firstShare
        ? "↓ shrinking"
        : "↑ diluting"
      : "N/A";

  const divStr = streak > 0 ? `${streak}-year raise streak` : snap.dividendHistory.length === 0 ? "no dividend" : "no streak";
  const avgSbcDisplay =
    sbcRatios.length > 0
      ? `SBC ${((sbcRatios.reduce((a, b) => a + b, 0) / sbcRatios.length) * 100).toFixed(1)}% of rev`
      : "SBC N/A";

  return {
    id: "capitalAllocation",
    name: "Shareholder-Friendly Capital Allocation",
    status,
    score,
    weight,
    actual: `Shares ${shareStr} · ${divStr} · ${avgSbcDisplay}`,
    threshold: "Shrinking share count · div raise streak ≥ 5 yrs · SBC < 3% revenue",
    explanation:
      status === "pass"
        ? "The combination of declining share count, consistent dividend growth, and restrained stock compensation shows a management team that puts shareholders first."
        : status === "partial"
        ? "Capital allocation is mixed — some shareholder-friendly signals are offset by dilution, stagnant dividends, or elevated compensation."
        : "Rising share count, no dividend growth, or excessive SBC suggest management is not prioritizing shareholder capital discipline.",
    source: "calculated",
  };
}
