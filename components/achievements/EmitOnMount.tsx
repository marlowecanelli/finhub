"use client";

import * as React from "react";
import { emitEvent } from "@/lib/achievements/client";
import type { EventType } from "@/lib/achievements/types";

/**
 * Client-only sentinel that fires a single achievement event when its parent
 * page mounts. Use sparingly: events should usually correspond to a real
 * user action, not a route load. Calculators and the AI builder are the
 * intended consumers because just opening them is the meaningful action.
 */
export function EmitOnMount({
  event,
  payload,
}: {
  event: EventType;
  payload?: Record<string, unknown>;
}) {
  const fired = React.useRef(false);
  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void emitEvent(event, payload ?? {});
  }, [event, payload]);
  return null;
}
