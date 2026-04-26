import { NextResponse } from "next/server";
import { getHistory, type Timeframe } from "@/lib/yahoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Position = { symbol: string; shares: number };

const VALID: Timeframe[] = ["1D", "5D", "1M", "3M", "1Y", "5Y", "All"];

// Map UI timeframe (1D / 1W / 1M / 3M / 1Y / All) to yahoo Timeframe
function mapTf(tf: string): Timeframe {
  if (tf === "1W") return "5D";
  return (VALID.includes(tf as Timeframe) ? tf : "3M") as Timeframe;
}

export async function POST(req: Request) {
  let body: { positions?: Position[]; tf?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tf = mapTf(body.tf ?? "1M");
  const positions = (body.positions ?? []).filter(
    (p): p is Position => Boolean(p?.symbol) && typeof p.shares === "number" && p.shares > 0
  );

  if (positions.length === 0) {
    return NextResponse.json({ tf, points: [] });
  }

  const histories = await Promise.all(
    positions.map(async (p) => {
      try {
        const points = await getHistory(p.symbol.toUpperCase(), tf);
        return { symbol: p.symbol.toUpperCase(), shares: p.shares, points };
      } catch {
        return { symbol: p.symbol.toUpperCase(), shares: p.shares, points: [] };
      }
    })
  );

  // Build a union of timestamps. For each timestamp use the latest price <=t for each symbol.
  const allTs = new Set<number>();
  for (const h of histories) for (const pt of h.points) allTs.add(pt.t);
  const ts = Array.from(allTs).sort((a, b) => a - b);

  const idx: Record<string, number> = {};
  for (const h of histories) idx[h.symbol] = 0;
  const lastPrice: Record<string, number | null> = {};
  for (const h of histories) lastPrice[h.symbol] = null;

  const points = ts.map((t) => {
    let value = 0;
    for (const h of histories) {
      while (
        idx[h.symbol]! < h.points.length &&
        h.points[idx[h.symbol]!]!.t <= t
      ) {
        lastPrice[h.symbol] = h.points[idx[h.symbol]!]!.c;
        idx[h.symbol]!++;
      }
      const p = lastPrice[h.symbol];
      if (p != null) value += p * h.shares;
    }
    return { t, v: value };
  });

  return NextResponse.json({ tf, points });
}
