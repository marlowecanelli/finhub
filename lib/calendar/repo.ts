import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarFilters,
  CalendarSettings,
  EventType,
  EventImportance,
  EventTiming,
  CalendarEventMetadata,
} from "./types";

type Row = {
  id: string;
  event_type: EventType;
  ticker: string | null;
  title: string;
  description: string | null;
  event_date: string;
  timing: EventTiming;
  importance: EventImportance;
  metadata: CalendarEventMetadata;
  source: string;
  external_id: string | null;
  ai_brief: string | null;
};

function rowToEvent(r: Row): CalendarEvent {
  return {
    id: r.id,
    event_type: r.event_type,
    ticker: r.ticker,
    title: r.title,
    description: r.description,
    event_date: r.event_date,
    timing: r.timing,
    importance: r.importance,
    metadata: r.metadata,
    source: r.source,
    external_id: r.external_id,
    ai_brief: r.ai_brief,
  };
}

/** Bulk upsert ingested events. Conflict on (source, external_id). */
export async function upsertEvents(events: CalendarEventInput[]): Promise<number> {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;
  if (events.length === 0) return 0;

  // Chunk to keep payloads reasonable.
  const CHUNK = 500;
  let total = 0;
  for (let i = 0; i < events.length; i += CHUNK) {
    const slice = events.slice(i, i + CHUNK).map((e) => ({
      event_type: e.event_type,
      ticker: e.ticker,
      title: e.title,
      description: e.description,
      event_date: e.event_date,
      timing: e.timing,
      importance: e.importance,
      metadata: e.metadata,
      source: e.source,
      external_id: e.external_id,
      updated_at: new Date().toISOString(),
    }));
    const { error, count } = await admin
      .from("calendar_events")
      .upsert(slice, { onConflict: "source,external_id", count: "exact" });
    if (error) throw error;
    total += count ?? slice.length;
  }
  return total;
}

export async function listEvents(
  client: SupabaseClient,
  filters: CalendarFilters,
  watchlistTickers: string[] = []
): Promise<CalendarEvent[]> {
  let q = client
    .from("calendar_events")
    .select("*")
    .gte("event_date", filters.from)
    .lte("event_date", filters.to)
    .order("event_date", { ascending: true })
    .limit(2000);

  if (filters.types && filters.types.length > 0) {
    q = q.in("event_type", filters.types);
  }
  if (filters.importance && filters.importance.length > 0) {
    q = q.in("importance", filters.importance);
  }
  if (filters.tickers && filters.tickers.length > 0) {
    q = q.in("ticker", filters.tickers);
  }
  if (filters.watchlistOnly && watchlistTickers.length > 0) {
    q = q.in("ticker", watchlistTickers);
  }
  if (filters.search) {
    const s = filters.search.replace(/[%_]/g, "");
    q = q.or(`title.ilike.%${s}%,ticker.ilike.%${s}%,description.ilike.%${s}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data as Row[]).map(rowToEvent);
}

export async function listUserEvents(
  client: SupabaseClient,
  userId: string,
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from("user_calendar_events")
    .select("*")
    .eq("user_id", userId)
    .gte("event_date", from)
    .lte("event_date", to)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    event_type: "custom" as const,
    ticker: r.ticker ?? null,
    title: r.title,
    description: r.description ?? null,
    event_date: r.event_date,
    timing: "all_day" as const,
    importance: "medium" as const,
    metadata: { kind: "custom" } as CalendarEventMetadata,
    source: "user",
    external_id: null,
    ai_brief: null,
  }));
}

export async function getEventById(
  client: SupabaseClient,
  id: string
): Promise<CalendarEvent | null> {
  const { data, error } = await client
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return rowToEvent(data as Row);
}

export async function getOrCreateSettings(
  client: SupabaseClient,
  userId: string
): Promise<CalendarSettings> {
  const { data } = await client
    .from("user_calendar_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data as CalendarSettings;

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("admin client unavailable");
  const { data: created, error } = await admin
    .from("user_calendar_settings")
    .insert({ user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return created as CalendarSettings;
}

export async function getSettingsByFeedToken(
  token: string
): Promise<{ settings: CalendarSettings; userId: string } | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("user_calendar_settings")
    .select("*")
    .eq("feed_token", token)
    .maybeSingle();
  if (!data) return null;
  return { settings: data as CalendarSettings, userId: (data as CalendarSettings).user_id };
}

export async function getWatchlistTickers(
  client: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data } = await client
    .from("watchlist_items")
    .select("ticker")
    .eq("user_id", userId);
  return (data ?? []).map((r) => (r.ticker as string).toUpperCase());
}
