"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { previewUnlock, type ClientUnlock } from "@/lib/achievements/client";
import { useRouter } from "next/navigation";

/**
 * Triggers a server-side backfill that re-evaluates every achievement
 * against the user's event history. Useful after a catalog change so
 * existing activity unlocks any newly added or previously missed badges.
 * Broadcasts unlocks through the same channel as live events so toasts
 * and the celebration modal fire.
 */
export function SyncButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  async function sync() {
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch("/api/achievements/backfill", { method: "POST" });
      const data = (await r.json()) as { unlocks?: ClientUnlock[] };
      const unlocks = data.unlocks ?? [];
      if (unlocks.length === 0) {
        setResult("Up to date — no new unlocks");
      } else {
        setResult(`${unlocks.length} unlocked!`);
        // Broadcast through the same channel as live events so the
        // toast host + celebration modal pick them up.
        for (const u of unlocks) previewUnlock(u);
        // Refresh server data so the grid reflects new unlocks.
        router.refresh();
      }
      window.setTimeout(() => setResult(null), 4000);
    } catch {
      setResult("Sync failed");
      window.setTimeout(() => setResult(null), 3000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={sync}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        {busy ? "Syncing…" : "Sync achievements"}
      </button>
      {result && (
        <span className="font-mono text-[10px] text-muted-foreground">
          {result}
        </span>
      )}
    </div>
  );
}
