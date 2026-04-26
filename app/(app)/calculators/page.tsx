import Link from "next/link";
import { ArrowRight, Coins, Ruler, Target } from "lucide-react";

const CALCULATORS = [
  {
    href: "/calculators/dividend",
    title: "Dividend calculator",
    description:
      "Project portfolio value, total dividends, and reinvestment impact over time.",
    icon: Coins,
    accent: "from-[#10b981]/30 to-transparent text-[#10b981] ring-[#10b981]/30",
  },
  {
    href: "/calculators/position-size",
    title: "Position size",
    description:
      "Calculate share quantity from account size, stop loss, and risk per trade.",
    icon: Ruler,
    accent: "from-primary/30 to-transparent text-primary ring-primary/30",
  },
  {
    href: "/calculators/savings-goals",
    title: "Savings goals",
    description:
      "Track multi-goal progress with required monthly contributions and projected completion.",
    icon: Target,
    accent: "from-amber-500/30 to-transparent text-amber-500 ring-amber-500/30",
  },
] as const;

export default function CalculatorsIndex() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Calculators
        </p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Plan, size, and project — fast.
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CALCULATORS.map(({ href, title, description, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="glass glass-hover group relative flex h-full flex-col overflow-hidden p-5"
          >
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.split(" ")[0]} ${accent.split(" ")[1]}`}
            />
            <div className="relative flex flex-1 flex-col">
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${accent.split(" ").slice(2).join(" ")} bg-background/50`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">{title}</h2>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground/80 transition-transform group-hover:translate-x-0.5">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
