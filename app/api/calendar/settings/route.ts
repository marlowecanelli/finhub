import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getOrCreateSettings } from "@/lib/calendar/repo";
import { ALL_EVENT_TYPES } from "@/lib/calendar/registry";
import type { EventType } from "@/lib/calendar/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });
  try {
    const settings = await getOrCreateSettings(supabase, user.id);
    return NextResponse.json({ data: settings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 }
    );
  }
}

const VALID_VIEWS = new Set(["month", "week", "agenda", "heatmap"]);

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  await getOrCreateSettings(supabase, user.id); // ensure row exists

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (Array.isArray(body.visible_event_types)) {
    const types = (body.visible_event_types as string[]).filter((t) =>
      ALL_EVENT_TYPES.includes(t as EventType)
    );
    update.visible_event_types = types;
  }
  if (typeof body.watchlist_only === "boolean") update.watchlist_only = body.watchlist_only;
  if (typeof body.timezone === "string" && body.timezone.length < 64) update.timezone = body.timezone;
  if (typeof body.default_view === "string" && VALID_VIEWS.has(body.default_view)) {
    update.default_view = body.default_view;
  }
  if (typeof body.email_digest_enabled === "boolean") update.email_digest_enabled = body.email_digest_enabled;
  if (typeof body.email_digest_hour === "number" && body.email_digest_hour >= 0 && body.email_digest_hour <= 23) {
    update.email_digest_hour = Math.floor(body.email_digest_hour);
  }
  if (typeof body.push_notifications_enabled === "boolean") update.push_notifications_enabled = body.push_notifications_enabled;
  if (typeof body.alert_lead_time_minutes === "number" && body.alert_lead_time_minutes >= 0) {
    update.alert_lead_time_minutes = Math.floor(body.alert_lead_time_minutes);
  }

  const { data, error } = await supabase
    .from("user_calendar_settings")
    .update(update)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
