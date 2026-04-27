import Link from "next/link";
import { ArrowUpRight, Briefcase, Search, Target, type LucideIcon } from "lucide-react";

const ACTIONS: { label: string; href: string; icon: LucideIcon; desc: string; n: string }[] = [
  {
    n: "i.",
    label: "Research a stock",
    href: "/ticker-lookup",
    icon: Search,
    desc: "Look up any ticker in seconds.",
  },
  {
    n: "ii.",
    label: "Build a portfolio",
    href: "/builder",
    icon: Briefcase,
    desc: "Model allocations with live data.",
  },
  {
    n: "iii.",
    label: "Track a goal",
    href: "/calculators",
    icon: Target,
    desc: "Project retirement, FIRE, and more.",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/80 bg-border/60 sm:grid-cols-3">
      {ACTIONS.map(({ label, href, icon: Icon, desc, n }) => (
        <Link
          key={label}
          href={href}
          className="group relative bg-card/40 p-6 backdrop-blur-xl transition-colors duration-500 hover:bg-card"
        >
          <div className="flex items-center justify-between">
            <span className="font-serif text-sm italic text-muted-foreground">
              {n}
            </span>
            <Icon className="h-3.5 w-3.5 text-foreground/40 transition-colors group-hover:text-[hsl(var(--signal))]" />
          </div>

          <p className="mt-6 font-display text-xl font-medium tracking-tight">
            {label}
          </p>
          <p className="mt-1 text-xs text-foreground/55">{desc}</p>

          <div className="mt-5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60 transition-colors group-hover:text-[hsl(var(--signal))]">
            Open <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}
