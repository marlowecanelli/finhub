import Link from "next/link";
import { ArrowRight, Briefcase, Search, Target, type LucideIcon } from "lucide-react";

const ACTIONS: { label: string; href: string; icon: LucideIcon; desc: string }[] = [
  {
    label: "Research a Stock",
    href: "/ticker-lookup",
    icon: Search,
    desc: "Look up any ticker in seconds.",
  },
  {
    label: "Build a Portfolio",
    href: "/builder",
    icon: Briefcase,
    desc: "Model allocations with live data.",
  },
  {
    label: "Track a Goal",
    href: "/calculators",
    icon: Target,
    desc: "Project retirement, FIRE, and more.",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {ACTIONS.map(({ label, href, icon: Icon, desc }) => (
        <Link
          key={label}
          href={href}
          className="glass glass-hover group flex items-center gap-4 p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="truncate text-xs text-muted-foreground">{desc}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
        </Link>
      ))}
    </div>
  );
}
