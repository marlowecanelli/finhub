import { getOrFetch } from "@/lib/cache";
import { safeQuoteSummary } from "./yahoo";
import type { InsiderTransaction, Sector, InsiderRole, TransactionType } from "@/lib/types/research";

const COMPANIES: { ticker: string; name: string; sector: Sector }[] = [
  { ticker: "NVDA", name: "NVIDIA Corporation",      sector: "Technology" },
  { ticker: "AAPL", name: "Apple Inc.",              sector: "Technology" },
  { ticker: "META", name: "Meta Platforms Inc.",     sector: "Communication" },
  { ticker: "MSFT", name: "Microsoft Corporation",   sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.",          sector: "Communication" },
  { ticker: "JPM",  name: "JPMorgan Chase & Co.",    sector: "Financials" },
  { ticker: "GS",   name: "Goldman Sachs Group",     sector: "Financials" },
  { ticker: "XOM",  name: "Exxon Mobil Corporation", sector: "Energy" },
  { ticker: "UNH",  name: "UnitedHealth Group",      sector: "Healthcare" },
  { ticker: "LLY",  name: "Eli Lilly and Company",   sector: "Healthcare" },
  { ticker: "TSLA", name: "Tesla Inc.",              sector: "Consumer Discretionary" },
  { ticker: "AMZN", name: "Amazon.com Inc.",         sector: "Consumer Discretionary" },
  { ticker: "BAC",  name: "Bank of America",         sector: "Financials" },
  { ticker: "HD",   name: "Home Depot Inc.",         sector: "Consumer Discretionary" },
  { ticker: "CVX",  name: "Chevron Corporation",     sector: "Energy" },
  { ticker: "ABBV", name: "AbbVie Inc.",             sector: "Healthcare" },
  { ticker: "PFE",  name: "Pfizer Inc.",             sector: "Healthcare" },
  { ticker: "CAT",  name: "Caterpillar Inc.",        sector: "Industrials" },
  { ticker: "DE",   name: "Deere & Company",         sector: "Industrials" },
  { ticker: "NEE",  name: "NextEra Energy",          sector: "Utilities" },
];

function classifyRole(rel: string | undefined): InsiderRole {
  const r = (rel ?? "").toLowerCase();
  if (r.includes("chief executive")) return "CEO";
  if (r.includes("chief financial")) return "CFO";
  if (r.includes("chief operating")) return "COO";
  if (r.includes("chief technology")) return "CTO";
  if (r.includes("chief marketing")) return "CMO";
  if (r.includes("general counsel")) return "General Counsel";
  if (r.includes("director")) return "Director";
  if (r.includes("president")) return "President";
  if (r.includes("evp") || r.includes("executive vp")) return "EVP";
  if (r.includes("svp") || r.includes("senior vp")) return "SVP";
  if (r.includes("vice president") || r.includes(" vp")) return "VP";
  if (r.includes("10%") || r.includes("beneficial owner")) return "10%+ Owner";
  return "Director";
}

function classifyType(text: string | undefined, value: number | undefined): TransactionType {
  const t = (text ?? "").toLowerCase();
  if (t.includes("10b5-1") || t.includes("10 b 5-1")) return "SALE_10B5_1";
  if (t.includes("sale") || t.includes("disposition")) return "SALE";
  if (t.includes("purchase") || t.includes("acquisition")) return "PURCHASE";
  // Fallback: negative value → sale
  if (typeof value === "number" && value < 0) return "SALE";
  return "PURCHASE";
}

function isOptionExercise(text: string | undefined) {
  const t = (text ?? "").toLowerCase();
  return t.includes("option") || t.includes("exercise") || t.includes("conversion");
}

function isGift(text: string | undefined) {
  return (text ?? "").toLowerCase().includes("gift");
}

async function fetchOne(co: { ticker: string; name: string; sector: Sector }): Promise<InsiderTransaction[]> {
  const summary = await safeQuoteSummary(co.ticker, ["insiderTransactions", "price", "summaryDetail"]);
  if (!summary) return [];

  const txs = summary.insiderTransactions?.transactions ?? [];
  const currentPrice = summary.price?.regularMarketPrice ?? 0;
  const high52 = summary.summaryDetail?.fiftyTwoWeekHigh ?? 0;
  const low52 = summary.summaryDetail?.fiftyTwoWeekLow ?? 0;

  return txs.slice(0, 10).map((t, i) => {
    const value = typeof t.value === "number" ? Math.abs(t.value) : 0;
    const shares = typeof t.shares === "number" ? Math.abs(t.shares) : 0;
    const pricePerShare = shares > 0 && value > 0 ? value / shares : currentPrice;
    const txDate = t.startDate instanceof Date ? t.startDate : new Date();

    return {
      id: `insider-${co.ticker}-${i}-${txDate.getTime()}`,
      ticker: co.ticker,
      companyName: co.name,
      sector: co.sector,
      insiderName: t.filerName ?? "—",
      insiderRole: classifyRole(typeof t.filerRelation === "string" ? t.filerRelation : undefined),
      transactionType: classifyType(t.transactionText, typeof t.value === "number" ? t.value : undefined),
      shares,
      pricePerShare,
      totalValue: value || shares * pricePerShare,
      ownershipChangePct: 0,
      filingDate: txDate,
      transactionDate: txDate,
      secFilingUrl: t.filerUrl || `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${co.ticker}&type=4`,
      stockPriceCurrent: currentPrice,
      stockPriceAt52wLow: low52,
      stock52wHigh: high52,
      stock52wLow: low52,
      priorPurchaseDate: undefined,
      stockPriceChange60d: 0,
      isOptionExercise: isOptionExercise(t.transactionText),
      isGift: isGift(t.transactionText),
    };
  });
}

export async function fetchInsiderTransactions(): Promise<InsiderTransaction[]> {
  return getOrFetch(
    "insider:all",
    async () => {
      const results = await Promise.all(COMPANIES.map(fetchOne));
      const all = results.flat();
      return all.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
    },
    15 * 60 * 1000,
  );
}
