import YahooFinance from "yahoo-finance2";

type QuoteSummaryModules =
  | "assetProfile" | "balanceSheetHistory" | "balanceSheetHistoryQuarterly"
  | "calendarEvents" | "cashflowStatementHistory" | "cashflowStatementHistoryQuarterly"
  | "defaultKeyStatistics" | "earnings" | "earningsHistory" | "earningsTrend"
  | "financialData" | "fundOwnership" | "fundPerformance" | "fundProfile"
  | "incomeStatementHistory" | "incomeStatementHistoryQuarterly"
  | "indexTrend" | "industryTrend"
  | "insiderHolders" | "insiderTransactions" | "institutionOwnership"
  | "majorDirectHolders" | "majorHoldersBreakdown" | "netSharePurchaseActivity"
  | "price" | "quoteType" | "recommendationTrend" | "secFilings" | "sectorTrend"
  | "summaryDetail" | "summaryProfile" | "topHoldings" | "upgradeDowngradeHistory";

export const yf = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  validation: { logErrors: false, logOptionsErrors: false },
});

export async function safeQuoteSummary(
  symbol: string,
  modules: QuoteSummaryModules[]
) {
  try {
    return await yf.quoteSummary(symbol, { modules });
  } catch {
    return null;
  }
}

export async function safeQuote(symbol: string) {
  try {
    return await yf.quote(symbol);
  } catch {
    return null;
  }
}

export async function safeChart(symbol: string, period1: Date, interval: "1d" | "1wk" | "1mo" = "1d") {
  try {
    const res = await yf.chart(symbol, { period1, interval });
    return res?.quotes ?? [];
  } catch {
    return [];
  }
}
