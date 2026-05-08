import { NextResponse } from "next/server";
import { fetchScreenerData } from "@/lib/api/research/screener";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stocks = await fetchScreenerData();
    return NextResponse.json({ stocks });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch screener data" },
      { status: 502 },
    );
  }
}
