"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFetchedAt } from "@/lib/cache";

interface DataFreshnessIndicatorProps {
  cacheKey: string;
  onRefresh?: () => void;
  className?: string;
}

function getStatus(fetchedAt: Date | null): "fresh" | "stale" | "very-stale" | "unknown" {
  if (!fetchedAt) return "unknown";
  const ageMs = Date.now() - fetchedAt.getTime();
  if (ageMs < 15 * 60 * 1000) return "fresh";
  if (ageMs < 60 * 60 * 1000) return "stale";
  return "very-stale";
}

function formatAge(fetchedAt: Date | null): string {
  if (!fetchedAt) return "Never";
  const ageMs = Date.now() - fetchedAt.getTime();
  const ageMins = Math.floor(ageMs / 60000);
  if (ageMins < 1) return "Just now";
  if (ageMins < 60) return `${ageMins}m ago`;
  const ageHours = Math.floor(ageMins / 60);
  return `${ageHours}h ago`;
}

const STATUS_STYLES = {
  fresh: { dot: "bg-[#39FF14]", text: "text-[#39FF14]/70", label: "LIVE" },
  stale: { dot: "bg-[#FFB347]", text: "text-[#FFB347]/70", label: "STALE" },
  "very-stale": { dot: "bg-[#FF4545]", text: "text-[#FF4545]/70", label: "OUTDATED" },
  unknown: { dot: "bg-[#717A94]", text: "text-[#717A94]", label: "UNKNOWN" },
};

export function DataFreshnessIndicator({ cacheKey, onRefresh, className }: DataFreshnessIndicatorProps) {
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    setFetchedAt(getFetchedAt(cacheKey));
    const id = setInterval(() => setFetchedAt(getFetchedAt(cacheKey)), 30_000);
    return () => clearInterval(id);
  }, [cacheKey]);

  const status = getStatus(fetchedAt);
  const styles = STATUS_STYLES[status];

  async function handleRefresh() {
    if (!onRefresh || spinning) return;
    setSpinning(true);
    await onRefresh();
    setFetchedAt(getFetchedAt(cacheKey));
    setSpinning(false);
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", styles.dot, {
        "animate-pulse-dot": status === "fresh",
      })} />
      <span className={cn("text-[10px] font-mono tracking-wider uppercase", styles.text)}>
        {formatAge(fetchedAt)}
      </span>
      {onRefresh && (
        <button
          onClick={handleRefresh}
          className="text-[#717A94] hover:text-[#C8D0E7] transition-colors"
          title="Refresh data"
        >
          <RefreshCw
            size={10}
            className={cn({ "animate-spin": spinning })}
          />
        </button>
      )}
    </div>
  );
}
