"use client";

import type { EventType } from "./types";

export type ClientUnlock = {
  id: string;
  title: string;
  description: string;
  flavorText: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "mythic";
  points: number;
  category: string;
};

type Listener = (unlocks: ClientUnlock[]) => void;
const listeners = new Set<Listener>();

export function subscribeUnlocks(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emitUnlocks(unlocks: ClientUnlock[]): void {
  if (unlocks.length === 0) return;
  for (const fn of listeners) fn(unlocks);
}

/**
 * Test helper: broadcasts a fake unlock to all subscribers without hitting
 * the server. Use to preview the celebration / toast UI.
 */
export function previewUnlock(unlock: ClientUnlock): void {
  emitUnlocks([unlock]);
}

/**
 * Emit a user event to the achievement engine. Fire-and-forget by default.
 * If unlocks come back, broadcasts them so the toast host can render them.
 */
export async function emitEvent(
  event: EventType,
  payload: Record<string, unknown> = {},
  durationMs?: number
): Promise<void> {
  try {
    const res = await fetch("/api/achievements/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload, durationMs }),
      credentials: "include",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { unlocks?: ClientUnlock[] };
    if (data.unlocks?.length) emitUnlocks(data.unlocks);
  } catch {
    // Silent: never let achievement emission disrupt the user flow.
  }
}
