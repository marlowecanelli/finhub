"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { subscribeUnlocks, type ClientUnlock } from "@/lib/achievements/client";
import { AchievementBadge } from "./AchievementBadge";
import { TIER_ACCENT } from "./badges/BadgeFrame";
import { TIER_RANK } from "@/lib/achievements/types";

/**
 * Fullscreen cinematic celebration for higher-tier achievement unlocks.
 * Bronze + Silver use the lightweight toast in AchievementToastHost.
 * Gold+ triggers this modal with confetti, sweeping shine, and a fanfare.
 *
 * If multiple gold+ unlocks fire at once, they queue and display sequentially.
 */

const QUEUE_TIER_THRESHOLD = TIER_RANK.gold;
const AUTO_DISMISS_MS = 6000;
const CONFETTI_COUNT = 60;

type Particle = {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  delay: number;
  duration: number;
  color: string;
  shape: "rect" | "circle" | "triangle";
};

function buildParticles(accent: string): Particle[] {
  const colors = [accent, "#ffffff", `${accent}aa`];
  const shapes: Particle["shape"][] = ["rect", "circle", "triangle"];
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 800,
    y: -100 - Math.random() * 200,
    rotate: Math.random() * 720 - 360,
    scale: 0.6 + Math.random() * 0.9,
    delay: Math.random() * 0.4,
    duration: 1.6 + Math.random() * 1.4,
    color: colors[i % colors.length]!,
    shape: shapes[i % shapes.length]!,
  }));
}

function Confetti({ particles, reduce }: { particles: Particle[]; reduce: boolean }) {
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: -200, rotate: 0, opacity: 0 }}
          animate={{
            x: p.x,
            y: typeof window !== "undefined" ? window.innerHeight + 200 : 1000,
            rotate: p.rotate,
            opacity: [0, 1, 1, 0.4, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
          className="absolute left-1/2 top-1/3"
          style={{ scale: p.scale }}
        >
          {p.shape === "rect" && (
            <div
              style={{
                width: 8,
                height: 14,
                background: p.color,
                borderRadius: 1,
              }}
            />
          )}
          {p.shape === "circle" && (
            <div
              style={{
                width: 8,
                height: 8,
                background: p.color,
                borderRadius: "50%",
              }}
            />
          )}
          {p.shape === "triangle" && (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: `10px solid ${p.color}`,
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

type Celebration = ClientUnlock & { _key: string };

export function AchievementCelebration() {
  const [queue, setQueue] = React.useState<Celebration[]>([]);
  const reduce = useReducedMotion() ?? false;

  React.useEffect(() => {
    return subscribeUnlocks((unlocks) => {
      const eligible = unlocks.filter((u) => TIER_RANK[u.tier] >= QUEUE_TIER_THRESHOLD);
      if (eligible.length === 0) return;
      setQueue((prev) => [
        ...prev,
        ...eligible.map((u) => ({ ...u, _key: `${u.id}-${Date.now()}-${Math.random()}` })),
      ]);
    });
  }, []);

  const current = queue[0];

  // Auto-dismiss after AUTO_DISMISS_MS
  React.useEffect(() => {
    if (!current) return;
    const t = window.setTimeout(() => {
      setQueue((prev) => prev.slice(1));
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [current?._key]);

  // ESC to dismiss
  React.useEffect(() => {
    if (!current) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQueue((prev) => prev.slice(1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current?._key]);

  const particles = React.useMemo(
    () => (current ? buildParticles(TIER_ACCENT[current.tier].glow) : []),
    [current?._key]
  );

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current._key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={() => setQueue((prev) => prev.slice(1))}
          role="dialog"
          aria-modal="true"
          aria-label={`Achievement unlocked: ${current.title}`}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Tier radial glow background */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.45, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, ${TIER_ACCENT[current.tier].glow}55, transparent 60%)`,
            }}
          />

          {/* Confetti */}
          <Confetti particles={particles} reduce={reduce} />

          {/* Card */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.85 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 22,
              delay: 0.1,
            }}
            className="relative z-10 mx-4 flex w-full max-w-md flex-col items-center rounded-2xl border bg-popover/95 px-8 py-10 text-center shadow-2xl backdrop-blur-xl"
            style={{ borderColor: `${TIER_ACCENT[current.tier].stroke}66` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tier badge label */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border bg-background px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{
                borderColor: TIER_ACCENT[current.tier].stroke,
                color: TIER_ACCENT[current.tier].stroke,
              }}
            >
              {TIER_ACCENT[current.tier].label} Unlocked
            </motion.div>

            {/* Badge with glow ring */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, rotate: -25 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 180,
                damping: 14,
              }}
              className="relative my-6"
            >
              {/* Pulsing glow ring */}
              {!reduce && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${TIER_ACCENT[current.tier].glow}66 0%, transparent 70%)`,
                      filter: "blur(20px)",
                    }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Sweeping shine */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ delay: 0.5, duration: 1.4, times: [0, 0.5, 1] }}
                  >
                    <motion.div
                      className="absolute -inset-y-4 -left-12 w-12"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${TIER_ACCENT[current.tier].glow}aa, transparent)`,
                        filter: "blur(4px)",
                      }}
                      animate={{ x: 180 }}
                      transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                    />
                  </motion.div>
                </>
              )}

              <AchievementBadge
                id={current.id}
                tier={current.tier}
                title={current.title}
                size="lg"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-xs uppercase tracking-[0.25em] text-muted-foreground"
            >
              Achievement Unlocked
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-2 text-3xl"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              {current.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-3 max-w-sm text-sm italic text-muted-foreground"
            >
              {current.flavorText}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider"
              style={{ color: TIER_ACCENT[current.tier].stroke }}
            >
              <span>+{current.points} XP</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-muted-foreground">{current.category}</span>
            </motion.div>

            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={() => setQueue((prev) => prev.slice(1))}
              className="mt-6 rounded-full border border-border/50 px-5 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-popover/60 hover:text-foreground"
            >
              Continue
            </motion.button>

            {queue.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-3 font-mono text-[10px] text-muted-foreground/60"
              >
                {queue.length - 1} more queued
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
