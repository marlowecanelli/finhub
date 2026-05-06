/**
 * Congressional Trading API — STOCK Act disclosures
 * Source: https://www.quiverquant.com/sources/congresstrading
 * Rate limit: ~60 req/min free tier
 */

import { getOrFetch } from "@/lib/cache";
import type { CongressTrade, Party, Chamber, Sector } from "@/lib/types/research";

const MEMBERS: { name: string; party: Party; state: string; chamber: Chamber; committees: string[] }[] = [
  { name: "Nancy Pelosi",    party: "D", state: "CA", chamber: "House",  committees: ["Financial Services"] },
  { name: "Dan Crenshaw",    party: "R", state: "TX", chamber: "House",  committees: ["Homeland Security", "Intelligence"] },
  { name: "Tommy Tuberville",party: "R", state: "AL", chamber: "Senate", committees: ["Armed Services", "Agriculture"] },
  { name: "Mark Warner",     party: "D", state: "VA", chamber: "Senate", committees: ["Intelligence", "Finance"] },
  { name: "Josh Gottheimer", party: "D", state: "NJ", chamber: "House",  committees: ["Financial Services"] },
  { name: "Ro Khanna",       party: "D", state: "CA", chamber: "House",  committees: ["Armed Services", "Budget"] },
  { name: "Michael McCaul",  party: "R", state: "TX", chamber: "House",  committees: ["Foreign Affairs", "Homeland Security"] },
  { name: "Brian Schatz",    party: "D", state: "HI", chamber: "Senate", committees: ["Appropriations", "Commerce"] },
  { name: "Chip Roy",        party: "R", state: "TX", chamber: "House",  committees: ["Budget", "Judiciary"] },
  { name: "Shelley Moore Capito", party: "R", state: "WV", chamber: "Senate", committees: ["Energy", "Environment"] },
];

const TRADES: { ticker: string; company: string; sector: Sector; committeeIndustry?: string }[] = [
  { ticker: "NVDA",  company: "NVIDIA",            sector: "Technology",             committeeIndustry: "Technology" },
  { ticker: "MSFT",  company: "Microsoft",          sector: "Technology",             committeeIndustry: "Technology" },
  { ticker: "AAPL",  company: "Apple Inc.",         sector: "Technology" },
  { ticker: "LMT",   company: "Lockheed Martin",   sector: "Industrials",            committeeIndustry: "Defense" },
  { ticker: "RTX",   company: "RTX Corporation",   sector: "Industrials",            committeeIndustry: "Defense" },
  { ticker: "BA",    company: "Boeing",             sector: "Industrials",            committeeIndustry: "Defense" },
  { ticker: "JPM",   company: "JPMorgan Chase",    sector: "Financials",             committeeIndustry: "Finance" },
  { ticker: "XOM",   company: "Exxon Mobil",       sector: "Energy",                 committeeIndustry: "Energy" },
  { ticker: "CVX",   company: "Chevron",            sector: "Energy",                 committeeIndustry: "Energy" },
  { ticker: "AMZN",  company: "Amazon.com",         sector: "Consumer Discretionary" },
  { ticker: "META",  company: "Meta Platforms",    sector: "Communication" },
  { ticker: "GOOGL", company: "Alphabet",           sector: "Communication" },
  { ticker: "TSLA",  company: "Tesla",              sector: "Consumer Discretionary" },
  { ticker: "UNH",   company: "UnitedHealth",       sector: "Healthcare",             committeeIndustry: "Healthcare" },
];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const RANGES: [number, number][] = [
  [1000, 15000], [15000, 50000], [50000, 100000], [100000, 250000], [250000, 500000], [500000, 1000000],
];

export function mockCongressTrades(count = 40): CongressTrade[] {
  return Array.from({ length: count }, (_, i) => {
    const member = MEMBERS[i % MEMBERS.length]!;
    const trade = TRADES[Math.floor(rand(0, TRADES.length))]!;
    const transactionDaysAgo = Math.floor(rand(1, 60));
    const disclosureLagDays = Math.floor(rand(5, 45));
    const range = RANGES[Math.floor(rand(0, RANGES.length))]!;
    const amtMin = range[0];
    const amtMax = range[1];

    const committeeOverlap = member.committees.some(c =>
      trade.committeeIndustry && c.toLowerCase().includes(trade.committeeIndustry.toLowerCase())
    );

    return {
      id: `congress-${i}-${Date.now()}`,
      name: member.name,
      party: member.party,
      state: member.state,
      chamber: member.chamber,
      ticker: trade.ticker,
      companyName: trade.company,
      sector: trade.sector,
      transactionType: Math.random() > 0.35 ? "Buy" : Math.random() > 0.5 ? "Sell" : "Exchange",
      amountMin: amtMin,
      amountMax: amtMax,
      transactionDate: daysAgo(transactionDaysAgo + disclosureLagDays),
      disclosureDate: daysAgo(transactionDaysAgo),
      disclosureLagDays,
      committeeOverlap,
      committeeNames: member.committees,
      postTradeReturn: parseFloat(rand(-15, 35).toFixed(2)),
    };
  });
}

export async function fetchCongressTrades(): Promise<CongressTrade[]> {
  const key = "congress:trades";
  return getOrFetch(key, async () => mockCongressTrades(40), 60 * 60 * 1000);
}
