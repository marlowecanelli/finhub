import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { getCurrentUserSubscription } from "@/lib/subscription";
import { CheckoutButton } from "@/components/billing/checkout-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pricing — FinHub" };

const PRO_FEATURES = [
  "Unlimited AI ticker analysis",
  "AI-generated daily market recaps",
  "Portfolio analyst & AI portfolio builder",
  "AI news summaries and event briefs",
  "Deep Research workspace",
  "Priority access to new AI features",
];

const FREE_FEATURES = [
  "Dashboard, screener, portfolio",
  "Paper trading & net worth",
  "Watchlist, calendar, news",
  "Calculators & hindsight",
  "Buffett screener",
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: { locked?: string; checkout?: string };
}) {
  const { isPro, userId } = await getCurrentUserSubscription();
  const locked = searchParams?.locked;
  const cancelled = searchParams?.checkout === "cancelled";

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" /> FinHub Pro
        </div>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Unlock every AI feature
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Free covers the core hub. Pro unlocks the AI research, recaps, and analyst tools
          that make FinHub feel like a Bloomberg terminal.
        </p>
        {locked && (
          <p className="mt-4 text-xs text-amber-500">
            {locked} requires a Pro subscription.
          </p>
        )}
        {cancelled && (
          <p className="mt-4 text-xs text-muted-foreground">
            Checkout cancelled — no worries.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card name="Free" price="$0" interval="forever" features={FREE_FEATURES}>
          <Link
            href={userId ? "/dashboard" : "/sign-up"}
            className="block w-full rounded-md border bg-background px-4 py-2 text-center text-sm font-medium hover:bg-muted"
          >
            {userId ? "Go to dashboard" : "Get started"}
          </Link>
        </Card>

        <Card
          name="Pro"
          price="$9"
          interval="/ month"
          features={PRO_FEATURES}
          highlight
          subText="or $79 / year (save ~27%)"
        >
          {isPro ? (
            <Link
              href="/settings"
              className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Manage subscription
            </Link>
          ) : !userId ? (
            <Link
              href="/sign-up?next=/pricing"
              className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Sign up to upgrade
            </Link>
          ) : (
            <div className="space-y-2">
              <CheckoutButton interval="monthly" label="Upgrade — $9 / mo" primary />
              <CheckoutButton interval="yearly" label="Upgrade — $79 / yr" />
            </div>
          )}
        </Card>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Cancel anytime. Secure checkout by Stripe.
      </p>
    </div>
  );
}

function Card({
  name,
  price,
  interval,
  subText,
  features,
  highlight,
  children,
}: {
  name: string;
  price: string;
  interval: string;
  subText?: string;
  features: string[];
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`glass relative flex flex-col gap-6 p-8 ${
        highlight ? "ring-2 ring-primary" : ""
      }`}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {name}
        </p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-4xl font-semibold tracking-tight">{price}</span>
          <span className="text-sm text-muted-foreground">{interval}</span>
        </div>
        {subText && (
          <p className="mt-1 text-xs text-muted-foreground">{subText}</p>
        )}
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
