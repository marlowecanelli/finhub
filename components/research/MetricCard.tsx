"use client";

import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useState } from "react";

interface SparklinePoint {
  value: number;
}

interface MetricCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  yoyDelta?: number;
  status?: "AT_TARGET" | "ABOVE_TARGET" | "BELOW_TARGET" | "RECESSION_RISK";
  statusColor?: string;
  sparklineData?: SparklinePoint[];
  description?: string;
  sourceLabel?: string;
  className?: string;
  loading?: boolean;
  accentColor?: string;
}

const STATUS_CONFIG = {
  AT_TARGET:       { label: "AT TARGET",       color: "#00C896" },
  ABOVE_TARGET:    { label: "ABOVE TARGET",     color: "#FFB347" },
  BELOW_TARGET:    { label: "BELOW TARGET",     color: "#00D4FF" },
  RECESSION_RISK:  { label: "RECESSION RISK",   color: "#FF4545" },
};

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel = "MoM",
  yoyDelta,
  status,
  sparklineData,
  description,
  sourceLabel,
  className,
  loading = false,
  accentColor = "#00D4FF",
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (loading) {
    return (
      <div className={cn("rounded-lg p-4", className)} style={{ background: "#141720", border: "1px solid #1E2130" }}>
        <div className="research-shimmer h-3 w-24 rounded mb-3" />
        <div className="research-shimmer h-8 w-32 rounded mb-2" />
        <div className="research-shimmer h-3 w-full rounded mt-4" />
      </div>
    );
  }

  const statusConf = status ? STATUS_CONFIG[status] : null;

  function DeltaBadge({ value, label }: { value: number; label: string }) {
    const positive = value > 0;
    const zero = value === 0;
    const color = zero ? "#717A94" : positive ? "#00C896" : "#FF5252";
    const Icon = zero ? Minus : positive ? TrendingUp : TrendingDown;
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-mono" style={{ color }}>
        <Icon size={10} />
        {positive ? "+" : ""}{value.toFixed(2)}% <span className="text-[#717A94]">{label}</span>
      </span>
    );
  }

  return (
    <div
      className={cn("rounded-lg p-4 flex flex-col gap-2 animate-data-rise", className)}
      style={{ background: "#141720", border: "1px solid #1E2130" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#717A94]">{label}</span>
        {description && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-[#3A3F52] hover:text-[#717A94] transition-colors"
            >
              <Info size={12} />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-5 z-50 w-56 rounded-md p-2.5 text-[11px] text-[#C8D0E7] shadow-2xl"
                   style={{ background: "#0D0F14", border: "1px solid #1E2130" }}>
                {description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="font-mono text-3xl font-bold tracking-tight" style={{ color: accentColor }}>
        {value}
      </div>

      {/* Deltas */}
      <div className="flex items-center gap-3 flex-wrap">
        {delta !== undefined && <DeltaBadge value={delta} label={deltaLabel} />}
        {yoyDelta !== undefined && <DeltaBadge value={yoyDelta} label="YoY" />}
      </div>

      {/* Status */}
      {statusConf && (
        <span
          className="inline-flex items-center gap-1.5 self-start rounded-sm px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase font-mono"
          style={{
            background: `${statusConf.color}15`,
            color: statusConf.color,
            border: `1px solid ${statusConf.color}30`,
          }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: statusConf.color }} />
          {statusConf.label}
        </span>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="h-12 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={accentColor}
                strokeWidth={1.5}
                fill={`url(#grad-${label})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Source */}
      {sourceLabel && (
        <span className="text-[10px] text-[#3A3F52] mt-auto">Source: {sourceLabel}</span>
      )}
    </div>
  );
}
