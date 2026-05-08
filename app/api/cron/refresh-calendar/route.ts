import { NextResponse, type NextRequest } from "next/server";
import { fetchAllSources } from "@/lib/calendar/sources";
import { upsertEvents } from "@/lib/calendar/repo";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  // Vercel cron sends `Authorization: Bearer <CRON_SECRET>`. In dev (no secret), allow.
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const { events, results } = await fetchAllSources();

  let upserted = 0;
  let upsertError: string | null = null;
  try {
    upserted = await upsertEvents(events);
  } catch (err) {
    upsertError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    ok: !upsertError,
    upserted,
    fetched: events.length,
    elapsedMs: Date.now() - start,
    sources: results,
    upsertError,
  });
}
