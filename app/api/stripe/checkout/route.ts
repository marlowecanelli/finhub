import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getStripe, STRIPE_PRICES, type PlanInterval } from "@/lib/stripe";

export const runtime = "nodejs";

function baseUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "finhub-self.vercel.app";
  return `${proto}://${host}`;
}

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

  const body = (await req.json().catch(() => ({}))) as { interval?: PlanInterval };
  const interval: PlanInterval = body.interval === "yearly" ? "yearly" : "monthly";
  const priceId = STRIPE_PRICES[interval];
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price for ${interval} not configured` },
      { status: 503 }
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  // Reuse existing customer if we have one.
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    // Pre-seed mapping so the webhook can find it even before first invoice.
    await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "inactive",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }

  const origin = baseUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: user.id,
    subscription_data: { metadata: { user_id: user.id } },
  });

  return NextResponse.json({ url: session.url });
}
