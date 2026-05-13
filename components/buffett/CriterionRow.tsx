"use client";

import type { BuffettCriterion } from "@/lib/buffett/types";

interface CriterionRowProps {
  criterion: BuffettCriterion;
  onWhy: (id: string) => void;
}

function StatusIcon({ status }: { status: BuffettCriterion["status"] }) {
  if (status === "pass") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-label="Pass"
        className="shrink-0"
      >
        <circle cx="9" cy="9" r="8.5" stroke="#2F6B43" strokeWidth="1" fill="#2F6B43" fillOpacity="0.12" />
        <path d="M5.5 9l2.5 2.5 4.5-5" stroke="#2F6B43" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "fail") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-label="Fail"
        className="shrink-0"
      >
        <circle cx="9" cy="9" r="8.5" stroke="#8C2A2A" strokeWidth="1" fill="#8C2A2A" fillOpacity="0.12" />
        <path d="M6 6l6 6M12 6l-6 6" stroke="#8C2A2A" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }
  // partial
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-label="Partial"
      className="shrink-0"
    >
      <circle cx="9" cy="9" r="8.5" stroke="#B8862B" strokeWidth="1" fill="none" />
      <path d="M9 0.5 A8.5 8.5 0 0 1 9 17.5 Z" fill="#B8862B" fillOpacity="0.25" />
      <path d="M9 2 A7 7 0 0 1 9 16" stroke="#B8862B" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "#2F6B43" : score >= 4 ? "#B8862B" : "#8C2A2A";
  return (
    <div className="relative h-1 w-14 overflow-hidden rounded-full bg-border/50">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function CriterionRow({ criterion, onWhy }: CriterionRowProps) {
  return (
    <div className="grid grid-cols-[20px_1fr_auto] items-start gap-x-3 gap-y-1 border-b border-border/40 py-3 last:border-b-0 sm:grid-cols-[20px_1fr_120px_auto]">
      {/* Status icon */}
      <div className="pt-0.5">
        <StatusIcon status={criterion.status} />
      </div>

      {/* Name + explanation */}
      <div className="min-w-0">
        <p className="text-[0.88rem] font-medium leading-snug text-foreground">
          {criterion.name}
        </p>
        <p className="mt-0.5 text-[0.78rem] italic leading-relaxed text-muted-foreground">
          {criterion.explanation}
        </p>
        <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground/60">
          {criterion.actual}
        </p>
      </div>

      {/* Score bar + number — hidden on mobile */}
      <div className="hidden items-center gap-2 sm:flex">
        <ScoreBar score={criterion.score} />
        <span className="font-mono text-[0.75rem] tabular-nums text-muted-foreground">
          {criterion.score.toFixed(1)}
        </span>
      </div>

      {/* Why link */}
      <button
        onClick={() => onWhy(criterion.id)}
        className="whitespace-nowrap font-mono text-[0.7rem] uppercase tracking-wider text-[#B08A3E] transition-opacity hover:opacity-70"
        aria-label={`Why does ${criterion.name} matter?`}
      >
        Why?
      </button>
    </div>
  );
}
