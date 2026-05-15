"use client";

import * as React from "react";
import { previewUnlock } from "@/lib/achievements/client";
import type { Tier } from "@/lib/achievements/types";

const SAMPLES: { tier: Tier; sample: { id: string; title: string; flavor: string; points: number; cat: string } }[] = [
  {
    tier: "gold",
    sample: {
      id: "monthly_maven",
      title: "Monthly Maven",
      flavor: "A full cycle. Earnings season looks different now.",
      points: 75,
      cat: "streaks",
    },
  },
  {
    tier: "platinum",
    sample: {
      id: "centurion_streak",
      title: "Centurion",
      flavor: "One hundred days. The market respects no one who hasn't shown up this many times.",
      points: 200,
      cat: "streaks",
    },
  },
  {
    tier: "mythic",
    sample: {
      id: "full_year",
      title: "Full Year",
      flavor: "A full revolution around the sun. Not a single day missed.",
      points: 500,
      cat: "streaks",
    },
  },
];

export function CelebrationPreview() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-border/50 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-border hover:text-foreground"
      >
        Preview celebration
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 flex flex-col gap-1 rounded-lg border border-border/60 bg-popover/95 p-2 shadow-xl backdrop-blur-xl">
          {SAMPLES.map(({ tier, sample }) => (
            <button
              key={tier}
              type="button"
              onClick={() => {
                previewUnlock({
                  id: sample.id,
                  title: sample.title,
                  description: sample.flavor,
                  flavorText: sample.flavor,
                  tier,
                  points: sample.points,
                  category: sample.cat,
                });
                setOpen(false);
              }}
              className="whitespace-nowrap rounded px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              {tier}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
