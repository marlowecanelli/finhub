import type { InsiderTransaction, AnomalyScore, AnomalyFlag, AnomalyLabel } from "@/lib/types/research";

const FLAG_WEIGHTS: Record<AnomalyFlag, number> = {
  LARGE_PURCHASE: 20,
  CEO_BUY: 25,
  CLUSTER_BUY: 20,
  FIRST_PURCHASE: 15,
  NEAR_52W_LOW: 15,
  POST_DECLINE: 15,
  OPEN_MARKET_ONLY: 10,
};

function scoreToLabel(score: number): AnomalyLabel {
  if (score >= 70) return "high-conviction";
  if (score >= 45) return "significant";
  if (score >= 20) return "notable";
  return "routine";
}

export function scoreInsiderTransaction(tx: InsiderTransaction): AnomalyScore {
  const flags: AnomalyFlag[] = [];

  if (tx.transactionType !== "PURCHASE") {
    return { score: 0, flags: [], label: "routine" };
  }

  if (tx.isOptionExercise || tx.isGift) {
    return { score: 0, flags: [], label: "routine" };
  }

  flags.push("OPEN_MARKET_ONLY");

  if (tx.totalValue > 500_000) flags.push("LARGE_PURCHASE");

  if (tx.insiderRole === "CEO" || tx.insiderRole === "President") {
    flags.push("CEO_BUY");
  }

  if (!tx.priorPurchaseDate) flags.push("FIRST_PURCHASE");

  const pctOf52wRange =
    (tx.stockPriceCurrent - tx.stock52wLow) /
    Math.max(1, tx.stock52wHigh - tx.stock52wLow);
  if (pctOf52wRange < 0.1) flags.push("NEAR_52W_LOW");

  if (tx.stockPriceChange60d < -20) flags.push("POST_DECLINE");

  const score = Math.min(
    100,
    flags.reduce((s, f) => s + FLAG_WEIGHTS[f], 0)
  );

  return { score, flags, label: scoreToLabel(score) };
}

export function scoreTransactionBatch(
  transactions: InsiderTransaction[],
  windowDays = 7
): InsiderTransaction[] {
  const companyBuys: Record<string, InsiderTransaction[]> = {};

  for (const tx of transactions) {
    if (tx.transactionType === "PURCHASE" && !tx.isOptionExercise && !tx.isGift) {
      if (!companyBuys[tx.ticker]) companyBuys[tx.ticker] = [];
      companyBuys[tx.ticker]!.push(tx);
    }
  }

  return transactions.map(tx => {
    const baseScore = scoreInsiderTransaction(tx);

    const clusterBuy =
      tx.transactionType === "PURCHASE" &&
      (companyBuys[tx.ticker]?.filter(other => {
        if (other.id === tx.id) return false;
        const diffMs = Math.abs(
          tx.transactionDate.getTime() - other.transactionDate.getTime()
        );
        return diffMs < windowDays * 24 * 60 * 60 * 1000;
      }).length ?? 0) >= 2;

    let flags = baseScore.flags;
    let score = baseScore.score;

    if (clusterBuy && !flags.includes("CLUSTER_BUY")) {
      flags = [...flags, "CLUSTER_BUY"];
      score = Math.min(100, score + FLAG_WEIGHTS.CLUSTER_BUY);
    }

    return {
      ...tx,
      anomalyScore: { score, flags, label: scoreToLabel(score) },
    };
  });
}
