import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Holding } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yahooFinance = new YahooFinance();

export async function GET() {
  let supabase;
  try {
    supabase = createServerSupabase();
  } catch {
    return NextResponse.json({ ok: false, value: 0, reason: "unconfigured" });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, value: 0, reason: "unauth" });

  const { data: portfolios } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", user.id);
  if (!portfolios || portfolios.length === 0) {
    return NextResponse.json({ ok: true, value: 0, holdings: 0 });
  }

  const portfolioIds = portfolios.map((p) => p.id);
  const { data: holdings } = await supabase
    .from("holdings")
    .select("ticker, shares, cost_basis, purchase_date, id, portfolio_id, created_at")
    .in("portfolio_id", portfolioIds);

  const rows: Holding[] = (holdings ?? []) as Holding[];
  if (rows.length === 0) return NextResponse.json({ ok: true, value: 0, holdings: 0 });

  const tickers = Array.from(new Set(rows.map((r) => r.ticker.toUpperCase())));
  let prices: Record<string, number> = {};
  try {
    const quotes = await yahooFinance.quote(tickers);
    const list = Array.isArray(quotes) ? quotes : [quotes];
    for (const q of list) {
      const sym = (q.symbol || "").toUpperCase();
      const p = (q.regularMarketPrice ?? q.postMarketPrice ?? q.preMarketPrice) as
        | number
        | undefined;
      if (sym && typeof p === "number") prices[sym] = p;
    }
  } catch {
    // fall back to cost basis
  }

  let total = 0;
  for (const h of rows) {
    const sym = h.ticker.toUpperCase();
    const price = prices[sym] ?? h.cost_basis;
    total += price * h.shares;
  }

  return NextResponse.json({
    ok: true,
    value: Math.round(total * 100) / 100,
    holdings: rows.length,
  });
}
