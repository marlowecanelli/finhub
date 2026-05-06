"use client";

import { cn } from "@/lib/utils";

type Severity = "info" | "notable" | "significant" | "critical";

const SEVERITY_CONFIG: Record<Severity, { label: string; classes: string; dotColor: string }> = {
  info: {
    label: "INFO",
    classes: "bg-[#1E2130] text-[#717A94] border border-[#2A2F42]",
    dotColor: "#717A94",
  },
  notable: {
    label: "NOTABLE",
    classes: "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30",
    dotColor: "#00D4FF",
  },
  significant: {
    label: "SIGNIFICANT",
    classes: "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30",
    dotColor: "#39FF14",
  },
  critical: {
    label: "HIGH CONVICTION",
    classes: "bg-[#FFB347]/10 text-[#FFB347] border border-[#FFB347]/40 animate-anomaly-pulse",
    dotColor: "#FFB347",
  },
};

interface AnomalyBadgeProps {
  severity: Severity;
  label?: string;
  className?: string;
}

export function AnomalyBadge({ severity, label, className }: AnomalyBadgeProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase font-mono",
        config.classes,
        className
      )}
    >
      <span
        className={cn("inline-block h-1.5 w-1.5 rounded-full flex-shrink-0", {
          "animate-pulse-dot": severity === "critical",
        })}
        style={{ backgroundColor: config.dotColor }}
      />
      {label ?? config.label}
    </span>
  );
}
