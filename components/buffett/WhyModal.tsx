"use client";

import { useEffect } from "react";
import { CRITERION_EDUCATION } from "@/lib/buffett/education";

interface WhyModalProps {
  criterionId: string | null;
  onClose: () => void;
}

export function WhyModal({ criterionId, onClose }: WhyModalProps) {
  const entry = criterionId
    ? CRITERION_EDUCATION.find((e) => e.criterionId === criterionId)
    : null;

  // Close on Escape
  useEffect(() => {
    if (!criterionId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [criterionId, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (criterionId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [criterionId]);

  if (!criterionId || !entry) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.criterionName} — why it matters`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 mx-auto max-w-lg w-full overflow-y-auto max-h-[90vh] rounded-2xl bg-[#F7F3EC] p-8 shadow-2xl dark:bg-[#1A1814]">
        {/* Header */}
        <div className="mb-6 border-b border-[#D9D2C2] pb-4 dark:border-[#2A2520]">
          <p className="editorial-eyebrow mb-1 text-[#B08A3E]">Why does this matter?</p>
          <h2 className="font-display text-2xl font-semibold text-[#1A1814] dark:text-[#F7F3EC]">
            {entry.criterionName}
          </h2>
        </div>

        {/* Explanation */}
        <p className="font-serif text-[0.9rem] leading-relaxed text-[#1A1814]/80 dark:text-[#F7F3EC]/75">
          {entry.explanation}
        </p>

        {/* Quote */}
        <blockquote className="mt-6 border-l-2 border-[#B08A3E] pl-4">
          <p className="font-serif text-[0.85rem] italic leading-relaxed text-[#1A1814]/70 dark:text-[#F7F3EC]/60">
            "{entry.quote}"
          </p>
          <footer className="mt-1 font-sans text-[0.7rem] text-[#B08A3E]">
            — {entry.quoteAttribution}
          </footer>
        </blockquote>

        {/* Footer note */}
        <p className="mt-6 font-sans text-[0.65rem] text-[#1A1814]/40 dark:text-[#F7F3EC]/30">
          Source criteria are based on widely reported public statements and writings.
        </p>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#1A1814]/40 transition-colors hover:bg-[#D9D2C2]/50 hover:text-[#1A1814] dark:text-[#F7F3EC]/40 dark:hover:bg-[#2A2520] dark:hover:text-[#F7F3EC]"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
