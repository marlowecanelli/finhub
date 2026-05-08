"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CalendarSettings } from "@/lib/calendar/types";
import type { CalendarView } from "./store";

export function SettingsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/calendar/settings")
      .then((r) => r.json())
      .then((j) => setSettings(j.data ?? null))
      .finally(() => setLoading(false));
  }, [open]);

  async function patch(update: Partial<CalendarSettings>) {
    if (!settings) return;
    const optimistic = { ...settings, ...update } as CalendarSettings;
    setSettings(optimistic);
    await fetch("/api/calendar/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
  }

  const feedUrl =
    typeof window !== "undefined" && settings
      ? `${window.location.origin}/api/calendar/feed/${settings.feed_token}`
      : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetTitle className="font-display text-2xl">Calendar settings</SheetTitle>
        <SheetDescription>Tune what you see and how you're notified.</SheetDescription>

        {loading || !settings ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="space-y-2">
              <Label>Default view</Label>
              <div className="flex gap-1.5">
                {(["month", "week", "agenda", "heatmap"] as CalendarView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => patch({ default_view: v })}
                    className={
                      "rounded-md border px-3 py-1.5 text-xs capitalize transition-colors " +
                      (settings.default_view === v
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground")
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <Label htmlFor="tz">Timezone</Label>
              <Input
                id="tz"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                onBlur={(e) => patch({ timezone: e.target.value })}
              />
            </section>

            <section className="space-y-2">
              <Label className="flex items-center justify-between">
                Default to watchlist only
                <input
                  type="checkbox"
                  checked={settings.watchlist_only}
                  onChange={(e) => patch({ watchlist_only: e.target.checked })}
                  className="h-4 w-4 accent-[hsl(var(--signal))]"
                />
              </Label>
            </section>

            <section className="space-y-2">
              <Label className="flex items-center justify-between">
                Email digest
                <input
                  type="checkbox"
                  checked={settings.email_digest_enabled}
                  onChange={(e) => patch({ email_digest_enabled: e.target.checked })}
                  className="h-4 w-4 accent-[hsl(var(--signal))]"
                />
              </Label>
              {settings.email_digest_enabled && (
                <div>
                  <Label htmlFor="hour" className="text-xs text-muted-foreground">
                    Send at hour ({settings.email_digest_hour}:00)
                  </Label>
                  <input
                    id="hour"
                    type="range"
                    min={0}
                    max={23}
                    value={settings.email_digest_hour}
                    onChange={(e) => patch({ email_digest_hour: Number(e.target.value) })}
                    className="w-full accent-[hsl(var(--signal))]"
                  />
                </div>
              )}
            </section>

            <section className="space-y-2">
              <Label>Alert lead time</Label>
              <div className="flex gap-1.5">
                {[15, 30, 60, 1440].map((m) => (
                  <button
                    key={m}
                    onClick={() => patch({ alert_lead_time_minutes: m })}
                    className={
                      "rounded-md border px-3 py-1.5 text-xs transition-colors " +
                      (settings.alert_lead_time_minutes === m
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground")
                    }
                  >
                    {m === 1440 ? "1 day" : `${m} min`}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2 border-t border-border/60 pt-5">
              <Label>Subscribe URL</Label>
              <p className="text-xs text-muted-foreground">
                Add this URL to Google, Apple, or Outlook calendar to see FinHub events natively.
              </p>
              <div className="flex gap-2">
                <Input value={feedUrl} readOnly className="font-mono text-[11px]" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(feedUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1400);
                  }}
                >
                  {copied ? <Check className="h-4 w-4 text-[hsl(var(--signal))]" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
