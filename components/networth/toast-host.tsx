"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Toast = { id: string; emoji: string; name: string; description: string };

export function AchievementToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type: string; name: string; emoji: string; description: string };
      const id = `${detail.type}_${Date.now()}`;
      setToasts((ts) => [...ts, { id, emoji: detail.emoji, name: detail.name, description: detail.description }]);
      setTimeout(() => {
        setToasts((ts) => ts.filter((t) => t.id !== id));
      }, 5000);
    };
    window.addEventListener("networth-achievement", handler);
    return () => window.removeEventListener("networth-achievement", handler);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto flex w-80 items-start gap-3 overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-900/95 via-zinc-900/95 to-zinc-900/95 p-4 shadow-2xl shadow-emerald-500/10 backdrop-blur"
          >
            <div className="text-3xl">{t.emoji}</div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-emerald-300/90">
                Achievement unlocked
              </div>
              <div className="font-semibold text-white">{t.name}</div>
              <div className="mt-0.5 text-sm text-zinc-300">{t.description}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
