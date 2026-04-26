"use client";

import * as React from "react";
import { Loader2, Star } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/toast/toast-provider";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Props = {
  ticker: string;
  size?: ButtonProps["size"];
};

export function WatchlistButton({ ticker, size = "sm" }: Props) {
  const t = useToast();
  const [watching, setWatching] = React.useState<boolean | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const sb = (() => {
      try {
        return createClient();
      } catch {
        return null;
      }
    })();
    if (!sb) {
      setWatching(false);
      return;
    }
    sb.auth
      .getUser()
      .then(async ({ data }) => {
        if (cancelled) return;
        if (!data.user) {
          setWatching(false);
          return;
        }
        const { data: row } = await sb
          .from("watchlist_items")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("ticker", ticker.toUpperCase())
          .maybeSingle();
        if (!cancelled) setWatching(Boolean(row));
      })
      .catch(() => !cancelled && setWatching(false));
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  async function toggle() {
    const sb = (() => {
      try {
        return createClient();
      } catch {
        return null;
      }
    })();
    if (!sb) {
      t.warning("Watchlist unavailable", "Supabase isn't configured.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await sb.auth.getUser();
      if (!data.user) {
        t.warning("Sign in to add to watchlist");
        return;
      }
      const sym = ticker.toUpperCase();
      if (watching) {
        const { error } = await sb
          .from("watchlist_items")
          .delete()
          .eq("user_id", data.user.id)
          .eq("ticker", sym);
        if (error) throw error;
        setWatching(false);
        t.success("Removed", `${sym} removed from watchlist`);
      } else {
        const { error } = await sb
          .from("watchlist_items")
          .insert({ user_id: data.user.id, ticker: sym });
        if (error) throw error;
        setWatching(true);
        t.success("Added", `${sym} added to watchlist`);
      }
    } catch (err) {
      t.error("Couldn't update watchlist", err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size={size}
      variant={watching ? "default" : "glass"}
      onClick={toggle}
      disabled={busy || watching === null}
      aria-pressed={Boolean(watching)}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Star className={cn("h-4 w-4", watching && "fill-current")} />
      )}
      {watching ? "Watching" : "Watchlist"}
    </Button>
  );
}
