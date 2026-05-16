import { createServerSupabase } from "./supabase-server";
import { getSupabaseAdmin } from "./supabase-admin";

export type SubscriptionRow = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  price_id: string | null;
  plan: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function isProStatus(sub: Pick<SubscriptionRow, "status"> | null | undefined): boolean {
  if (!sub) return false;
  return ACTIVE_STATUSES.has(sub.status);
}

export async function getCurrentUserSubscription(): Promise<{
  userId: string | null;
  email: string | null;
  subscription: SubscriptionRow | null;
  isPro: boolean;
}> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, email: null, subscription: null, isPro: false };

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const sub = (data as SubscriptionRow | null) ?? null;
  return {
    userId: user.id,
    email: user.email ?? null,
    subscription: sub,
    isPro: isProStatus(sub),
  };
}

// Server-only: looks up via service role (used by webhook).
export async function upsertSubscriptionByCustomer(args: {
  stripe_customer_id: string;
  user_id?: string;
  stripe_subscription_id?: string | null;
  status: string;
  price_id?: string | null;
  plan?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin client not configured");

  let userId = args.user_id;
  if (!userId) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", args.stripe_customer_id)
      .maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) {
    throw new Error(`No user mapped to stripe customer ${args.stripe_customer_id}`);
  }

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: args.stripe_customer_id,
      stripe_subscription_id: args.stripe_subscription_id ?? null,
      status: args.status,
      price_id: args.price_id ?? null,
      plan: args.plan ?? null,
      current_period_end: args.current_period_end ?? null,
      cancel_at_period_end: args.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}
