import Link from "next/link";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase-server";
import { SettingsClient } from "@/components/settings/settings-client";
import { getCurrentUserSubscription } from "@/lib/subscription";
import { BillingSection } from "@/components/billing/billing-section";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  let sb;
  try {
    sb = createServerSupabase();
  } catch {
    return <Notice title="Supabase not configured" body="Add Supabase env vars to enable account settings." />;
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <Notice
        title="Sign in to manage your account"
        body="Account settings are only available to signed-in users."
        cta={{ label: "Sign in", href: "/sign-in?next=/settings" }}
      />
    );
  }

  const { subscription, isPro } = await getCurrentUserSubscription();

  return (
    <div className="space-y-6">
      <SettingsClient
        email={user.email ?? ""}
        createdAt={user.created_at ?? null}
      />
      <div className="mx-auto max-w-2xl px-4 md:px-8">
        <BillingSection
          isPro={isPro}
          status={subscription?.status ?? null}
          plan={subscription?.plan ?? null}
          currentPeriodEnd={subscription?.current_period_end ?? null}
          cancelAtPeriodEnd={subscription?.cancel_at_period_end ?? false}
          hasCustomer={Boolean(subscription?.stripe_customer_id)}
        />
      </div>
    </div>
  );
}

function Notice({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
        <UserIcon className="h-5 w-5" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {cta && (
        <Button asChild className="mt-6">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}
