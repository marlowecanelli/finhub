import type { BuffettCriterion, FundamentalsSnapshot, AiAssessment } from "../types";
import { CRITERION_WEIGHTS } from "../weights";

export function scoreManagement(snap: FundamentalsSnapshot, ai: AiAssessment | null): BuffettCriterion {
  const weight = CRITERION_WEIGHTS["management"] ?? 1.2;

  // ── Quantitative component (50%) ──────────────────────────────────────────
  let quantScore = 5;
  const quantDetails: string[] = [];

  const latestAnnual = snap.annuals[snap.annuals.length - 1];
  const latestRoic = snap.roicCurrent ?? latestAnnual?.roic ?? null;
  if (latestRoic != null) {
    const roicPct = latestRoic * 100;
    if (roicPct >= 15) quantScore += 2;
    else if (roicPct >= 12) quantScore += 1;
    else if (roicPct < 8) quantScore -= 2;
    quantDetails.push(`ROIC ${roicPct.toFixed(1)}%`);
  }

  if (snap.insiderOwnershipPct != null) {
    const pct = snap.insiderOwnershipPct * 100;
    if (pct >= 10) quantScore += 2;
    else if (pct >= 5) quantScore += 1;
    else if (pct < 1) quantScore -= 1;
    quantDetails.push(`Insider ${pct.toFixed(1)}%`);
    if (snap.founderLed) {
      quantScore += 1;
      quantDetails.push("founder-led");
    }
  }

  quantScore = Math.max(0, Math.min(10, quantScore));

  if (!ai) {
    const status = quantScore >= 7 ? "pass" : quantScore >= 4 ? "partial" : "fail";
    return {
      id: "management",
      name: "Capable Management",
      status,
      score: Math.round(quantScore * 10) / 10,
      weight,
      actual: quantDetails.join(" · ") || "Quantitative only",
      threshold: "ROIC > 12% · Insider ownership > 5% · founder-led bonus",
      explanation:
        "AI qualitative assessment unavailable; scored on quantitative signals (ROIC and insider ownership) only.",
      source: "hybrid",
    };
  }

  const aiScore = Math.max(0, Math.min(10, ai.management.score));
  const blended = (quantScore + aiScore) / 2;
  const score = Math.round(blended * 10) / 10;
  const status = score >= 7 ? "pass" : score >= 4 ? "partial" : "fail";

  return {
    id: "management",
    name: "Capable Management",
    status,
    score,
    weight,
    actual: quantDetails.join(" · "),
    threshold: "ROIC > 12% · Insider ownership > 5% · disciplined capital allocation",
    explanation: (ai.management.reasoning.split(". ")[0] ?? ai.management.reasoning) + ".",
    source: "hybrid",
    reasoning: ai.management.reasoning,
  };
}
