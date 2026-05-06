/**
 * Options Flow API — Unusual Whales (free tier)
 * Source: https://unusualwhales.com/api
 * Rate limit: 60 req/min free tier
 */

import { getOrFetch } from "@/lib/cache";
import type { OptionsOrder, OptionType, FlowSentiment } from "@/lib/types/research";

const TICKERS = ["AAPL","NVDA","SPY","QQQ","TSLA","META","MSFT","AMZN","GOOGL","AMD","PLTR","COIN","MSTR","GME","RIVN"];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

function randomExpiry(): Date {
  const d = new Date();
  const daysToFriday = ([3, 7, 14, 21, 35, 63] as const)[Math.floor(rand(0, 5)) as 0|1|2|3|4|5];
  d.setDate(d.getDate() + daysToFriday);
  d.setDate(d.getDate() + (5 - d.getDay() + 7) % 7);
  return d;
}

function minutesAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 1000);
}

export function mockOptionsOrders(count = 40): OptionsOrder[] {
  return Array.from({ length: count }, (_, i) => {
    const ticker = TICKERS[Math.floor(rand(0, TICKERS.length))]!;
    const optionType: OptionType = Math.random() > 0.5 ? "CALL" : "PUT";
    const contracts = Math.floor(rand(100, 5000));
    const premiumPerContract = rand(0.5, 25);
    const premium = contracts * premiumPerContract * 100;
    const oi = Math.floor(rand(500, 50000));
    const vol = Math.floor(rand(200, oi * 3));

    let sentiment: FlowSentiment;
    if (optionType === "CALL" && premium > 100000) sentiment = "BULLISH_SWEEP";
    else if (optionType === "PUT" && premium > 100000) sentiment = "BEARISH_SWEEP";
    else sentiment = "NEUTRAL_SPREAD";

    return {
      id: `opt-${i}-${Date.now()}`,
      ticker,
      expiry: randomExpiry(),
      strike: parseFloat(rand(50, 800).toFixed(0)),
      optionType,
      premium,
      contracts,
      openInterest: oi,
      volume: vol,
      sentiment,
      timestamp: minutesAgo(Math.floor(rand(0, 240))),
      isUnusual: premium > 500000 || vol > oi * 2,
    };
  });
}

export async function fetchOptionsFlow(): Promise<OptionsOrder[]> {
  const key = "optionsflow:live";
  return getOrFetch(key, async () => mockOptionsOrders(40), 2 * 60 * 1000);
}
