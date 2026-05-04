import { TimeMachineClient } from "@/components/hindsight/TimeMachineClient";

export const metadata = {
  title: "Time Machine · Hindsight",
  description:
    "Pick a ticker, a past date, and an amount. See what your money would have grown into.",
};

type Search = { searchParams: { ticker?: string } };

export default function TimeMachinePage({ searchParams }: Search) {
  return (
    <div className="space-y-12">
      <header className="max-w-2xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-hindsight-gain/80">
          Time Machine
        </div>
        <h1
          className="mt-3 font-display text-5xl leading-[1.02] text-white sm:text-6xl"
          style={{
            fontVariationSettings: "'opsz' 144, 'soft' 100",
            letterSpacing: "-0.025em",
          }}
        >
          See what you missed.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-white/60">
          The math compounding does in twenty years is the only argument that
          ever wins. Pick a ticker, a date, an amount.
        </p>
      </header>

      <TimeMachineClient initialTicker={searchParams.ticker} />
    </div>
  );
}
