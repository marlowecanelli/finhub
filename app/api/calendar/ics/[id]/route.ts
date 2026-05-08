import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getEventById } from "@/lib/calendar/repo";
import { buildIcs } from "@/lib/calendar/ics";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const event = await getEventById(supabase, params.id);
  if (!event) return new NextResponse("Not found", { status: 404 });

  const ics = buildIcs([event], event.title);
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.id}.ics"`,
    },
  });
}
