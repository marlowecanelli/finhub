import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ScreenerFilters, ScreenerPreset } from "@/lib/screener";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DbRow = {
  id: string;
  name: string;
  filters: ScreenerFilters;
  created_at: string;
};

export async function GET() {
  let supabase;
  try {
    supabase = createServerSupabase();
  } catch {
    return NextResponse.json({ presets: [] });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ presets: [] });

  const { data, error } = await supabase
    .from("screener_presets")
    .select("id, name, filters, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ presets: [], error: error.message }, { status: 500 });
  }

  const presets: ScreenerPreset[] = (data as DbRow[]).map((d) => ({
    id: d.id,
    name: d.name,
    filters: d.filters,
    created_at: d.created_at,
  }));
  return NextResponse.json({ presets });
}

export async function POST(req: Request) {
  let body: { name?: string; filters?: ScreenerFilters };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!body.filters) {
    return NextResponse.json({ error: "Filters required" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServerSupabase();
  } catch {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign-in required" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("screener_presets")
    .insert({ user_id: user.id, name, filters: body.filters })
    .select("id, name, filters, created_at")
    .single<DbRow>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const preset: ScreenerPreset = {
    id: data.id,
    name: data.name,
    filters: data.filters,
    created_at: data.created_at,
  };
  return NextResponse.json({ preset });
}
