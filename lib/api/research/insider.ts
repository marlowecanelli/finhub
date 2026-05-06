/**
 * Insider Trading API — SEC EDGAR Form 4 filings
 * Source: https://efts.sec.gov/LATEST/search-index?q=%22form+4%22&dateRange=custom
 * Rate limit: ~10 req/s, no auth required
 */

import { z } from "zod";
import { getOrFetch } from "@/lib/cache";
import type { InsiderTransaction, Sector, InsiderRole, TransactionType } from "@/lib/types/research";

export const InsiderTransactionSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string(),
  sector: z.string(),
  insiderName: z.string(),
  insiderRole: z.string(),
  transactionType: z.enum(["PURCHASE", "SALE", "SALE_10B5_1"]),
  shares: z.number(),
  pricePerShare: z.number(),
  totalValue: z.number(),
  ownershipChangePct: z.number(),
  filingDate: z.coerce.date(),
  transactionDate: z.coerce.date(),
  secFilingUrl: z.string(),
  stockPriceAt52wLow: z.number(),
  stockPriceCurrent: z.number(),
  stock52wHigh: z.number(),
  stock52wLow: z.number(),
  priorPurchaseDate: z.coerce.date().optional(),
  stockPriceChange60d: z.number(),
  isOptionExercise: z.boolean(),
  isGift: z.boolean(),
});

const SECTORS: Sector[] = [
  "Technology", "Financials", "Healthcare", "Consumer Discretionary",
  "Industrials", "Energy", "Communication", "Materials", "Real Estate",
  "Consumer Staples", "Utilities"
];

const ROLES: InsiderRole[] = ["CEO", "CFO", "COO", "Director", "10%+ Owner", "SVP", "EVP", "President", "CTO"];

const COMPANIES: { ticker: string; name: string; sector: Sector }[] = [
  { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Technology" },
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Communication" },
  { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Communication" },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials" },
  { ticker: "GS", name: "Goldman Sachs Group", sector: "Financials" },
  { ticker: "XOM", name: "Exxon Mobil Corporation", sector: "Energy" },
  { ticker: "UNH", name: "UnitedHealth Group", sector: "Healthcare" },
  { ticker: "LLY", name: "Eli Lilly and Company", sector: "Healthcare" },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary" },
  { ticker: "BAC", name: "Bank of America", sector: "Financials" },
  { ticker: "HD", name: "Home Depot Inc.", sector: "Consumer Discretionary" },
  { ticker: "CVX", name: "Chevron Corporation", sector: "Energy" },
  { ticker: "ABBV", name: "AbbVie Inc.", sector: "Healthcare" },
  { ticker: "PFE", name: "Pfizer Inc.", sector: "Healthcare" },
  { ticker: "CAT", name: "Caterpillar Inc.", sector: "Industrials" },
  { ticker: "DE", name: "Deere & Company", sector: "Industrials" },
  { ticker: "NEE", name: "NextEra Energy", sector: "Utilities" },
];

const INSIDER_NAMES = [
  "Jensen Huang", "Tim Cook", "Mark Zuckerberg", "Satya Nadella",
  "Jamie Dimon", "David Solomon", "Darren Woods", "Andrew Witty",
  "David Ricks", "Elon Musk", "Andy Jassy", "Brian Moynihan",
  "Ted Decker", "Mike Wirth", "Richard Gonzalez", "Albert Bourla",
  "Jim Umpleby", "John May", "Kirk Crews", "Rebecca Kujawa",
  "Sarah Chen", "Michael Torres", "Jennifer Walsh", "Robert Kim",
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function mockInsiderTransactions(count = 50): InsiderTransaction[] {
  return Array.from({ length: count }, (_, i) => {
    const company = COMPANIES[i % COMPANIES.length]!;
    const role = ROLES[Math.floor(Math.random() * ROLES.length)]!;
    const type: TransactionType = Math.random() > 0.35 ? "PURCHASE" : Math.random() > 0.5 ? "SALE" : "SALE_10B5_1";
    const shares = Math.floor(randomBetween(1000, 500000));
    const price = randomBetween(20, 800);
    const totalValue = shares * price;
    const currentPrice = price * randomBetween(0.8, 1.2);
    const low52w = currentPrice * randomBetween(0.5, 0.85);
    const high52w = currentPrice * randomBetween(1.1, 1.6);
    const filingDaysAgo = Math.floor(randomBetween(0, 30));

    return {
      id: `insider-${i}-${Date.now()}`,
      ticker: company.ticker,
      companyName: company.name,
      sector: company.sector,
      insiderName: INSIDER_NAMES[i % INSIDER_NAMES.length]!,
      insiderRole: role,
      transactionType: type,
      shares,
      pricePerShare: price,
      totalValue,
      ownershipChangePct: randomBetween(-25, 25),
      filingDate: daysAgo(filingDaysAgo),
      transactionDate: daysAgo(filingDaysAgo + Math.floor(randomBetween(1, 5))),
      secFilingUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${company.ticker}&type=4`,
      stockPriceCurrent: currentPrice,
      stockPriceAt52wLow: low52w,
      stock52wHigh: high52w,
      stock52wLow: low52w,
      priorPurchaseDate: Math.random() > 0.4 ? daysAgo(Math.floor(randomBetween(90, 730))) : undefined,
      stockPriceChange60d: randomBetween(-35, 25),
      isOptionExercise: Math.random() < 0.15,
      isGift: Math.random() < 0.05,
    };
  });
}

export async function fetchInsiderTransactions(
  ticker?: string,
  days = 30
): Promise<InsiderTransaction[]> {
  const key = `insider:${ticker ?? "all"}:${days}`;
  return getOrFetch(key, async () => {
    // In production: fetch from SEC EDGAR
    // const url = `https://efts.sec.gov/LATEST/search-index?q="form+4"&dateRange=custom&startdt=...`
    return mockInsiderTransactions(50);
  }, 15 * 60 * 1000);
}
