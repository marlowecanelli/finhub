"use client";

import { Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecessionPeriod } from "@/lib/types/research";

interface ResearchChartProps {
  title?: string;
  description?: string;
  sourceLabel?: string;
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  height?: number;
  onDownloadCSV?: () => void;
  children?: React.ReactNode;
  recessionPeriods?: RecessionPeriod[];
}

export function ResearchChart({
  title,
  description,
  sourceLabel,
  loading = false,
  error,
  empty = false,
  emptyMessage = "No data available",
  className,
  height = 240,
  onDownloadCSV,
  children,
}: ResearchChartProps) {
  if (loading) {
    return (
      <div className={cn("rounded-lg p-4", className)} style={{ background: "#141720", border: "1px solid #1E2130" }}>
        {title && <div className="research-shimmer h-4 w-36 rounded mb-4" />}
        <div className="research-shimmer rounded" style={{ height }} />
        {sourceLabel && <div className="research-shimmer h-3 w-24 rounded mt-2" />}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn("rounded-lg p-6 flex flex-col items-center justify-center gap-3", className)}
        style={{ background: "#141720", border: "1px solid #FF454530", height: height + 80 }}
      >
        <span className="text-[#FF4545] text-sm font-mono">⚠ Error loading data</span>
        <span className="text-[#717A94] text-xs text-center max-w-xs">{error}</span>
      </div>
    );
  }

  if (empty) {
    return (
      <div
        className={cn("rounded-lg p-6 flex flex-col items-center justify-center gap-3", className)}
        style={{ background: "#141720", border: "1px solid #1E2130", height: height + 80 }}
      >
        <span className="text-[#3A3F52] text-4xl">◌</span>
        <span className="text-[#717A94] text-sm">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-lg p-4 flex flex-col gap-3", className)}
      style={{ background: "#141720", border: "1px solid #1E2130" }}
    >
      {(title || onDownloadCSV) && (
        <div className="flex items-start justify-between gap-2">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-[#C8D0E7]">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-[#717A94] mt-0.5">{description}</p>
            )}
          </div>
          {onDownloadCSV && (
            <button
              onClick={onDownloadCSV}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-[#717A94] hover:text-[#C8D0E7] hover:bg-[#1E2130] transition-all font-mono"
            >
              <Download size={11} />
              CSV
            </button>
          )}
        </div>
      )}

      {/* Chart area — accessible */}
      <figure
        role="img"
        aria-label={title ?? "Research chart"}
        style={{ height }}
        className="relative"
      >
        <title>{title ?? "Research chart"}</title>
        {description && <desc>{description}</desc>}
        {children}
      </figure>

      {sourceLabel && (
        <div className="flex items-center gap-1.5 text-[10px] text-[#3A3F52]">
          <FileText size={10} />
          Source: {sourceLabel}
        </div>
      )}
    </div>
  );
}
