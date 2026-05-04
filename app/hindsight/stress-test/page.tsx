import { StressTestClient } from "@/components/hindsight/StressTestClient";

export const metadata = {
  title: "Stress Test · Hindsight",
  description:
    "Run your portfolio through past crises. See exactly how much you would have lost and how long recovery took.",
};

type Search = { searchParams: { ticker?: string } };

export default function StressTestPage({ searchParams }: Search) {
  return (
    <div className="space-y-12">
      <header className="max-w-2xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-hindsight-pain/80">
          Stress Test
        </div>
        <h1
          className="mt-3 font-display text-5xl leading-[1.02] text-white sm:text-6xl"
          style={{
            fontVariationSettings: "'opsz' 24, 'soft' 0",
            letterSpacing: "-0.02em",
          }}
        >
          See what you would have endured.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-white/60">
          History had moments where the only winning move was not to flinch.
          Run your portfolio through them. Find out who you would have been.
        </p>
      </header>

      <StressTestClient initialTicker={searchParams.ticker} />
    </div>
  );
}
