import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSettingsByFeedToken, getWatchlistTickers, listEvents, listUserEvents } from "@/lib/calendar/repo";
import { buildIcs } from "@/lib/calendar/ics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const lookup = await getSettingsByFeedToken(params.token);
  if (!lookup) {
    return new NextResponse("Not found", { status: 404 });
  }
  const { settings, userId } = lookup;
  const admin = getSupabaseAdmin();
  if (!admin) return new NextResponse("Server unavailable", { status: 503 });

  const now = new Date();
  const from = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString();
  const to = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365).toISOString();

  const watchlist = settings.watchlist_only ? await getWatchlistTickers(admin, userId) : [];
  const [events, userEvents] = await Promise.all([
    listEvents(admin, {
      from,
      to,
      types: settings.visible_event_types,
      watchlistOnly: settings.watchlist_only,
    }, watchlist),
    listUserEvents(admin, userId, from, to),
  ]);

  const ics = buildIcs([...events, ...userEvents], "FinHub Calendar");
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="finhub.ics"`,
      "Cache-Control": "public, max-age=900",
    },
  });
}
