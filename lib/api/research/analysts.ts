import { getOrFetch } from "@/lib/cache";
import { safeQuoteSummary } from "./yahoo";
import type { AnalystConsensus, AnalystRating, AnalystRatingChange } from "@/lib/types/research";

const RATINGS: AnalystRating[] = ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];

function fromYahooRecKey(key: string | undefined): AnalystRating | null {
  switch ((key ?? "").toLowerCase().replace(/[\s_-]/g, "")) {
    case "strongbuy": return "Strong Buy";
    case "buy": case "outperform": case "overweight": case "positive": case "accumulate": return "Buy";
    case "hold": case "neutral": case "marketperform": case "equalweight": case "peerperform": return "Hold";
    case "sell": case "underperform": case "underweight": case "negative": case "reduce": return "Sell";
    case "strongsell": return "Strong Sell";
    default: return null;
  }
}

function meanToRating(mean: number | undefined): AnalystRating {
  if (mean == null) return "Hold";
  if (mean <= 1.5) return "Strong Buy";
  if (mean <= 2.5) return "Buy";
  if (mean <= 3.5) return "Hold";
  if (mean <= 4.5) return "Sell";
  return "Strong Sell";
}

export async function fetchAnalystConsensus(ticker: string): Promise<AnalystConsensus | null> {
  const symbol = ticker.toUpperCase();
  return getOrFetch(
    `analysts:${symbol}`,
    async () => {
      const summary = await safeQuoteSummary(symbol, [
        "financialData",
        "recommendationTrend",
        "upgradeDowngradeHistory",
        "price",
        "earningsTrend",
      ]);
      if (!summary) return null;

      const fin = summary.financialData;
      const recTrend = summary.recommendationTrend?.trend ?? [];
      const latest = recTrend[0];

      const distribution = {
        "Strong Buy": latest?.strongBuy ?? 0,
        "Buy": latest?.buy ?? 0,
        "Hold": latest?.hold ?? 0,
        "Sell": latest?.sell ?? 0,
        "Strong Sell": latest?.strongSell ?? 0,
      } as Record<AnalystRating, number>;

      const totalAnalysts = RATINGS.reduce((s, r) => s + distribution[r], 0);
      const meanRec = typeof fin?.recommendationMean === "number" ? fin.recommendationMean : undefined;

      const consensus: AnalystRating = totalAnalysts > 0
        ? RATINGS.reduce((best, r) => distribution[r] > distribution[best] ? r : best, "Hold" as AnalystRating)
        : meanToRating(meanRec);

      const currentPrice =
        summary.price?.regularMarketPrice ??
        (typeof fin?.currentPrice === "number" ? fin.currentPrice : 0);
      const lowTarget = typeof fin?.targetLowPrice === "number" ? fin.targetLowPrice : 0;
      const medianTarget = typeof fin?.targetMedianPrice === "number" ? fin.targetMedianPrice : 0;
      const highTarget = typeof fin?.targetHighPrice === "number" ? fin.targetHighPrice : 0;

      const history = (summary.upgradeDowngradeHistory?.history ?? [])
        .slice()
        .sort((a, b) => {
          const ad = a.epochGradeDate instanceof Date ? a.epochGradeDate.getTime() : 0;
          const bd = b.epochGradeDate instanceof Date ? b.epochGradeDate.getTime() : 0;
          return bd - ad;
        })
        .slice(0, 12);

      const recentChanges: AnalystRatingChange[] = history.map((h, i) => {
        const newRating = fromYahooRecKey(h.toGrade) ?? "Hold";
        const previousRating = fromYahooRecKey(h.fromGrade) ?? newRating;
        const date = h.epochGradeDate instanceof Date ? h.epochGradeDate : new Date();
        return {
          id: `chg-${symbol}-${i}-${date.getTime()}`,
          firm: h.firm ?? "—",
          analyst: h.firm ?? "—",
          previousRating,
          newRating,
          previousPriceTarget: undefined,
          newPriceTarget: undefined,
          changeDate: date,
          firmAccuracyScore: 0,
        };
      });

      const earningsTrend = summary.earningsTrend?.trend ?? [];
      const epsRevisions = earningsTrend
        .filter(t => typeof t.earningsEstimate?.avg === "number")
        .map(t => {
          const end = t.endDate;
          const dateStr = end instanceof Date
            ? end.toISOString().slice(0, 10)
            : typeof end === "string" ? end : "";
          return { date: dateStr, estimate: t.earningsEstimate!.avg as number };
        })
        .filter(r => r.date)
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        ticker: symbol,
        companyName: summary.price?.longName ?? summary.price?.shortName ?? symbol,
        consensus,
        distribution,
        lowTarget,
        medianTarget,
        highTarget,
        currentPrice,
        recentChanges,
        epsRevisions,
      };
    },
    15 * 60 * 1000,
  );
}
