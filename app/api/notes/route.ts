import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker")?.toUpperCase();
  if (!ticker) return NextResponse.json({ note: "" });

  let sb;
  try { sb = createServerSupabase(); } catch { return NextResponse.json({ note: "" }); }
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ note: "" }, { status: 401 });

  const { data } = await sb
    .from("ticker_notes")
    .select("note")
    .eq("user_id", user.id)
    .eq("ticker", ticker)
    .maybeSingle();

  return NextResponse.json({ note: data?.note ?? "" });
}

export async function POST(req: Request) {
  const { ticker, note } = (await req.json()) as { ticker?: string; note?: string };
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  let sb;
  try { sb = createServerSupabase(); } catch { return NextResponse.json({ error: "unconfigured" }, { status: 500 }); }
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { error } = await sb.from("ticker_notes").upsert(
    { user_id: user.id, ticker: ticker.toUpperCase(), note: note ?? "", updated_at: new Date().toISOString() },
    { onConflict: "user_id,ticker" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
