import { NextResponse } from "next/server";
import { fetchCalendarReleases } from "@/lib/api/research/calendar";
import { fredConfigured } from "@/lib/api/research/macro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!fredConfigured()) {
    return NextResponse.json({
      configured: false,
      message: "Set FRED_API_KEY in .env.local to enable the economic calendar.",
      releases: [],
    });
  }
  try {
    const releases = await fetchCalendarReleases();
    return NextResponse.json({ configured: true, releases });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch calendar" },
      { status: 502 },
    );
  }
}
