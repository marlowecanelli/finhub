import { NextResponse } from "next/server";
import { fetchOverview } from "@/lib/api/research/overview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchOverview();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch overview" },
      { status: 502 },
    );
  }
}
