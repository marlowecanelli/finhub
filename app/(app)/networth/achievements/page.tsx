"use client";

import { motion } from "framer-motion";
import { useNetWorthStore } from "@/lib/networth/store";
import { ACHIEVEMENT_DEFS } from "@/lib/networth/achievements";
import { cn } from "@/lib/utils";

export default function AchievementsPage() {
  const achievements = useNetWorthStore((s) => s.achievements);
  const have = new Map(achievements.map((a) => [a.type, a]));
  const entries = Object.entries(ACHIEVEMENT_DEFS);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Achievements</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {achievements.length} of {entries.length} unlocked.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {entries.map(([key, def], idx) => {
          const unlocked = have.get(key);
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              className={cn(
                "relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-5 text-center transition",
                unlocked
                  ? "border-emerald-400/30 bg-gradient-to-br from-emerald-950/50 via-zinc-950 to-zinc-950"
                  : "border-white/5 bg-zinc-950/60 opacity-60"
              )}
            >
              <div className={cn("text-4xl transition", !unlocked && "grayscale")}>
                {def.emoji}
              </div>
              <div className="font-medium text-white">{def.name}</div>
              <div className="text-xs text-zinc-400">{def.description}</div>
              {unlocked && (
                <div className="text-[10px] text-emerald-300">
                  {new Date(unlocked.unlockedAt).toLocaleDateString()}
                </div>
              )}
              {!unlocked && (
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Locked</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
