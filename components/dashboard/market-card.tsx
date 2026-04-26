import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn, formatPercent } from "@/lib/utils";

type Props = {
  label: string;
  symbol: string;
  value: string;
  changePct: number;
  icon: LucideIcon;
  accent: string;
};

export function MarketCard({
  label,
  symbol,
  value,
  changePct,
  icon: Icon,
  accent,
}: Props) {
  const up = changePct >= 0;
  return (
    <div className="glass glass-hover group p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground/80">{symbol}</p>
        </div>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset",
            accent
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="font-mono text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-xs font-medium",
            up
              ? "bg-[hsl(var(--primary)/0.0)] text-[#10b981]"
              : "text-[#ef4444]"
          )}
        >
          {up ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {formatPercent(changePct)}
        </span>
      </div>
      <div className="mt-4 h-10 w-full overflow-hidden rounded-md">
        <Sparkline up={up} />
      </div>
    </div>
  );
}

function Sparkline({ up }: { up: boolean }) {
  const d = up
    ? "M0 30 Q 20 20, 35 22 T 70 12 T 110 8 T 160 4"
    : "M0 8 Q 20 18, 35 16 T 70 26 T 110 30 T 160 34";
  const color = up ? "#10b981" : "#ef4444";
  return (
    <svg
      viewBox="0 0 160 40"
      preserveAspectRatio="none"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={`spark-${up ? "u" : "d"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L160 40 L0 40 Z`} fill={`url(#spark-${up ? "u" : "d"})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
