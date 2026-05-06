import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DisclaimerFooter } from "@/components/hindsight/DisclaimerFooter";

export const metadata = {
  title: "Hindsight",
  description:
    "History as teacher. See what you missed, see what you would have endured.",
};

export default function HindsightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-hindsight-canvas text-white">
      {/* Subtle film-grain on top of the dark canvas — already provided by .grain on body, but we add a soft radial here for ambient warmth/coolness  */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 120% 80% at 50% -10%, rgba(200,168,90,0.07), transparent 60%), radial-gradient(ellipse 120% 80% at 50% 110%, rgba(168,50,74,0.06), transparent 60%)",
        }}
      />

      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            FinHub
          </Link>
          <Link
            href="/hindsight"
            className="font-display text-xl tracking-tight text-white"
            style={{ fontVariationSettings: "'opsz' 24" }}
          >
            Hindsight
          </Link>
          <nav className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-widest text-white/50">
            <Link
              href="/hindsight/time-machine"
              className="transition-colors hover:text-hindsight-gain"
            >
              Time Machine
            </Link>
            <Link
              href="/hindsight/stress-test"
              className="transition-colors hover:text-hindsight-pain"
            >
              Stress Test
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-12">
        {children}
      </main>

      <div className="relative z-10">
        <DisclaimerFooter />
      </div>
    </div>
  );
}
