import Link from "next/link";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase-server";
import { SavingsGoalsClient } from "@/components/calculators/savings-goals-client";
import type { Goal } from "@/lib/calculators";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Savings Goals · FinHub" };

async function load(): Promise<
  | { kind: "unconfigured" }
  | { kind: "unauth" }
  | { kind: "ok"; goals: Goal[] }
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

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return { kind: "error", message: error.message };
  return { kind: "ok", goals: (data ?? []) as Goal[] };
}

export default async function Page() {
  const result = await load();
  if (result.kind === "unconfigured") return <Notice title="Supabase isn't configured" body="Add your Supabase env vars to start tracking goals." />;
  if (result.kind === "unauth")
    return (
      <Notice
        title="Sign in to track goals"
        body="Goals are stored per user. Sign in to create one."
        cta={{ label: "Sign in", href: "/sign-in?next=/calculators/savings-goals" }}
      />
    );
  if (result.kind === "error") return <Notice title="Couldn't load goals" body={result.message} />;
  return <SavingsGoalsClient initialGoals={result.goals} />;
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
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/30">
        <Target className="h-5 w-5" />
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
