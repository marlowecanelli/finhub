"use client";

import { useEffect, useState, useCallback } from "react";
import type { BuffettScoreResponse } from "@/lib/buffett/types";
import { BuffettBadge } from "./BuffettBadge";
import { CriterionRow } from "./CriterionRow";
import { WhyModal } from "./WhyModal";
import { PullQuote } from "./PullQuote";
import { Disclaimer } from "./Disclaimer";

interface BuffettScoreSectionProps {
  ticker: string;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <section className="buffett-surface rounded-2xl bg-[#F7F3EC] p-6 dark:bg-[#100E0C] md:p-10" aria-busy="true" aria-label="Loading Buffett Score">
      <div className="mb-6 border-b border-[#D9D2C2]/50 pb-4 dark:border-[#2A2520]">
        <div className="h-3 w-28 rounded bg-[#D9D2C2]/70 dark:bg-[#2A2520] shimmer" />
        <div className="mt-2 h-6 w-48 rounded bg-[#D9D2C2]/50 dark:bg-[#2A2520]/80 shimmer" />
      </div>
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        {/* Badge skeleton */}
        <div className="mx-auto shrink-0 md:mx-0">
          <div className="h-[180px] w-[180px] rounded-full bg-[#D9D2C2]/60 dark:bg-[#2A2520] shimmer md:h-[220px] md:w-[220px]" />
        </div>
        {/* Rows skeleton */}
        <div className="flex-1 space-y-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[#D9D2C2]/30 py-3 dark:border-[#2A2520] last:border-b-0">
              <div className="h-4 w-4 rounded-full bg-[#D9D2C2]/70 dark:bg-[#2A2520] shimmer shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 rounded bg-[#D9D2C2]/60 dark:bg-[#2A2520] shimmer" />
                <div className="h-2.5 w-48 rounded bg-[#D9D2C2]/40 dark:bg-[#2A2520]/60 shimmer" />
              </div>
            </div>
          ))}
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

    return () => { cancelled = true; };
  }, [ticker]);

  const closeModal = useCallback(() => setWhyId(null), []);

  if (loading) return <Skeleton />;

  if (error || !data) {
    return (
      <section className="buffett-surface rounded-2xl bg-[#F7F3EC] p-6 dark:bg-[#100E0C] md:p-10">
        <div className="flex items-center gap-3">
          <span className="editorial-eyebrow text-[#B08A3E]">Buffett Score</span>
        </div>
        <p className="mt-3 font-serif text-sm italic text-[#1A1814]/50 dark:text-[#F7F3EC]/40">
          Score unavailable — {error ?? "insufficient financial history."}
        </p>
      </section>
    );
  }

  const labelColorClass =
    data.label === "Highly Buffett-Worthy" || data.label === "Buffett-Worthy"
      ? "text-[#2F6B43]"
      : data.label === "Neutral"
      ? "text-[#B8862B]"
      : "text-[#8C2A2A]";

  return (
    <>
      <section
        id="buffett-score"
        className="buffett-surface rounded-2xl bg-[#F7F3EC] p-6 shadow-sm dark:bg-[#100E0C] md:p-10"
      >
        {/* Header */}
        <div className="mb-6 border-b border-[#D9D2C2]/60 pb-4 dark:border-[#2A2520]">
          <p className="editorial-eyebrow text-[#B08A3E]">Value Investing Analysis</p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-[#1A1814] dark:text-[#F7F3EC] md:text-3xl">
            Buffett Score
          </h2>
          <p className="mt-1 font-sans text-[0.8rem] text-[#1A1814]/45 dark:text-[#F7F3EC]/35">
            Algorithmic assessment of adherence to Buffett's investing principles
          </p>
        </div>

        {/* Two-column layout: badge + criteria */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
          {/* Badge column */}
          <div className="flex flex-col items-center gap-4 md:w-[220px] md:shrink-0">
            <BuffettBadge score={data.overall} label={data.label} size={200} />
            <div className="text-center">
              <p className={`font-sans text-[0.72rem] font-semibold uppercase tracking-widest ${labelColorClass}`}>
                {data.label}
              </p>
              <p className="mt-1 font-sans text-[0.68rem] text-[#1A1814]/40 dark:text-[#F7F3EC]/30">
                {data.companyName} · {data.sector}
              </p>
            </div>
          </div>

          {/* Criteria grid */}
          <div className="flex-1">
            <div className="divide-y divide-transparent">
              {data.criteria.map((c) => (
                <CriterionRow
                  key={c.id}
                  criterion={c}
                  onWhy={setWhyId}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pullquote */}
        <PullQuote text={data.quote.text} attribution={data.quote.attribution} />

        {/* Disclaimer */}
        <Disclaimer />
      </section>

      {/* Educational modal */}
      <WhyModal criterionId={whyId} onClose={closeModal} />
    </>
  );
}
