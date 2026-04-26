import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase-server";
import { WatchlistClient } from "@/components/watchlist/watchlist-client";
import type { WatchlistItem } from "@/lib/watchlist";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Watchlist" };

async function load(): Promise<
  | { kind: "unconfigured" }
  | { kind: "unauth" }
  | { kind: "ok"; items: WatchlistItem[] }
> {
  let sb;
  try {
    sb = createServerSupabase();
  } catch {
    return { kind: "unconfigured" };
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { kind: "unauth" };
  const { data } = await sb
    .from("watchlist_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return { kind: "ok", items: (data ?? []) as WatchlistItem[] };
}

export default async function WatchlistPage() {
  const r = await load();
  if (r.kind === "unconfigured") return <Notice title="Supabase not configured" body="Add Supabase env vars to enable watchlists." />;
  if (r.kind === "unauth")
    return (
      <Notice
        title="Sign in to use a watchlist"
        body="Watchlists are stored per user."
        cta={{ label: "Sign in", href: "/sign-in?next=/watchlist" }}
      />
    );
  return <WatchlistClient initialItems={r.items} />;
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
        <Star className="h-5 w-5" />
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
