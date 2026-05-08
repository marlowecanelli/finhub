/**
 * XP -> level mapping. Thresholds are cumulative XP required to *be* at level.
 */

export type LevelDef = { level: number; minXp: number; title: string };

export const LEVELS: ReadonlyArray<LevelDef> = [
  { level: 1, minXp: 0, title: "Trader-in-Training" },
  { level: 2, minXp: 100, title: "Apprentice" },
  { level: 3, minXp: 300, title: "Analyst" },
  { level: 4, minXp: 750, title: "Strategist" },
  { level: 5, minXp: 1500, title: "Portfolio Manager" },
  { level: 6, minXp: 3000, title: "Veteran" },
  { level: 7, minXp: 6000, title: "Master of the Tape" },
  { level: 8, minXp: 10000, title: "Oracle" },
  { level: 9, minXp: 20000, title: "Legend" },
] as const;

export function levelFromXp(xp: number): LevelDef {
  let current = LEVELS[0]!;
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
    else break;
  }
  return current;
}

export function nextLevel(xp: number): LevelDef | null {
  const current = levelFromXp(xp);
  return LEVELS.find((l) => l.level === current.level + 1) ?? null;
}

export function progressToNext(xp: number): { current: LevelDef; next: LevelDef | null; pct: number } {
  const current = levelFromXp(xp);
  const next = nextLevel(xp);
  if (!next) return { current, next: null, pct: 1 };
  const span = next.minXp - current.minXp;
  const into = xp - current.minXp;
  return { current, next, pct: span > 0 ? Math.min(1, into / span) : 0 };
}
