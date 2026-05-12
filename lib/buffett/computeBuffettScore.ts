import type { BuffettScoreResponse } from "./types";
import { getFundamentals } from "./fundamentals";
import { runAiAssessment } from "./ai";
import { scoreEarningsGrowth } from "./criteria/earningsGrowth";
import { scoreROE } from "./criteria/roe";
import { scoreDebt } from "./criteria/debt";
import { scoreMargins } from "./criteria/margins";
import { scoreCapitalAllocation } from "./criteria/capitalAllocation";
import { scoreValuation } from "./criteria/valuation";
import { scoreTrackRecord } from "./criteria/trackRecord";
import { scoreMoat } from "./criteria/moat";
import { scorePredictability } from "./criteria/predictability";
import { scoreManagement } from "./criteria/management";
import { aggregateScore } from "./aggregate";
import { getQuoteForTicker } from "./quotes";
import { DISCLAIMER } from "./weights";

export type ComputeResult =
  | { ok: true; score: BuffettScoreResponse }
  | { ok: false; reason: string };

export async function computeBuffettScore(ticker: string): Promise<ComputeResult> {
  const sym = ticker.toUpperCase();

  // 1. Fetch fundamentals
  const snap = await getFundamentals(sym);
  if (!snap) {
    return { ok: false, reason: "insufficient_history" };
  }

  // 2. Run the single Claude call covering all 3 AI criteria
  const ai = await runAiAssessment(snap).catch(() => null);

  // 3. Score all 10 criteria (deterministic + AI-assisted in parallel is fine
  //    since the AI call is already done)
  const criteria = [
    scoreMoat(snap, ai),
    scoreEarningsGrowth(snap),
    scoreROE(snap),
    scoreDebt(snap),
    scoreMargins(snap),
    scorePredictability(snap, ai),
    scoreManagement(snap, ai),
    scoreCapitalAllocation(snap),
    scoreValuation(snap),
    scoreTrackRecord(snap),
  ];

  // 4. Aggregate
  const { overall, label } = aggregateScore(criteria);

  // 5. Rotating quote
  const quote = getQuoteForTicker(sym);

  const response: BuffettScoreResponse = {
    ticker: sym,
    companyName: snap.companyName,
    sector: snap.sector,
    computedAt: new Date().toISOString(),
    overall,
    label,
    criteria,
    quote,
    disclaimer: DISCLAIMER,
    dataAsOf: snap.dataAsOf,
  };

  return { ok: true, score: response };
}
