import type { Asset, Liability, Snapshot, Achievement } from "./types";

export const ACHIEVEMENT_DEFS: Record<string, { name: string; emoji: string; description: string }> = {
  first_snapshot: { name: "First Step", emoji: "🌱", description: "Added your first asset" },
  in_the_black: { name: "In the Black", emoji: "📗", description: "Crossed positive net worth" },
  five_figures: { name: "Five Figure Club", emoji: "💵", description: "Hit $10,000 net worth" },
  six_figures: { name: "Six Figure Club", emoji: "💰", description: "Hit $100,000 net worth" },
  quarter_mil: { name: "Quarter Mil", emoji: "🏅", description: "Hit $250,000 net worth" },
  half_mil: { name: "Half Mil", emoji: "🥈", description: "Hit $500,000 net worth" },
  comma_club: { name: "Comma Club", emoji: "🏆", description: "Hit $1,000,000 net worth" },
  debt_slayer: { name: "Debt Slayer", emoji: "⚔️", description: "Paid off a liability completely" },
  debt_free: { name: "Debt Free", emoji: "🕊️", description: "Zero total liabilities" },
  diversified: { name: "Diversified", emoji: "🧩", description: "Holding assets in 5+ categories" },
  year_one: { name: "Year One", emoji: "📅", description: "One year of tracking history" },
  velocity_vault: { name: "Velocity Vault", emoji: "🚀", description: "$1k+/mo velocity for 6 months" },
};

export function checkAchievements(
  netWorth: number,
  assets: Asset[],
  liabilities: Liability[],
  snapshots: Snapshot[],
  already: Achievement[]
): string[] {
  const have = new Set(already.map((a) => a.type));
  const unlocks: string[] = [];

  const push = (k: string) => {
    if (!have.has(k)) unlocks.push(k);
  };

  if (assets.length > 0) push("first_snapshot");
  if (netWorth > 0) push("in_the_black");
  if (netWorth >= 10_000) push("five_figures");
  if (netWorth >= 100_000) push("six_figures");
  if (netWorth >= 250_000) push("quarter_mil");
  if (netWorth >= 500_000) push("half_mil");
  if (netWorth >= 1_000_000) push("comma_club");

  const categories = new Set(assets.filter((a) => !a.archived).map((a) => a.category));
  if (categories.size >= 5) push("diversified");

  const activeLiabs = liabilities.filter((l) => !l.archived);
  if (activeLiabs.length > 0 && activeLiabs.every((l) => l.balance <= 0)) {
    push("debt_slayer");
  }
  if (activeLiabs.length === 0 && liabilities.length > 0) push("debt_free");

  if (snapshots.length > 0) {
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    if (first) {
      const days = Math.round(
        (Date.now() - new Date(first.date).getTime()) / 86400000
      );
      if (days >= 365) push("year_one");
    }
  }

  return unlocks;
}
