import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST() {
  let sb;
  try {
    sb = createServerSupabase();
  } catch {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Account deletion requires SUPABASE_SERVICE_ROLE_KEY on the server." },
      { status: 503 }
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sign out client-side cookie so the redirect lands on the public site.
  await sb.auth.signOut();

  return NextResponse.json({ ok: true });
}
