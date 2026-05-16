"use client";

import Link from "next/link";
import { CreditCard, Sparkles } from "lucide-react";
import { ManageBillingButton } from "./checkout-button";

type Props = {
  isPro: boolean;
  status: string | null;
  plan: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
};

export function BillingSection({
  isPro,
  status,
  plan,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  hasCustomer,
}: Props) {
  const renewsOn = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section className="glass p-5 md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
          <CreditCard className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold">Subscription</h2>
          <p className="text-xs text-muted-foreground">
            Your FinHub plan and billing.
          </p>
        </div>
        {isPro && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Pro
          </span>
        )}
      </div>

      {isPro ? (
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium capitalize">{plan ?? "pro"}</span>
          </div>
          {renewsOn && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {cancelAtPeriodEnd ? "Ends on" : "Renews on"}
              </span>
              <span className="font-medium">{renewsOn}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{status ?? "active"}</span>
          </div>
          <div className="pt-2">
            <ManageBillingButton />
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            You&apos;re on the Free plan. Upgrade to Pro to unlock AI ticker
            analysis, market recaps, research, and the AI portfolio builder.
          </p>
          <div className="flex gap-2">
            <Link
              href="/pricing"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              View Pro plan
            </Link>
            {hasCustomer && <ManageBillingButton />}
          </div>
        </div>
      )}
    </section>
  );
}
