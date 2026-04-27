import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "card-edge group relative overflow-hidden rounded-xl border border-border/80 bg-card/40 p-10 backdrop-blur-xl lift",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[hsl(var(--signal))] opacity-0 blur-[100px] transition-opacity duration-700 group-hover:opacity-[0.06]"
      />

      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Section
          </span>
          <Icon className="h-4 w-4 text-foreground/40 transition-colors group-hover:text-[hsl(var(--signal))]" />
        </div>

        <h3 className="font-display text-3xl font-medium tracking-tight">
          {title}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/65">
          {description}
        </p>

        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="mt-6 inline-flex items-center gap-2 border-b border-foreground/30 pb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:border-[hsl(var(--signal))] hover:text-[hsl(var(--signal))]"
          >
            {ctaLabel}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
