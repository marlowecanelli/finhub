import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  symbol: string;
  value: string;
  changePct: number;
  icon: LucideIcon;
  accent: string;
  href?: string;
};

export function MarketCard({
  label,
  symbol,
  value,
  changePct,
  icon: Icon,
  href,
}: Props) {
  const up = changePct >= 0;
  const colorVar = up ? "hsl(var(--signal))" : "hsl(348 95% 65%)";

  const inner = (
    <div className={cn("card-edge group relative overflow-hidden rounded-xl border border-border/80 bg-card/40 p-6 backdrop-blur-xl lift", href && "cursor-pointer")}>
      {/* Hover glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
        style={{ background: colorVar }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 font-mono text-[11px] text-foreground/55">
              {symbol}
            </p>
          </div>
          <Icon className="h-3.5 w-3.5 text-foreground/30 transition-colors group-hover:text-foreground/70" />
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <p className="font-display text-3xl font-medium tracking-tight tabular-nums md:text-4xl">
            {value}
          </p>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 font-mono text-xs tabular-nums"
            )}
            style={{ color: colorVar }}
          >
            {up ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
          </span>
        </div>

        <div className="mt-5 h-12 w-full overflow-hidden">
          <Sparkline up={up} color={colorVar} />
        </div>

        <div
          className="mt-3 h-px w-full origin-left scale-x-0 transition-transform duration-700 group-hover:scale-x-100"
          style={{ background: colorVar }}
        />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {inner}
      </Link>
    );
  }
  return inner;
}

function Sparkline({ up, color }: { up: boolean; color: string }) {
  const d = up
    ? "M0 32 C 20 28, 30 24, 50 22 S 80 18, 100 12 S 130 6, 160 4"
    : "M0 6 C 20 10, 30 14, 50 16 S 80 22, 100 28 S 130 32, 160 36";
  const id = up ? "u" : "d";
  return (
    <svg
      viewBox="0 0 160 40"
      preserveAspectRatio="none"
      className="h-full w-full overflow-visible"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L160 40 L0 40 Z`} fill={`url(#spark-${id})`} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 6px ${color}aa)`,
        }}
      />
    </svg>
  );
}
