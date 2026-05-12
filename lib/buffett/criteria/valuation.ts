import type { BuffettCriterion, FundamentalsSnapshot } from "../types";
import { CRITERION_WEIGHTS } from "../weights";
import { cagr } from "../fundamentals";
import { computeDcf } from "../dcf";

export function scoreValuation(snap: FundamentalsSnapshot): BuffettCriterion {
  const weight = CRITERION_WEIGHTS["valuation"] ?? 1.3;

  if (!snap.currentPrice || snap.currentPrice <= 0) {
    return {
      id: "valuation",
      name: "Reasonable Valuation",
      status: "partial",
      score: 5,
      weight,
      actual: "No current price",
      threshold: "FCF yield > 5% · price < intrinsic value",
      explanation: "Current price unavailable; unable to compute valuation metrics.",
      source: "calculated",
    };
  }

  const recents = snap.annuals.slice(-5);
  const subScores: number[] = [];
  const details: string[] = [];

  // ── Sub-check 1: P/E ──────────────────────────────────────────────────────
  if (snap.peRatio != null && snap.peRatio > 0) {
    const pe = snap.peRatio;
    let peScore: number;
    if (pe < 15) peScore = 10;
    else if (pe < 20) peScore = 8;
    else if (pe < 25) peScore = 6;
    else if (pe < 35) peScore = 3;
    else peScore = 0;
    subScores.push(peScore);
    details.push(`P/E ${pe.toFixed(1)}x`);
  }

  // ── Sub-check 2: FCF yield ────────────────────────────────────────────────
  const lastAnnual = recents[recents.length - 1];
  const fcf = snap.fcfTTM ?? lastAnnual?.fcf ?? null;
  const shares = snap.currentSharesOutstanding ?? lastAnnual?.sharesOutstanding ?? null;

  if (fcf != null && shares != null && shares > 0) {
    const fcfPerShare = fcf / shares;
    const fcfYield = fcfPerShare / snap.currentPrice;
    let fcfScore: number;
    if (fcfYield >= 0.08) fcfScore = 10;
    else if (fcfYield >= 0.05) fcfScore = 8;
    else if (fcfYield >= 0.03) fcfScore = 4;
    else if (fcfYield >= 0.01) fcfScore = 2;
    else fcfScore = 0;
    subScores.push(fcfScore);
    details.push(`FCF yield ${(fcfYield * 100).toFixed(1)}%`);
  }

  // ── Sub-check 3: DCF ──────────────────────────────────────────────────────
  if (fcf != null && fcf > 0 && shares != null && shares > 0) {
    const fcfHistory = recents.map((a) => a.fcf).filter((v): v is number => v != null);
    let fcfCagr: number | null = null;
    if (fcfHistory.length >= 2) {
      const firstFcf = fcfHistory[0] ?? 1;
      const lastFcf = fcfHistory[fcfHistory.length - 1] ?? 1;
      fcfCagr = cagr(Math.max(firstFcf, 1), Math.max(lastFcf, 1), fcfHistory.length - 1);
    }

    const dcf = computeDcf({
      fcfTTM: fcf,
      fcfCagrHistory: fcfCagr,
      sharesOutstanding: shares,
    });

    if (dcf) {
      const intrinsic = dcf.intrinsicValuePerShare;
      const marginOfSafety = (intrinsic - snap.currentPrice) / intrinsic;
      let dcfScore: number;
      if (marginOfSafety >= 0.20) dcfScore = 10;
      else if (marginOfSafety >= 0.0) dcfScore = 6;
      else if (marginOfSafety >= -0.15) dcfScore = 3;
      else dcfScore = 0;
      subScores.push(dcfScore);
      const mos = (marginOfSafety * 100).toFixed(0);
      details.push(
        `DCF $${intrinsic.toFixed(0)} (${marginOfSafety >= 0 ? "+" : ""}${mos}%)`
      );
    }
  }

  if (subScores.length === 0) {
    return {
      id: "valuation",
      name: "Reasonable Valuation",
      status: "partial",
      score: 5,
      weight,
      actual: "Insufficient financial data",
      threshold: "P/E < 20 · FCF yield > 5% · price < intrinsic",
      explanation: "Valuation sub-checks could not be computed due to insufficient financial data.",
      source: "calculated",
    };
  }

  const score = Math.round((subScores.reduce((a, b) => a + b, 0) / subScores.length) * 10) / 10;

  let status: BuffettCriterion["status"];
  if (score >= 7) status = "pass";
  else if (score >= 4) status = "partial";
  else status = "fail";

  return {
    id: "valuation",
    name: "Reasonable Valuation",
    status,
    score,
    weight,
    actual: details.join(" · "),
    threshold: "P/E < 20 · FCF yield > 5% · price < DCF intrinsic",
    explanation:
      status === "pass"
        ? "Valuation metrics suggest the stock is attractively priced relative to its intrinsic value — a classic Buffett margin of safety."
        : status === "partial"
        ? "Valuation is reasonable but not deeply discounted; some metrics pass while others suggest fair or full pricing."
        : "The stock appears overvalued relative to earnings, free cash flow, or a conservative DCF — limited margin of safety.",
    source: "calculated",
  };
}
