import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getLatestRecap, getRecapByDate } from "@/lib/market-recap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function makeClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const supabase = makeClient();
  const date = request.nextUrl.searchParams.get("date");

  const recap = date
    ? await getRecapByDate(supabase, date)
    : await getLatestRecap(supabase);

  return NextResponse.json({ recap: recap ?? null });
}
