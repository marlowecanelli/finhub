import { NextResponse, type NextRequest } from "next/server";
import { computeBuffettScore } from "@/lib/buffett/computeBuffettScore";
import { readCache, writeCache } from "@/lib/buffett/cache";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TICKER_RE = /^[A-Z0-9.\-\^]{1,10}$/;

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.toUpperCase().trim();

  if (!ticker || !TICKER_RE.test(ticker)) {
    return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
  }

  // Cache hit
  const cached = await readCache(ticker);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  // Check required env
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  // Compute
  const result = await computeBuffettScore(ticker);

  if (!result.ok) {
    const status = result.reason === "insufficient_history" ? 422 : 502;
    return NextResponse.json({ error: result.reason }, { status });
  }

  await writeCache(ticker, result.score);
  return NextResponse.json({ ...result.score, cached: false });
}
