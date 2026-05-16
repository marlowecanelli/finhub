import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  cached = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  return cached;
}

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
  yearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? "",
} as const;

export type PlanInterval = keyof typeof STRIPE_PRICES;

export function priceIdToPlan(priceId: string | null | undefined): "monthly" | "yearly" | null {
  if (!priceId) return null;
  if (priceId === STRIPE_PRICES.monthly) return "monthly";
  if (priceId === STRIPE_PRICES.yearly) return "yearly";
  return null;
}
