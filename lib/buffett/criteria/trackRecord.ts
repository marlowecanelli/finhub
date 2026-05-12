import type { BuffettCriterion, FundamentalsSnapshot } from "../types";
import { CRITERION_WEIGHTS } from "../weights";
import { cagr } from "../fundamentals";

export function scoreTrackRecord(snap: FundamentalsSnapshot): BuffettCriterion {
  const weight = CRITERION_WEIGHTS["trackRecord"] ?? 0.8;

  const allAnnuals = snap.annuals.slice(-10);
  const profitableYears = allAnnuals.filter(
    (a) => a.netIncome != null && a.netIncome > 0
  ).length;
  const totalYears = allAnnuals.length;

  const profitRatio = totalYears > 0 ? profitableYears / totalYears : 0;
  let profitScore: number;
  if (profitRatio >= 0.8) profitScore = 10;
  else if (profitRatio >= 0.6) profitScore = 6;
  else if (profitRatio >= 0.4) profitScore = 3;
  else profitScore = 0;

  // 5-year price CAGR
  let priceScore = 5;
  let priceCagrStr = "N/A";
  const history = snap.priceHistory;
  if (history.length >= 100) {
    const firstItem = history[0];
    const lastItem = history[history.length - 1];
    if (firstItem != null && lastItem != null) {
      const firstClose = firstItem.close;
      const lastClose = lastItem.close;
      const yearsOfData =
        (new Date(lastItem.date).getTime() - new Date(firstItem.date).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);
      const priceCagr = cagr(firstClose, lastClose, yearsOfData);
      if (priceCagr != null) {
        priceCagrStr = `${(priceCagr * 100).toFixed(1)}%`;
        if (priceCagr >= 0.10) priceScore = 10;
        else if (priceCagr >= 0.05) priceScore = 8;
        else if (priceCagr >= 0) priceScore = 5;
        else priceScore = 2;
      }
    }
  }

  // Dividend streak bonus
  let divBonus = 0;
  let divStr = "no dividend";
  if (snap.dividendHistory.length > 0) {
    const years = new Set(snap.dividendHistory.map((d) => d.date.slice(0, 4)));
    if (years.size >= 10) {
      divBonus = 1;
      divStr = `${years.size}+ yr dividend history`;
    } else {
      divStr = `${years.size}-yr dividend history`;
    }
  }

  const baseScore = (profitScore + priceScore) / 2;
  const score = Math.min(10, Math.round((baseScore + divBonus) * 10) / 10);

  let status: BuffettCriterion["status"];
  if (score >= 7) status = "pass";
  else if (score >= 4) status = "partial";
  else status = "fail";

  return {
    id: "trackRecord",
    name: "Long-Term Track Record",
    status,
    score,
    weight,
    actual: `Profitable ${profitableYears}/${totalYears} yrs · 5Y CAGR ${priceCagrStr} · ${divStr}`,
    threshold: "Profitable ≥ 8/10 years · positive 5Y price CAGR · 10+ yr dividend bonus",
    explanation:
      status === "pass"
        ? `A ${profitableYears}/${totalYears} profitability record and ${priceCagrStr} 5-year price CAGR confirm this business has genuinely compounded value over time.`
        : status === "partial"
        ? "The track record shows resilience but with some gaps — either cyclical losses or sluggish long-term price appreciation."
        : "The track record shows too many unprofitable years or negative long-term price performance to meet Buffett's durability standard.",
    source: "calculated",
  };
}
