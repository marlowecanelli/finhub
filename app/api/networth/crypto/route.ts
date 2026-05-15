import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple proxy/cache for CoinGecko prices
type CacheEntry = { ts: number; data: Record<string, number> };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ids = (url.searchParams.get("ids") || "").trim();
  if (!ids) return NextResponse.json({ ok: true, prices: {} });
  const key = ids.split(",").map((s) => s.trim().toLowerCase()).sort().join(",");
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return NextResponse.json({ ok: true, prices: cached.data, cached: true });
  }
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(key)}&vs_currencies=usd`,
      { headers: { Accept: "application/json" } }
    );
    if (!r.ok) {
      return NextResponse.json({ ok: false, prices: {}, status: r.status });
    }
    const data = (await r.json()) as Record<string, { usd: number }>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v.usd === "number") out[k] = v.usd;
    }
    CACHE.set(key, { ts: Date.now(), data: out });
    return NextResponse.json({ ok: true, prices: out });
  } catch (e) {
    return NextResponse.json({ ok: false, prices: {}, error: String(e) });
  }
}
