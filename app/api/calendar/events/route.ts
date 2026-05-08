import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  getWatchlistTickers,
  listEvents,
  listUserEvents,
} from "@/lib/calendar/repo";
import type {
  CalendarFilters,
  EventImportance,
  EventType,
} from "@/lib/calendar/types";
import { ALL_EVENT_TYPES } from "@/lib/calendar/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = new Set<EventType>(ALL_EVENT_TYPES);
const VALID_IMPORTANCE = new Set<EventImportance>(["low", "medium", "high", "critical"]);

function parseList<T extends string>(s: string | null, valid: Set<T>): T[] | undefined {
  if (!s) return undefined;
  const arr = s.split(",").map((x) => x.trim()).filter(Boolean) as T[];
  const filtered = arr.filter((x) => valid.has(x));
  return filtered.length > 0 ? filtered : undefined;
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();
  const params = request.nextUrl.searchParams;

  const from = params.get("from");
  const to = params.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from and to required (ISO)" }, { status: 400 });
  }

  const filters: CalendarFilters = {
    from,
    to,
    types: parseList(params.get("types"), VALID_TYPES),
    importance: parseList(params.get("importance"), VALID_IMPORTANCE),
    tickers: params.get("tickers")?.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean),
    watchlistOnly: params.get("watchlistOnly") === "1",
    search: params.get("search") ?? undefined,
  };

  const { data: { user } } = await supabase.auth.getUser();

  let watchlist: string[] = [];
  if (user && filters.watchlistOnly) {
    watchlist = await getWatchlistTickers(supabase, user.id);
  }

  try {
    const [events, userEvents] = await Promise.all([
      listEvents(supabase, filters, watchlist),
      user ? listUserEvents(supabase, user.id, from, to) : Promise.resolve([]),
    ]);
    const includeCustom = !filters.types || filters.types.includes("custom");
    const merged = includeCustom ? [...events, ...userEvents] : events;
    merged.sort((a, b) => a.event_date.localeCompare(b.event_date));
    return NextResponse.json(
      { data: merged },
      { headers: { "Cache-Control": "private, max-age=60" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "query failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  let body: { title?: string; description?: string; ticker?: string; event_date?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.title || !body.event_date) {
    return NextResponse.json({ error: "title and event_date required" }, { status: 400 });
  }
  if (isNaN(new Date(body.event_date).getTime())) {
    return NextResponse.json({ error: "invalid event_date" }, { status: 400 });
  }
  if (body.title.length > 200) {
    return NextResponse.json({ error: "title too long" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_calendar_events")
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description ?? null,
      ticker: body.ticker?.toUpperCase() ?? null,
      event_date: body.event_date,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
