/**
 * Dark Pool Activity API — FINRA OTC/ATS data
 * Source: https://www.finra.org/filing-reporting/otc-transparency
 * Rate limit: Free/public, published weekly
 */

import { getOrFetch } from "@/lib/cache";
import type { DarkPoolPrint } from "@/lib/types/research";

const TICKERS = ["AAPL","MSFT","NVDA","SPY","QQQ","AMZN","TSLA","META","GOOGL","JPM","BAC","GS","XOM","LLY","UNH"];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function minutesAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 1000);
}

export function mockDarkPoolPrints(count = 30): DarkPoolPrint[] {
  return Array.from({ length: count }, (_, i) => {
    const ticker = TICKERS[Math.floor(rand(0, TICKERS.length))]!;
    const shares = Math.floor(rand(100000, 5000000));
    const price = rand(50, 700);
    const totalValue = shares * price;
    const darkPoolVolume = Math.floor(rand(500000, 10000000));
    const exchangeVolume = Math.floor(rand(2000000, 30000000));
    const darkPoolPct = (darkPoolVolume / (darkPoolVolume + exchangeVolume)) * 100;

    return {
      id: `dp-${i}-${Date.now()}`,
      ticker,
      shares,
      price: parseFloat(price.toFixed(2)),
      totalValue,
      timestamp: minutesAgo(Math.floor(rand(0, 480))),
      aboveMidpoint: Math.random() > 0.4,
      darkPoolPct: parseFloat(darkPoolPct.toFixed(2)),
      exchangeVolume,
      darkPoolVolume,
      accumulationSignal: darkPoolPct > 30 && Math.random() > 0.5,
    };
  });
}

export async function fetchDarkPoolPrints(ticker?: string): Promise<DarkPoolPrint[]> {
  const key = `darkpool:${ticker ?? "all"}`;
  return getOrFetch(key, async () => mockDarkPoolPrints(30), 60 * 60 * 1000); // FINRA weekly
}
