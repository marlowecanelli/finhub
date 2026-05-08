import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { recordEvent } from "@/lib/achievements/engine";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const isNew =
          user.created_at &&
          Date.now() - new Date(user.created_at).getTime() < 60_000;
        try {
          await recordEvent(user.id, isNew ? "account_created" : "login", {});
        } catch {
          // Never block sign-in on achievement engine errors.
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
