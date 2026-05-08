import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  const { error } = await supabase
    .from("user_calendar_events")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
