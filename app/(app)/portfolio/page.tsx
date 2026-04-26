import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase-server";
import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import type { Holding, Portfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadPortfolio(): Promise<
  | { kind: "unauth" }
  | { kind: "unconfigured" }
  | { kind: "ok"; portfolio: Portfolio; holdings: Holding[] }
  | { kind: "error"; message: string }
> {
  let supabase;
  try {
    supabase = createServerSupabase();
  } catch {
    return { kind: "unconfigured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "unauth" };

  const { data: existing, error: selErr } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<Portfolio>();
  if (selErr) return { kind: "error", message: selErr.message };

  let portfolio = existing;
  if (!portfolio) {
    const { data: created, error: insErr } = await supabase
      .from("portfolios")
      .insert({ user_id: user.id, name: "My Portfolio" })
      .select()
      .single<Portfolio>();
    if (insErr) return { kind: "error", message: insErr.message };
    portfolio = created;
  }

  const { data: holdings, error: hErr } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", portfolio.id)
    .order("created_at", { ascending: true });
  if (hErr) return { kind: "error", message: hErr.message };

  return { kind: "ok", portfolio, holdings: (holdings ?? []) as Holding[] };
}

export default async function PortfolioPage() {
  const result = await loadPortfolio();

  if (result.kind === "unconfigured") {
    return <SetupNotice />;
  }
  if (result.kind === "unauth") {
    return <NotSignedIn />;
  }
  if (result.kind === "error") {
    return <LoadError message={result.message} />;
  }

  return (
    <PortfolioClient
      portfolio={result.portfolio}
      initialHoldings={result.holdings}
    />
  );
}

function SetupNotice() {
  return (
    <Empty
      title="Supabase isn't configured"
      description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then apply the portfolios migration to start tracking holdings."
    />
  );
}

function NotSignedIn() {
  return (
    <Empty
      title="Sign in to track a portfolio"
      description="Portfolios are stored per user. Sign in to create one and start adding holdings."
      cta={{ label: "Sign in", href: "/sign-in?next=/portfolio" }}
    />
  );
}

function LoadError({ message }: { message: string }) {
  return (
    <Empty
      title="Couldn't load your portfolio"
      description={message}
    />
  );
}

function Empty({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
        <Briefcase className="h-5 w-5" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {cta && (
        <Button asChild className="mt-6">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}
