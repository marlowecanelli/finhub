import { NextResponse } from "next/server";
import { fetchDeepDive } from "@/lib/api/research/deepDive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get("ticker") ?? "AAPL").toUpperCase();
  try {
    const data = await fetchDeepDive(ticker);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load deep dive" },
      { status: 502 },
    );
  }
}
