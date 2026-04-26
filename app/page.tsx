import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Calculator,
  Check,
  LineChart,
  Newspaper,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";

const FEATURES = [
  { icon: BarChart3, title: "Screener", desc: "Filter the market by cap, sector, fundamentals, and 52W performance." },
  { icon: Briefcase, title: "Portfolio tracker", desc: "Live P/L, sector breakdown, and per-position performance." },
  { icon: Search, title: "Ticker deep-dive", desc: "Fundamentals, news, and a Claude-generated buy/sell signal." },
  { icon: Sparkles, title: "AI portfolio builder", desc: "Answer 7 questions — get a tailored allocation in seconds." },
  { icon: Calculator, title: "Calculators", desc: "Dividend projection, position sizing, and savings goals." },
  { icon: Newspaper, title: "Impact-ranked news", desc: "Breaking & high-impact filtering with AI summaries." },
];

const PRICING_BULLETS = [
  "Unlimited portfolios, holdings, and watchlists",
  "Live quotes via Yahoo Finance",
  "AI buy/sell signals + news summaries",
  "Save unlimited screener presets",
  "Multi-goal savings tracker",
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)] opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />

      <nav className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
            <LineChart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">FinHub</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center md:pt-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-powered research, built into every screen
          </div>
          <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
            Your financial
            <br />
            <span className="bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
              command center.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
            Research stocks, build portfolios, track goals, and stay ahead of the
            market — all in one beautifully-crafted workspace.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="glass">
              <Link href="/dashboard">Explore dashboard</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card · free forever for individuals
          </p>
        </section>

        {/* Feature grid */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Everything you need to invest smarter.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Six modules. One workspace. Built for taste-driven investors.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass glass-hover h-full p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-3xl px-6 pb-24">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Free for individuals.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              No upsell, no card required. Bring your own keys for AI features.
            </p>
          </div>

          <div className="glass relative overflow-hidden p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent"
            />
            <div className="relative">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Free tier
                  </p>
                  <p className="mt-1 font-mono text-5xl font-semibold tracking-tight">
                    $0<span className="text-base text-muted-foreground"> / forever</span>
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href="/sign-up">
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PRICING_BULLETS.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#10b981]" />
                    <span className="text-foreground/90">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-4xl px-6 pb-20 text-center">
          <div className="glass relative overflow-hidden p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent"
            />
            <div className="relative">
              <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/30">
                <Star className="h-3 w-3" /> Built with care
              </div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Stop juggling 6 tabs.
                <br />
                Start with FinHub.
              </h2>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/sign-up">
                    Create free account <TrendingUp className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
