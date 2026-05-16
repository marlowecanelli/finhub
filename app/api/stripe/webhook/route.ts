import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, priceIdToPlan } from "@/lib/stripe";
import { upsertSubscriptionByCustomer } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isoOrNull(unix: number | null | undefined): string | null {
  if (!unix) return null;
  return new Date(unix * 1000).toISOString();
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price?.id ?? null;
  const periodEnd = firstItem?.current_period_end ?? null;
  const userIdFromMeta = (sub.metadata?.user_id as string | undefined) ?? undefined;

  await upsertSubscriptionByCustomer({
    stripe_customer_id: customerId,
    user_id: userIdFromMeta,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: priceId,
    plan: priceIdToPlan(priceId),
    current_period_end: isoOrNull(periodEnd),
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();

  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: `Invalid signature: ${(e as Error).message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (customerId && subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          // Make sure customer is linked to user before we sync (from checkout metadata).
          const userId = session.client_reference_id ?? undefined;
          if (userId) {
            await upsertSubscriptionByCustomer({
              stripe_customer_id: customerId,
              user_id: userId,
              status: sub.status,
            });
          }
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      case "invoice.payment_failed":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = invoice.parent?.subscription_details?.subscription;
        if (subRef) {
          const subId = typeof subRef === "string" ? subRef : subRef.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
