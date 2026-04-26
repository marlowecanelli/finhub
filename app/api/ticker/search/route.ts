import { NextResponse, type NextRequest } from "next/server";
import { searchTickers } from "@/lib/yahoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (query.trim().length < 1) {
    return NextResponse.json({ results: [] });
  }
  try {
    const results = await searchTickers(query);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message, results: [] }, { status: 500 });
  }
}
