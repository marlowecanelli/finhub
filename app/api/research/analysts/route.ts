import { NextResponse } from "next/server";
import { fetchAnalystConsensus } from "@/lib/api/research/analysts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get("ticker") ?? "AAPL").toUpperCase();
  try {
    const consensus = await fetchAnalystConsensus(ticker);
    if (!consensus) {
      return NextResponse.json({ error: `No analyst data for ${ticker}` }, { status: 404 });
    }
    return NextResponse.json({ consensus });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch analyst data" },
      { status: 502 },
    );
  }
}
