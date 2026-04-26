"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

type Props = {
  value: number | null | undefined;
  format?: (n: number) => string;
  decimals?: number;
  duration?: number;
  fallback?: string;
  className?: string;
};

export function AnimatedNumber({
  value,
  format,
  decimals = 2,
  duration = 900,
  fallback = "—",
  className,
}: Props) {
  const animated = useCountUp(value, { decimals, duration });
  if (value == null || !Number.isFinite(value)) {
    return <span className={cn("font-mono", className)}>{fallback}</span>;
  }
  const text = format ? format(animated) : animated.toFixed(decimals);
  return <span className={cn("font-mono tabular-nums", className)}>{text}</span>;
}
