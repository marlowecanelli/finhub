"use client";

import { useState } from "react";
import { ExternalLink, Maximize2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import type { MacroSeries, RecessionPeriod } from "@/lib/types/research";

interface MacroWidgetProps {
  series: MacroSeries;
  onExpand?: (series: MacroSeries) => void;
}

const STATUS_CONFIG = {
  AT_TARGET:      { label: "AT TARGET",      color: "#00C896" },
  ABOVE_TARGET:   { label: "ABOVE TARGET",   color: "#FFB347" },
  BELOW_TARGET:   { label: "BELOW TARGET",   color: "#00D4FF" },
  RECESSION_RISK: { label: "RECESSION RISK", color: "#FF4545" },
};

const SERIES_COLORS: Partial<Record<string, string>> = {
  CPIAUCSL: "#FFB347",
  PCEPI:    "#FF8C42",
  UNRATE:   "#00D4FF",
  FEDFUNDS: "#39FF14",
  T10Y2Y:   "#FF4545",
  M2SL:     "#A78BFA",
  A191RL1Q225SBEA: "#00C896",
  UMCSENT:  "#F472B6",
  ICSA:     "#FFB347",
  INDPRO:   "#60A5FA",
  HOUST:    "#34D399",
  RETAILSM44X72USS: "#FBBF24",
};

function formatValue(series: MacroSeries): string {
  const v = series.currentValue;
  if (series.formatSuffix === "%") return `${v.toFixed(1)}%`;
  if (series.id === "M2SL") return `$${(v / 1000).toFixed(1)}T`;
  if (series.id === "ICSA") return `${v.toFixed(0)}K`;
  if (series.id === "HOUST" || series.id === "PERMIT") return `${v.toFixed(0)}K`;
  if (series.id === "RETAILSM44X72USS") return `$${(v / 1000).toFixed(0)}B`;
  if (v > 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v.toFixed(1);
}

export function MacroWidget({ series, onExpand }: MacroWidgetProps) {
  const [hovered, setHovered] = useState(false);
  const sc = STATUS_CONFIG[series.status];
  const color = SERIES_COLORS[series.id] ?? "#00D4FF";

  const sparkData = series.observations.slice(-24).map(o => ({
    date: o.date,
    value: o.value,
  }));

  return (
    <div
      className={cn(
        "rounded-lg p-4 flex flex-col gap-3 transition-all duration-300 cursor-default",
        "hover:border-[#2A2F42]"
      )}
      style={{ background: "#141720", border: "1px solid #1E2130" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] truncate">
              {series.shortTitle}
            </span>
            <a
              href={series.fredUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3A3F52] hover:text-[#717A94] transition-colors flex-shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={9} />
            </a>
          </div>
          <span className="text-[9px] text-[#3A3F52] font-mono">
            Updated {series.lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        {onExpand && (
          <button
            onClick={() => onExpand(series)}
            className={cn(
              "text-[#3A3F52] hover:text-[#717A94] transition-all p-0.5",
              hovered ? "opacity-100" : "opacity-0"
            )}
          >
            <Maximize2 size={12} />
          </button>
        )}
      </div>

      {/* Value */}
      <div>
        <div className="text-3xl font-mono font-bold tracking-tight" style={{ color }}>
          {formatValue(series)}
        </div>

        {/* Deltas */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {[
            { val: series.momChange, label: "MoM" },
            { val: series.yoyChange, label: "YoY" },
          ].map(({ val, label }) => (
            <span key={label} className="text-[11px] font-mono flex items-center gap-0.5">
              <span style={{ color: val >= 0 ? "#00C896" : "#FF5252" }}>
                {val >= 0 ? "+" : ""}{val.toFixed(2)}{series.formatSuffix}
              </span>
              <span className="text-[#3A3F52]"> {label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Status badge */}
      <span
        className="inline-flex items-center gap-1.5 self-start rounded-sm px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase font-mono"
        style={{
          background: `${sc.color}15`,
          color: sc.color,
          border: `1px solid ${sc.color}30`,
        }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: sc.color }} />
        {sc.label}
      </span>

      {/* Sparkline */}
      <div className="h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`macroGrad-${series.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ background: "#0D0F14", border: "1px solid #1E2130", borderRadius: 4, fontSize: 10 }}
              itemStyle={{ color }}
              labelStyle={{ color: "#717A94", fontSize: 9 }}
              formatter={(v: number) => [v.toFixed(series.id === "ICSA" ? 0 : 2), series.shortTitle]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#macroGrad-${series.id})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Target */}
      {series.target !== undefined && series.targetLabel && (
        <div className="text-[10px] text-[#3A3F52] font-mono border-t pt-2" style={{ borderColor: "#1E2130" }}>
          Target: {series.target}{series.formatSuffix} — {series.targetLabel}
        </div>
      )}
    </div>
  );
}
