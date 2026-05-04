import "server-only";
import YahooFinance from "yahoo-finance2";
import { readCache, writeCache } from "./cache";
import type { Dividend, PricePoint } from "./types";

const yahoo = new YahooFinance();

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function endsToday(to: Date): boolean {
  const today = new Date();
  return Math.abs(to.getTime() - today.getTime()) < 7 * DAY_MS;
}

export async function fetchHistorical(
  ticker: string,
  from: Date,
  to: Date
): Promise<PricePoint[]> {
  const sym = ticker.toUpperCase();
  const key = `hist:${sym}:${isoDate(from)}:${isoDate(to)}:1d`;
  const cached = await readCache<PricePoint[]>(key);
  if (cached) return cached;

  let res: { quotes?: Array<{ date?: Date; adjclose?: number | null; close?: number | null }> };
  try {
    res = await yahoo.chart(sym, {
      period1: from,
      period2: to,
      interval: "1d",
    });
  } catch {
    return [];
  }
  const quotes = res.quotes ?? [];
  const points: PricePoint[] = quotes
    .filter((q) => q.date != null && (q.adjclose != null || q.close != null))
    .map((q) => ({
      date: isoDate(new Date(q.date as Date)),
      close: (q.adjclose ?? q.close) as number,
    }));

  // Pricing data ending today is mutable for ~24h. Past data is immutable.
  const ttl = endsToday(to) ? 24 * 60 * 60 : null;
  if (points.length > 0) await writeCache(key, points, ttl);
  return points;
}

export async function fetchDividends(
  ticker: string,
  from: Date,
  to: Date
): Promise<Dividend[]> {
  const sym = ticker.toUpperCase();
  const key = `div:${sym}:${isoDate(from)}:${isoDate(to)}`;
  const cached = await readCache<Dividend[]>(key);
  if (cached) return cached;

  try {
    const res = await yahoo.chart(sym, {
      period1: from,
      period2: to,
      interval: "1d",
      events: "dividends",
    });
    const evt = res.events?.dividends ?? [];
    const list: Dividend[] = evt
      .filter((d): d is { date: Date; amount: number } =>
        Boolean(d.date && typeof d.amount === "number")
      )
      .map((d) => ({ date: isoDate(d.date), amount: d.amount }));
    const ttl = endsToday(to) ? 24 * 60 * 60 : null;
    await writeCache(key, list, ttl);
    return list;
  } catch {
    return [];
  }
}

export async function fetchBenchmark(from: Date, to: Date): Promise<PricePoint[]> {
  return fetchHistorical("^GSPC", from, to);
}
