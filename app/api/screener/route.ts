import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { UNIVERSE } from "@/lib/screener-universe";
import type { ScreenerRow } from "@/lib/screener";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REFRESH_TTL_MS = 24 * 60 * 60 * 1000; // daily
const BATCH_SIZE = 50;

type DbRow = {
  symbol: string;
  name: string | null;
  sector: string | null;
  industry: string | null;
  price: number | null;
  change_pct: number | null;
  market_cap: number | null;
  pe_ratio: number | null;
  dividend_yield: number | null;
  fifty_two_high: number | null;
  fifty_two_low: number | null;
  fifty_two_change: number | null;
  volume: number | null;
  prev_close: number | null;
  refreshed_at: string;
};

function rowToScreener(r: DbRow): ScreenerRow {
  return {
    symbol: r.symbol,
    name: r.name,
    sector: r.sector,
    industry: r.industry,
    price: r.price,
    changePct: r.change_pct,
    marketCap: r.market_cap,
    peRatio: r.pe_ratio,
    dividendYield: r.dividend_yield,
    fiftyTwoHigh: r.fifty_two_high,
    fiftyTwoLow: r.fifty_two_low,
    fiftyTwoChange: r.fifty_two_change,
    volume: r.volume,
    prevClose: r.prev_close,
  };
}

async function fetchLive(): Promise<ScreenerRow[]> {
  const symbols = UNIVERSE.map((u) => u.symbol);
  const meta = new Map(UNIVERSE.map((u) => [u.symbol, u]));
  const out: ScreenerRow[] = [];

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    let quotes: Awaited<ReturnType<typeof yahooFinance.quote>>;
    try {
      quotes = await yahooFinance.quote(batch);
    } catch {
      continue;
    }
    const list = Array.isArray(quotes) ? quotes : [quotes];
    for (const sym of batch) {
      const q = list.find((x) => x.symbol?.toUpperCase() === sym);
      const m = meta.get(sym);
      const price = q?.regularMarketPrice ?? null;
      const low = q?.fiftyTwoWeekLow ?? null;
      const fiftyTwoChange =
        price != null && low != null && low > 0
          ? ((price - low) / low) * 100
          : null;
      out.push({
        symbol: sym,
        name: m?.name ?? q?.shortName ?? null,
        sector: m?.sector ?? null,
        industry: m?.industry ?? null,
        price,
        changePct: q?.regularMarketChangePercent ?? null,
        marketCap: q?.marketCap ?? null,
        peRatio: q?.trailingPE ?? null,
        dividendYield: q?.dividendYield ?? null,
        fiftyTwoHigh: q?.fiftyTwoWeekHigh ?? null,
        fiftyTwoLow: low,
        fiftyTwoChange,
        volume: q?.regularMarketVolume ?? null,
        prevClose: q?.regularMarketPreviousClose ?? null,
      });
    }
  }
  return out;
}

async function readCache(): Promise<{ rows: ScreenerRow[]; refreshedAt: string | null }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { rows: [], refreshedAt: null };
  const { data } = await admin
    .from("screener_snapshots")
    .select("*")
    .order("symbol", { ascending: true });
  if (!data || data.length === 0) return { rows: [], refreshedAt: null };
  const rows = data.map((d) => rowToScreener(d as DbRow));
  const newest = (data as DbRow[]).reduce(
    (acc, r) => (r.refreshed_at > acc ? r.refreshed_at : acc),
    (data[0] as DbRow).refreshed_at
  );
  return { rows, refreshedAt: newest };
}

async function writeCache(rows: ScreenerRow[]): Promise<string> {
  const admin = getSupabaseAdmin();
  const refreshedAt = new Date().toISOString();
  if (!admin) return refreshedAt;
  const dbRows = rows.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    sector: r.sector,
    industry: r.industry,
    price: r.price,
    change_pct: r.changePct,
    market_cap: r.marketCap,
    pe_ratio: r.peRatio,
    dividend_yield: r.dividendYield,
    fifty_two_high: r.fiftyTwoHigh,
    fifty_two_low: r.fiftyTwoLow,
    fifty_two_change: r.fiftyTwoChange,
    volume: r.volume,
    prev_close: r.prevClose,
    refreshed_at: refreshedAt,
  }));
  await admin.from("screener_snapshots").upsert(dbRows, { onConflict: "symbol" });
  return refreshedAt;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get("refresh") === "1";

  const cached = await readCache();
  const stale =
    !cached.refreshedAt ||
    Date.now() - new Date(cached.refreshedAt).getTime() > REFRESH_TTL_MS;

  if (!force && !stale && cached.rows.length > 0) {
    return NextResponse.json({
      rows: cached.rows,
      refreshedAt: cached.refreshedAt,
      source: "cache",
      universeSize: UNIVERSE.length,
    });
  }

  const live = await fetchLive();
  const refreshedAt =
    live.length > 0
      ? await writeCache(live)
      : cached.refreshedAt ?? new Date().toISOString();

  return NextResponse.json({
    rows: live.length > 0 ? live : cached.rows,
    refreshedAt,
    source: live.length > 0 ? "live" : "cache",
    universeSize: UNIVERSE.length,
  });
}
