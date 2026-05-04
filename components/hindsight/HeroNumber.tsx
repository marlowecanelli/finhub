"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  /** When the value is negative, count from 0 down to it. */
  countDown?: boolean;
  /** Compact thousands separators */
  format?: "currency" | "percent" | "number";
};

function fmt(n: number, decimals: number, format: Props["format"]): string {
  const abs = Math.abs(n);
  if (format === "percent") {
    return `${n.toFixed(decimals)}%`;
  }
  if (format === "currency") {
    if (abs >= 1_000_000) {
      return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(n);
    }
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(n);
}

export function HeroNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.8,
  className,
  format = "number",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState<number>(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  return (
    <span
      ref={ref}
      className={cn("font-mono tabular-nums", className)}
      aria-label={`${prefix}${fmt(value, decimals, format)}${suffix}`}
    >
      {prefix}
      {fmt(display, decimals, format)}
      {suffix}
    </span>
  );
}
