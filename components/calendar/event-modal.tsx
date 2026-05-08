"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Bitcoin,
  Calendar as CalendarIcon,
  Coins,
  Download,
  ExternalLink,
  Activity,
  CalendarOff,
  Landmark,
  Mic,
  Rocket,
  Sparkles,
  Split,
  Star,
  Clock,
  TrendingUp,
  Unlock,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "./store";
import {
  EVENT_TYPE_REGISTRY,
  IMPORTANCE_META,
  colorForType,
  labelForType,
} from "@/lib/calendar/registry";
import type { CalendarEvent } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

const ICONS = {
  TrendingUp, Coins, Activity, Rocket, Split, Clock, CalendarOff, Mic,
  Bitcoin, Landmark, Unlock, Star,
} as const;

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZoneName: "short",
  });
}

function fmtNumber(x: number | null | undefined, opts?: Intl.NumberFormatOptions): string {
  if (x == null) return "—";
  return new Intl.NumberFormat("en-US", opts).format(x);
}

function MetadataPanel({ event }: { event: CalendarEvent }) {
  const m = event.metadata;
  switch (m.kind) {
    case "earnings":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="EPS estimate" value={m.epsEstimate != null ? `$${m.epsEstimate.toFixed(2)}` : "—"} />
          <Stat label="Revenue estimate" value={m.revenueEstimate != null ? fmtNumber(m.revenueEstimate, { notation: "compact" }) : "—"} />
          <Stat label="Last EPS actual" value={m.lastEpsActual != null ? `$${m.lastEpsActual.toFixed(2)}` : "—"} />
          <Stat label="Last surprise" value={m.lastSurprisePct != null ? `${m.lastSurprisePct > 0 ? "+" : ""}${m.lastSurprisePct.toFixed(1)}%` : "—"}
            tone={m.lastSurprisePct == null ? undefined : m.lastSurprisePct > 0 ? "good" : m.lastSurprisePct < 0 ? "bad" : undefined} />
          <Stat label="Market cap" value={m.marketCap != null ? `$${fmtNumber(m.marketCap, { notation: "compact" })}` : "—"} />
          <Stat label="Cap tier" value={m.marketCapTier ?? "—"} />
        </div>
      );
    case "dividend":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Amount per share" value={`$${m.amount.toFixed(4)}`} />
          <Stat label="Yield (annualized)" value={m.yieldPct != null ? `${m.yieldPct.toFixed(2)}%` : "—"} />
          <Stat label="Payment date" value={m.paymentDate ? new Date(m.paymentDate).toLocaleDateString() : "—"} />
          <Stat label="Type" value={m.isSpecial ? "Special" : "Regular"} />
        </div>
      );
    case "economic":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Agency" value={m.releaseAgency ?? "—"} />
          <Stat label="Unit" value={m.unit ?? "—"} />
          <Stat label="Consensus" value={m.consensusForecast ?? "TBD"} />
          <Stat label="Previous" value={m.previousReading ?? "—"} />
        </div>
      );
    case "ipo":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Status" value={m.status ?? "filed"} />
          <Stat label="Expected ticker" value={m.expectedTicker ?? "—"} />
          <Stat label="Price range" value={m.priceLow && m.priceHigh ? `$${m.priceLow}–$${m.priceHigh}` : "—"} />
          <Stat label="Deal size" value={m.dealSize != null ? `$${fmtNumber(m.dealSize, { notation: "compact" })}` : "—"} />
          <Stat label="Sector" value={m.sector ?? "—"} />
        </div>
      );
    case "split":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Ratio" value={`${m.ratioTo}-for-${m.ratioFrom}`} />
          <Stat label="Type" value={m.isReverse ? "Reverse split" : "Forward split"} tone={m.isReverse ? "bad" : "good"} />
        </div>
      );
    case "opex":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Category" value={m.category} />
          <Stat label="Triple witching" value={m.isTripleWitching ? "Yes" : "No"} tone={m.isTripleWitching ? "good" : undefined} />
        </div>
      );
    case "holiday":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Market" value={m.market} />
          <Stat label="Schedule" value={m.isHalfDay ? `Half-day · ${m.earlyClose}` : "Closed"} />
        </div>
      );
    case "conference":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Organizer" value={m.organizer ?? "—"} />
          <Stat label="Location" value={m.location ?? "—"} />
          {m.url && (
            <a
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="col-span-2 inline-flex items-center gap-1.5 text-sm text-[hsl(var(--signal))] hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Event website
            </a>
          )}
        </div>
      );
    case "crypto":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Asset" value={m.asset} />
          <Stat label="Category" value={m.category} />
        </div>
      );
    case "treasury":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Instrument" value={m.instrument} />
          <Stat label="Offering size" value={m.amount != null ? `$${fmtNumber(m.amount, { notation: "compact" })}` : "—"} />
        </div>
      );
    case "lockup":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="IPO date" value={new Date(m.ipoDate).toLocaleDateString()} />
          <Stat label="Source" value={m.estimated ? "Estimated (180-day)" : "Confirmed"} />
        </div>
      );
    case "custom":
    default:
      return null;
  }
}

function Stat({
  label, value, tone,
}: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 font-mono text-base tabular-nums",
          tone === "good" && "text-[hsl(var(--signal))]",
          tone === "bad" && "text-destructive"
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function EventModal() {
  const selectedId = useCalendarStore((s) => s.selectedEventId);
  const select = useCalendarStore((s) => s.selectEvent);
  const events = useCalendarStore((s) => s.events);
  const event = selectedId ? events.find((e) => e.id === selectedId) ?? null : null;

  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  useEffect(() => {
    setAiBrief(null);
    setBriefLoading(false);
  }, [selectedId]);

  if (!event) return null;

  const meta = EVENT_TYPE_REGISTRY[event.event_type];
  const Icon = (ICONS as Record<string, typeof TrendingUp>)[meta.icon] ?? TrendingUp;
  const color = colorForType(event.event_type);
  const sameDay = events.filter(
    (e) =>
      e.id !== event.id &&
      e.event_date.slice(0, 10) === event.event_date.slice(0, 10)
  );

  async function fetchBrief(force = false) {
    if (!event) return;
    if (aiBrief && !force) return;
    setBriefLoading(true);
    try {
      const res = await fetch(`/api/ai/event-brief/${event.id}${force ? "?refresh=1" : ""}`);
      const json = (await res.json()) as { data?: { content: string }; error?: string };
      setAiBrief(json.data?.content ?? json.error ?? "Unable to generate brief.");
    } finally {
      setBriefLoading(false);
    }
  }

  return (
    <Dialog open={!!selectedId} onOpenChange={(o) => !o && select(null)}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
        />
        <div className="space-y-5 p-6">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}1f`, color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                    style={{ backgroundColor: `${color}1f`, color }}
                  >
                    {labelForType(event.event_type)}
                  </span>
                  <span
                    className="inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                    style={{
                      backgroundColor: `${IMPORTANCE_META[event.importance].color}1f`,
                      color: IMPORTANCE_META[event.importance].color,
                    }}
                  >
                    {IMPORTANCE_META[event.importance].label}
                  </span>
                </div>
                <DialogTitle className="mt-2 font-display text-2xl font-medium leading-tight">
                  {event.title}
                </DialogTitle>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {fmtDateTime(event.event_date)}
                </p>
              </div>
              {event.ticker && (
                <a
                  href={`/ticker/${event.ticker}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border/60 bg-background/80 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-foreground hover:border-foreground/40"
                >
                  {event.ticker}
                </a>
              )}
            </div>
          </DialogHeader>

          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}

          <MetadataPanel event={event} />

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Button asChild variant="outline" size="sm">
              <a href={`/api/calendar/ics/${event.id}`} download>
                <Download className="h-3.5 w-3.5" /> Add to calendar
              </a>
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Bell className="h-3.5 w-3.5" /> Set alert
            </Button>
            <Button
              variant="signal"
              size="sm"
              onClick={() => fetchBrief()}
              disabled={briefLoading}
            >
              {briefLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Why does this matter?
            </Button>
          </div>

          {aiBrief && (
            <div className="rounded-lg border border-[hsl(var(--signal)/0.3)] bg-[hsl(var(--signal)/0.04)] p-4">
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--signal))]">
                <Sparkles className="h-3 w-3" /> AI brief
              </div>
              <div className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {aiBrief}
              </div>
            </div>
          )}

          {sameDay.length > 0 && (
            <div className="border-t border-border/60 pt-4">
              <h4 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Other events this day
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {sameDay.slice(0, 8).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => select(e.id)}
                    className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2 py-1 text-xs hover:border-foreground/40"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: colorForType(e.event_type) }}
                    />
                    {e.ticker && <span className="font-mono text-[10px]">{e.ticker}</span>}
                    <span className="max-w-[160px] truncate">{e.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
