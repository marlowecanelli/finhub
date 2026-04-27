import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Calculator,
  Check,
  Newspaper,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";
import { MarqueeTicker } from "@/components/marquee-ticker";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Screener",
    desc: "Filter the market by cap, sector, fundamentals, and 52W performance. Save unlimited presets.",
    label: "01",
  },
  {
    icon: Briefcase,
    title: "Portfolio",
    desc: "Live P/L, sector breakdown, and per-position performance — recalculated by the second.",
    label: "02",
  },
  {
    icon: Search,
    title: "Deep-dive",
    desc: "Fundamentals, charts, news, and a Claude-generated buy/sell signal for any ticker.",
    label: "03",
  },
  {
    icon: Sparkles,
    title: "AI builder",
    desc: "Answer seven questions. Get a tailored allocation in seconds — diversified, explained, ready.",
    label: "04",
  },
  {
    icon: Calculator,
    title: "Calculators",
    desc: "Dividend projections, position sizing, and savings goals. The math, removed from your hands.",
    label: "05",
  },
  {
    icon: Newspaper,
    title: "News, ranked",
    desc: "Breaking + high-impact filtering with single-line AI summaries. The signal, not the noise.",
    label: "06",
  },
];

const BULLETS = [
  "Unlimited portfolios, holdings, watchlists",
  "Live quotes via Yahoo Finance",
  "AI buy/sell signals + news summaries",
  "Save unlimited screener presets",
  "Multi-goal savings tracker",
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Atmospheric background layers */}
      <div className="bg-aurora pointer-events-none fixed inset-0" aria-hidden />
      <div
        className="bg-dotgrid pointer-events-none fixed inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] opacity-60"
        aria-hidden
      />
      <div
        className="bg-radial-fade pointer-events-none fixed inset-x-0 top-0 h-[60vh]"
        aria-hidden
      />

      {/* Marquee ticker */}
      <div className="relative z-10">
        <MarqueeTicker />
      </div>

      {/* Top nav */}
      <nav className="relative z-20 mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 md:px-10">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
            <span className="font-display text-base font-semibold leading-none">F</span>
            <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))] animate-[signal-pulse_2.4s_ease-in-out_infinite]" />
          </div>
          <span className="font-display text-lg font-medium tracking-tight">
            FinHub
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="sweep">
            <Link href="/sign-up" className="flex items-center gap-1">
              Get started <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* ─── HERO ─── */}
        <section className="relative mx-auto max-w-[1400px] px-6 pt-16 pb-32 md:px-10 md:pt-28 md:pb-40">
          <div className="grid grid-cols-12 gap-y-10">
            {/* Eyebrow + edition slug — top-left, editorial slug */}
            <div className="col-span-12 lg:col-span-3">
              <div className="rise-in" style={{ animationDelay: "100ms" }}>
                <p className="editorial-eyebrow text-muted-foreground">
                  Vol. 1 · Issue 01
                </p>
                <div className="mt-3 h-px w-12 bg-foreground/40" />
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Released today<br />for considered investors
                </p>
              </div>
            </div>

            {/* Massive editorial display headline */}
            <div className="col-span-12 lg:col-span-9">
              <h1 className="display-italic blur-in text-[clamp(3rem,12vw,11rem)] text-foreground">
                A terminal{" "}
                <span className="font-sans not-italic font-light text-foreground/55 text-[0.62em] tracking-tight align-baseline">
                  for the rest of us.
                </span>
              </h1>

              <div className="mt-10 grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-7 lg:col-span-6 lg:col-start-1">
                  <p
                    className="rise-in max-w-md text-balance text-base leading-relaxed text-foreground/75 md:text-lg"
                    style={{ animationDelay: "320ms" }}
                  >
                    Research equities, build portfolios, track goals, and read
                    the market — refined into a single workspace that respects
                    your attention.
                  </p>
                  <div
                    className="rise-in mt-8 flex flex-wrap items-center gap-3"
                    style={{ animationDelay: "440ms" }}
                  >
                    <Button asChild size="lg" className="sweep h-12 px-6 text-sm">
                      <Link href="/sign-up" className="flex items-center gap-2">
                        Open your terminal
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="ghost"
                      className="h-12 px-6 text-sm text-foreground/80 hover:text-foreground"
                    >
                      <Link href="/dashboard">Take a tour →</Link>
                    </Button>
                  </div>
                  <p
                    className="rise-in mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                    style={{ animationDelay: "560ms" }}
                  >
                    Free forever for individuals · No card required
                  </p>
                </div>

                {/* Drop-cap quote / pull-out — right column */}
                <div
                  className="rise-in col-span-12 md:col-span-5 lg:col-span-4 lg:col-start-9"
                  style={{ animationDelay: "640ms" }}
                >
                  <div className="border-l border-foreground/30 pl-5">
                    <p className="font-serif text-xl italic leading-snug text-foreground/85">
                      “The market is a story.<br />
                      We just gave you the index.”
                    </p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      — Field notes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div
            className="rise-in mt-24 grid grid-cols-2 gap-6 border-t border-border/60 pt-10 md:grid-cols-4"
            style={{ animationDelay: "780ms" }}
          >
            {[
              { k: "Tickers covered", v: "9,400+" },
              { k: "Refresh latency", v: "<60s" },
              { k: "AI signals/day", v: "∞" },
              { k: "Card required", v: "No" },
            ].map((s) => (
              <div key={s.k}>
                <p className="font-display text-3xl font-medium md:text-4xl">{s.v}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {s.k}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── EDITORIAL SECTION HEAD ─── */}
        <section className="relative border-t border-border/60">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <div className="grid grid-cols-12 gap-6 py-10">
              <div className="col-span-12 md:col-span-3">
                <p className="editorial-eyebrow text-muted-foreground">
                  Section Two
                </p>
              </div>
              <div className="col-span-12 md:col-span-9">
                <h2 className="font-display text-3xl font-medium tracking-tight md:text-5xl">
                  Six modules.<br />
                  <span className="display-italic text-foreground/70">
                    One workspace.
                  </span>
                </h2>
                <p className="mt-4 max-w-xl text-foreground/70">
                  Every screen is its own front page — the data laid out the way
                  a designer would lay out a spread.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURE GRID ─── */}
        <section className="relative">
          <div className="mx-auto max-w-[1400px] px-6 pb-32 md:px-10">
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, desc, label }, i) => (
                <article
                  key={title}
                  className="group relative overflow-hidden bg-background p-8 transition-colors duration-500 hover:bg-card"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {label}
                    </span>
                    <Icon className="h-4 w-4 text-foreground/40 transition-colors group-hover:text-[hsl(var(--signal))]" />
                  </div>

                  <h3 className="mt-10 font-display text-3xl font-medium tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/70">
                    {desc}
                  </p>

                  <div className="mt-8 flex h-px w-full overflow-hidden bg-border/0 transition-all duration-500 group-hover:bg-[hsl(var(--signal))]" />

                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[hsl(var(--signal))/0.06] opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING / EDITORIAL CARD ─── */}
        <section className="relative border-t border-border/60">
          <div className="mx-auto max-w-[1400px] px-6 pb-32 pt-20 md:px-10">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-4">
                <p className="editorial-eyebrow text-muted-foreground">
                  Pricing — Section Three
                </p>
                <h2 className="mt-3 font-display text-4xl font-medium md:text-6xl">
                  Free for{" "}
                  <span className="display-italic text-foreground/70">
                    individuals.
                  </span>
                </h2>
                <p className="mt-6 max-w-md text-foreground/70">
                  No upsell, no card required. Bring your own keys for AI
                  features. Designed to be the last finance app you sign up for.
                </p>
              </div>

              <div className="col-span-12 md:col-span-8">
                <div className="card-edge relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-10 backdrop-blur-xl">
                  <div className="absolute inset-0 bg-aurora opacity-40" aria-hidden />
                  <div className="relative">
                    <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border/60 pb-8">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--signal))]">
                          Free tier
                        </p>
                        <p className="mt-2 font-display text-7xl font-medium leading-none">
                          $0
                          <span className="font-mono text-base font-normal text-muted-foreground">
                            {" "}/ forever
                          </span>
                        </p>
                      </div>
                      <Button asChild size="lg" className="sweep h-12 px-6">
                        <Link
                          href="/sign-up"
                          className="flex items-center gap-2"
                        >
                          Open your terminal
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {BULLETS.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-3 text-sm text-foreground/85"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--signal))]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CLOSING SPREAD ─── */}
        <section className="relative border-t border-border/60">
          <div className="mx-auto max-w-[1400px] px-6 py-32 md:px-10 md:py-44">
            <div className="text-center">
              <p className="editorial-eyebrow text-muted-foreground">
                The last page
              </p>
              <h2 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-medium tracking-tight md:text-8xl">
                Stop juggling{" "}
                <span className="display-italic text-foreground/70">
                  six tabs.
                </span>
                <br />
                Read the market{" "}
                <span className="display-italic text-foreground/70">
                  like a paper.
                </span>
              </h2>

              <div className="mt-12 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="sweep h-14 px-8">
                  <Link href="/sign-up" className="flex items-center gap-2 text-base">
                    Create your free account
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Built with care · No card required
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
