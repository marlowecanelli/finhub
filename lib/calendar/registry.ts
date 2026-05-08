import type { EventType, EventImportance } from "./types";

export type EventTypeMeta = {
  type: EventType;
  label: string;
  /** Tailwind-friendly hex used for chip dots, borders, badges. */
  color: string;
  /** Soft tint background for cells/cards. */
  tint: string;
  /** Lucide icon name (resolved at component-level to keep this file SSR-safe). */
  icon: string;
  /** One-liner shown in tooltips/legends. */
  blurb: string;
};

export const EVENT_TYPE_REGISTRY: Record<EventType, EventTypeMeta> = {
  earnings: {
    type: "earnings",
    label: "Earnings",
    color: "#a855f7",
    tint: "rgba(168, 85, 247, 0.10)",
    icon: "TrendingUp",
    blurb: "Quarterly company results",
  },
  dividend: {
    type: "dividend",
    label: "Dividends",
    color: "#10b981",
    tint: "rgba(16, 185, 129, 0.10)",
    icon: "Coins",
    blurb: "Ex-div, record, and payment dates",
  },
  economic: {
    type: "economic",
    label: "Economic",
    color: "#f97316",
    tint: "rgba(249, 115, 22, 0.10)",
    icon: "Activity",
    blurb: "CPI, jobs, FOMC, GDP, PMI",
  },
  ipo: {
    type: "ipo",
    label: "IPOs",
    color: "#3b82f6",
    tint: "rgba(59, 130, 246, 0.10)",
    icon: "Rocket",
    blurb: "New listings and pricings",
  },
  split: {
    type: "split",
    label: "Stock Splits",
    color: "#06b6d4",
    tint: "rgba(6, 182, 212, 0.10)",
    icon: "Split",
    blurb: "Forward and reverse splits",
  },
  opex: {
    type: "opex",
    label: "Options Expiry",
    color: "#eab308",
    tint: "rgba(234, 179, 8, 0.10)",
    icon: "Clock",
    blurb: "Weekly, monthly, quarterly OPEX",
  },
  holiday: {
    type: "holiday",
    label: "Market Holidays",
    color: "#94a3b8",
    tint: "rgba(148, 163, 184, 0.10)",
    icon: "CalendarOff",
    blurb: "NYSE/Nasdaq closures and half-days",
  },
  conference: {
    type: "conference",
    label: "Conferences",
    color: "#ec4899",
    tint: "rgba(236, 72, 153, 0.10)",
    icon: "Mic",
    blurb: "Investor days, GTC, WWDC, CES",
  },
  crypto: {
    type: "crypto",
    label: "Crypto",
    color: "#f59e0b",
    tint: "rgba(245, 158, 11, 0.10)",
    icon: "Bitcoin",
    blurb: "Halvings, forks, token unlocks",
  },
  treasury: {
    type: "treasury",
    label: "Treasury Auctions",
    color: "#64748b",
    tint: "rgba(100, 116, 139, 0.10)",
    icon: "Landmark",
    blurb: "T-bill, note, bond, TIPS auctions",
  },
  lockup: {
    type: "lockup",
    label: "Lock-up Expirations",
    color: "#ef4444",
    tint: "rgba(239, 68, 68, 0.10)",
    icon: "Unlock",
    blurb: "Post-IPO insider lock-up release",
  },
  custom: {
    type: "custom",
    label: "My Events",
    color: "#e2e8f0",
    tint: "rgba(226, 232, 240, 0.10)",
    icon: "Star",
    blurb: "Personal reminders",
  },
};

export const ALL_EVENT_TYPES: EventType[] = Object.keys(
  EVENT_TYPE_REGISTRY
) as EventType[];

export const IMPORTANCE_META: Record<
  EventImportance,
  { label: string; color: string; weight: number }
> = {
  critical: { label: "Critical", color: "#ef4444", weight: 4 },
  high: { label: "High", color: "#f97316", weight: 3 },
  medium: { label: "Medium", color: "#eab308", weight: 2 },
  low: { label: "Low", color: "#64748b", weight: 1 },
};

export function colorForType(type: EventType): string {
  return EVENT_TYPE_REGISTRY[type].color;
}

export function tintForType(type: EventType): string {
  return EVENT_TYPE_REGISTRY[type].tint;
}

export function labelForType(type: EventType): string {
  return EVENT_TYPE_REGISTRY[type].label;
}
