"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { subscribeUnlocks, type ClientUnlock } from "@/lib/achievements/client";
import { AchievementBadge } from "./AchievementBadge";
import { TIER_ACCENT } from "./badges/BadgeFrame";
import { TIER_RANK } from "@/lib/achievements/types";

/**
 * Renders achievement unlock toasts in the bottom-right viewport, above the
 * existing app toaster. Stacks up to 3, auto-dismisses after 5 seconds.
 *
 * Bronze and Silver tiers use this lightweight toast. Gold and above are
 * still toasted here in Phase 1; the full-screen modal celebration arrives
 * in Phase 2.
 */

type ActiveToast = ClientUnlock & { id: string };

const MAX_VISIBLE = 3;
const DURATION_MS = 5000;

export function AchievementToastHost() {
  const [toasts, setToasts] = React.useState<ActiveToast[]>([]);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    return subscribeUnlocks((unlocks) => {
      // Gold and above get the fullscreen celebration; toast only for bronze/silver.
      const small = unlocks.filter((u) => TIER_RANK[u.tier] < TIER_RANK.gold);
      if (small.length === 0) return;
      setToasts((prev) => {
        const next: ActiveToast[] = [
          ...prev,
          ...small.map((u) => ({ ...u, id: `${u.id}-${Date.now()}-${Math.random()}` })),
        ];
        return next.slice(-MAX_VISIBLE);
      });
    });
  }, []);

  React.useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, DURATION_MS)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [toasts]);

  return (
    <div
      className="pointer-events-none fixed bottom-24 right-4 z-[110] flex w-full max-w-sm flex-col gap-2 sm:right-6"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const accent = TIER_ACCENT[t.tier];
          return (
            <motion.div
              key={t.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-center gap-3 rounded-xl border bg-popover/95 p-3 shadow-2xl backdrop-blur-xl"
              style={{ borderColor: `${accent.stroke}55` }}
            >
              <div
                className="shrink-0 rounded-lg p-1"
                style={{ background: `${accent.glow}15` }}
              >
                <AchievementBadge id={t.id} tier={t.tier} title={t.title} size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Achievement unlocked
                </div>
                <div
                  className="truncate text-sm"
                  style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                >
                  {t.title}
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                +{t.points}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
