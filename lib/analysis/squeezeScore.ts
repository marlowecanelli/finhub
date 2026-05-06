import type { ShortData, SqueezeScoreBreakdown } from "@/lib/types/research";

export function computeSqueezeScore(data: ShortData): {
  score: number;
  breakdown: SqueezeScoreBreakdown;
} {
  // Short % of Float → 30 pts max (linear: 0% = 0, 50%+ = 30)
  const siPctScore = Math.min(30, (data.shortInterestPct / 50) * 30);

  // Days to Cover → 25 pts max (exponential: 1d = 0, 10+ = 25)
  const dtcNormalized = Math.min(1, (data.daysToCover - 1) / 9);
  const daysToCoverScore = Math.max(0, dtcNormalized * dtcNormalized * 25);

  // SI Change Trend → 20 pts (SI increasing last 2 periods = full 20)
  const siTrendScore = data.siChangePct > 0 ? 20 : 0;

  // Borrow Rate → 15 pts (hard to borrow >50% annualized = 15)
  const borrowRateScore = Math.min(15, (data.borrowRate / 50) * 15);

  // Relative Volume → 10 pts (>2× 20d avg = 10)
  const relVol = data.volume20dAvg > 0 ? data.recentVolume / data.volume20dAvg : 1;
  const relativeVolumeScore = relVol >= 2 ? 10 : Math.min(10, (relVol - 1) * 10);

  const total = Math.round(
    siPctScore + daysToCoverScore + siTrendScore + borrowRateScore + relativeVolumeScore
  );

  return {
    score: Math.min(100, Math.max(0, total)),
    breakdown: {
      siPctScore: Math.round(siPctScore * 10) / 10,
      daysToCoverScore: Math.round(daysToCoverScore * 10) / 10,
      siTrendScore,
      borrowRateScore: Math.round(borrowRateScore * 10) / 10,
      relativeVolumeScore: Math.round(relativeVolumeScore * 10) / 10,
      total: Math.min(100, total),
    },
  };
}
