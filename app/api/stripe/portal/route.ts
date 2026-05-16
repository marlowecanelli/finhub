import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

  const { data: sub } = await sb
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const customerId = sub?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "finhub-self.vercel.app";
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
