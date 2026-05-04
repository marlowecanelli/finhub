import Link from "next/link";
import { ArrowRight, Sparkles, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Hindsight · History as teacher",
  description:
    "Two tools. One question: what would have happened? Time Machine for the gain, Stress Test for the pain.",
};

export default function HindsightLandingPage() {
  return (
    <div className="space-y-24">
      {/* Eyebrow + tagline */}
      <div className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/40">
          A Hindsight section by FinHub
        </div>
        <h1
          className="mx-auto mt-5 max-w-3xl font-display text-[clamp(48px,7vw,96px)] leading-[0.95] text-white"
          style={{
            fontVariationSettings: "'opsz' 144, 'soft' 80",
            letterSpacing: "-0.03em",
          }}
        >
          History is the only tutor that <em className="font-display italic">never lies</em>.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-white/55">
          Two tools, one question: what would have happened? See the gain you
          missed. Then see the pain you would have endured to keep it.
        </p>
      </div>

      {/* Split hero */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SplitTile
          mode="gain"
          href="/hindsight/time-machine"
          eyebrow="Time Machine"
          headline="See what you missed."
          body="Pick a ticker, a past date, and an amount. Watch what your money would have grown into."
          cta="Travel back"
        />
        <SplitTile
          mode="pain"
          href="/hindsight/stress-test"
          eyebrow="Stress Test"
          headline="See what you would have endured."
          body="Run your portfolio through 2008, COVID, the dot-com bust. Find out exactly how much it would have hurt, and how long it would have taken to recover."
          cta="Live the crisis"
        />
      </div>

      {/* Editorial intro */}
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/40">
          The philosophy
        </div>
        <p className="font-serif text-2xl italic leading-relaxed text-white/85">
          Hindsight is a teacher, not a regret machine.
        </p>
        <div className="space-y-4 text-base leading-relaxed text-white/65">
          <p>
            Most people use the past to torture themselves. We are building it
            into something more useful: a tool to test the conviction behind
            today&apos;s decisions. Could you have lived through 2008 with this
            allocation? Would you have sold at the bottom in March 2020? Would
            you have stayed in the trade long enough for it to mean something?
          </p>
          <p>
            The Time Machine shows you what compounding does over decades, not
            quarters. The Stress Test shows you what panic feels like, in
            advance. Both flow from the same data. Both point at the same
            lesson, from opposite directions.
          </p>
        </div>
      </div>
    </div>
  );
}

function SplitTile({
  mode,
  href,
  eyebrow,
  headline,
  body,
  cta,
}: {
  mode: "gain" | "pain";
  href: string;
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
}) {
  const isGain = mode === "gain";
  const accentText = isGain ? "text-hindsight-gain" : "text-hindsight-pain";
  const Icon = isGain ? Sparkles : ShieldAlert;
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-3xl border border-white/5 p-10 transition-all duration-700 hover:border-white/15`}
      style={{
        background: isGain
          ? "radial-gradient(ellipse 120% 90% at 30% 0%, rgba(200,168,90,0.18) 0%, rgba(122,154,74,0.04) 50%, transparent 80%), linear-gradient(180deg, #0e1119 0%, #080a10 100%)"
          : "radial-gradient(ellipse 120% 90% at 70% 0%, rgba(168,50,74,0.20) 0%, rgba(122,31,48,0.04) 50%, transparent 80%), linear-gradient(180deg, #0e1119 0%, #080a10 100%)",
      }}
    >
      {/* Soft glow that brightens on hover */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100`}
        style={{
          boxShadow: isGain
            ? "inset 0 0 80px 0 rgba(200,168,90,0.15)"
            : "inset 0 0 80px 0 rgba(168,50,74,0.18)",
        }}
      />

      <div className="relative">
        <div
          className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] ${accentText}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h2
          className="mt-6 font-display text-5xl leading-[1.02] text-white sm:text-6xl"
          style={{
            fontVariationSettings: isGain
              ? "'opsz' 144, 'soft' 100"
              : "'opsz' 24, 'soft' 0",
            letterSpacing: "-0.02em",
          }}
        >
          {headline}
        </h2>
        <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
          {body}
        </p>
      </div>

      <div className="relative mt-10 flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-white/70 transition-all group-hover:gap-4">
        <span className={accentText}>{cta}</span>
        <ArrowRight
          className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${accentText}`}
        />
      </div>
    </Link>
  );
}
