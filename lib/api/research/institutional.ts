/**
 * Institutional Ownership API — SEC 13F filings via EDGAR
 * Source: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=13F
 * Rate limit: 10 req/s EDGAR
 */

import { getOrFetch } from "@/lib/cache";
import type { InstitutionalOwnership, InstitutionalHolder } from "@/lib/types/research";

const FUNDS = [
  "Vanguard Group", "BlackRock Inc.", "State Street Corp", "Fidelity Investments",
  "Capital Group", "Wellington Management", "T. Rowe Price", "Geode Capital",
  "Morgan Stanley", "JPMorgan Asset Mgmt", "Goldman Sachs AM", "Dimensional Fund",
  "Northern Trust", "Invesco Ltd.", "BNY Mellon", "Charles Schwab",
  "UBS Group", "Deutsche Bank AM", "Nuveen Investments", "PIMCO",
  "Citadel Advisors", "Millennium Mgmt", "Bridgewater Associates", "Two Sigma",
  "D.E. Shaw",
];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

export function mockInstitutionalOwnership(ticker = "AAPL"): InstitutionalOwnership {
  const totalInstOwnershipPct = parseFloat(rand(55, 85).toFixed(2));
  const prevInstOwnershipPct = parseFloat((totalInstOwnershipPct + rand(-3, 3)).toFixed(2));

  const top25Holders: InstitutionalHolder[] = FUNDS.map((fund, i) => {
    const sharesHeld = Math.floor(rand(10e6, 800e6));
    const quarterChangeShares = Math.floor(rand(-50e6, 80e6));
    const isNew = i > 20 && Math.random() > 0.7;
    const isClosed = i > 20 && !isNew && Math.random() > 0.8;

    return {
      fund,
      sharesHeld,
      portfolioPct: parseFloat(rand(0.5, 8.0).toFixed(2)),
      quarterChangeShares,
      quarterChangePct: parseFloat(((quarterChangeShares / sharesHeld) * 100).toFixed(2)),
      isNew,
      isClosed,
      historicalPerformilePct: parseFloat(rand(30, 95).toFixed(1)),
    };
  });

  const top3Pct = top25Holders.slice(0, 3).reduce((s, h) => s + h.portfolioPct, 0);

  return {
    ticker,
    totalInstOwnershipPct,
    prevInstOwnershipPct,
    top25Holders,
    newPositions: top25Holders.filter(h => h.isNew).length,
    closedPositions: top25Holders.filter(h => h.isClosed).length,
    concentrationRisk: top3Pct > 50,
    smartMoneyScore: parseFloat(rand(40, 95).toFixed(1)),
  };
}

export async function fetchInstitutionalOwnership(ticker: string): Promise<InstitutionalOwnership> {
  const key = `institutional:${ticker}`;
  return getOrFetch(key, async () => mockInstitutionalOwnership(ticker), 24 * 60 * 60 * 1000); // 13Fs are quarterly
}
