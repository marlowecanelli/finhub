"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { BuffettScoreResponse, BuffettLabel } from "@/lib/buffett/types";
import { BuffettBadge } from "./BuffettBadge";
import { CriterionRow } from "./CriterionRow";
import { WhyModal } from "./WhyModal";
import { PullQuote } from "./PullQuote";
import { Disclaimer } from "./Disclaimer";

interface BuffettScoreSectionProps {
  ticker: string;
}

// ── Glow by label ─────────────────────────────────────────────────────────────

const SECTION_GLOW: Record<BuffettLabel, string> = {
  "Highly Buffett-Worthy":
    "0 0 0 1px rgba(176,138,62,0.55), 0 0 60px rgba(176,138,62,0.14), 0 0 120px rgba(176,138,62,0.06)",
  "Buffett-Worthy":
    "0 0 0 1px rgba(176,138,62,0.35), 0 0 40px rgba(176,138,62,0.09)",
  Neutral:
    "0 0 0 1px hsl(var(--border)), 0 30px 60px -30px rgba(0,0,0,0.6)",
  Avoid:
    "0 0 0 1px rgba(239,68,68,0.28), 0 0 40px rgba(239,68,68,0.09)",
  "Strongly Avoid":
    "0 0 0 1px rgba(239,68,68,0.45), 0 0 60px rgba(239,68,68,0.13), 0 0 120px rgba(239,68,68,0.05)",
};

const SECTION_TINT: Record<BuffettLabel, string> = {
  "Highly Buffett-Worthy":
    "radial-gradient(ellipse at 15% 50%, rgba(176,138,62,0.09), transparent 55%)",
  "Buffett-Worthy":
    "radial-gradient(ellipse at 15% 50%, rgba(176,138,62,0.06), transparent 55%)",
  Neutral: "none",
  Avoid:
    "radial-gradient(ellipse at 15% 50%, rgba(239,68,68,0.05), transparent 55%)",
  "Strongly Avoid":
    "radial-gradient(ellipse at 15% 50%, rgba(239,68,68,0.08), transparent 55%)",
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <section
      className="relative overflow-hidden rounded-xl bg-card/60 ring-1 ring-border/50 backdrop-blur-xl"
      aria-busy="true"
      aria-label="Loading Buffett Score"
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 border-b border-border/50 pb-4">
          <Skeleton className="mb-2 h-3 w-28" />
          <Skeleton className="h-7 w-44" />
          <Skeleton className="mt-2 h-3 w-72" />
        </div>

        {/* Layout */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
          {/* Badge placeholder */}
          <div className="mx-auto shrink-0 md:mx-0">
            <Skeleton className="h-[180px] w-[180px] rounded-full md:h-[200px] md:w-[200px]" />
          </div>

          {/* Rows placeholder */}
          <div className="flex-1 space-y-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border/30 py-3 last:border-b-0"
              >
                <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-2.5 w-52" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BuffettScoreSection({ ticker }: BuffettScoreSectionProps) {
  const [data, setData] = useState<BuffettScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whyId, setWhyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/buffett-score?ticker=${encodeURIComponent(ticker)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Score unavailable (${res.status})`);
        return res.json();
      })
      .then((json: BuffettScoreResponse) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const closeModal = useCallback(() => setWhyId(null), []);

  if (loading) return <LoadingSkeleton />;

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <section
        id="buffett-score"
        className="relative overflow-hidden rounded-xl bg-card/60 ring-1 ring-border/50 backdrop-blur-xl"
      >
        <div className="p-6 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#B08A3E]">
            Buffett Score
          </p>
          <p className="mt-3 text-sm italic text-muted-foreground">
            Score unavailable — {error ?? "insufficient financial history."}
          </p>
        </div>
      </section>
    );
  }

  const glow = SECTION_GLOW[data.label];
  const tint = SECTION_TINT[data.label];

  return (
    <>
      <AnimatePresence>
        <motion.section
          id="buffett-score"
          key="buffett-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-xl bg-card/60 backdrop-blur-xl transition-shadow duration-700"
          style={{ boxShadow: glow }}
        >
          {/* Tint overlay */}
          {tint !== "none" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-all duration-700"
              style={{ background: tint }}
            />
          )}

          <div className="relative p-6 md:p-8">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="mb-6 border-b border-border/50 pb-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#B08A3E]">
                Value Investing Analysis
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Buffett Score
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Algorithmic assessment of adherence to Buffett&apos;s investing principles
              </p>
            </div>

            {/* ── Two-column: badge + criteria ───────────────────────────── */}
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
              {/* Badge column */}
              <div className="flex flex-col items-center gap-3 md:w-[210px] md:shrink-0">
                <BuffettBadge score={data.overall} label={data.label} size={200} />
                <div className="text-center">
                  <p className="font-mono text-[0.68rem] text-muted-foreground">
                    {data.companyName} · {data.sector}
                  </p>
                </div>
              </div>

              {/* Criteria list */}
              <div className="flex-1">
                {data.criteria.map((c) => (
                  <CriterionRow key={c.id} criterion={c} onWhy={setWhyId} />
                ))}
              </div>
            </div>

            {/* ── Pullquote ──────────────────────────────────────────────── */}
            <PullQuote text={data.quote.text} attribution={data.quote.attribution} />

            {/* ── Disclaimer ─────────────────────────────────────────────── */}
            <div className="mt-6 border-t border-border/40 pt-4">
              <Disclaimer />
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

      {/* Educational modal */}
      <WhyModal criterionId={whyId} onClose={closeModal} />
    </>
  );
}
