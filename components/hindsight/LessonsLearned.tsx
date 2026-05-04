"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import type { Holding } from "@/lib/hindsight/types";

type Props = {
  scenarioName: string;
  dateRange: string;
  drawdown: number;
  holdings: Holding[];
};

export function LessonsLearned({
  scenarioName,
  dateRange,
  drawdown,
  holdings,
}: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      setText("");
      try {
        const res = await fetch("/api/hindsight/coaching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioName,
            dateRange,
            drawdown,
            holdings,
          }),
        });
        if (!res.ok || !res.body) {
          setError(await res.text().catch(() => "Coaching unavailable."));
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          const chunk = decoder.decode(value, { stream: true });
          setText((t) => t + chunk);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Stream error");
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [scenarioName, dateRange, drawdown, holdings]);

  return (
    <div className="rounded-xl border-l-2 border-hindsight-pain/60 bg-gradient-to-br from-hindsight-pain/[0.06] to-transparent p-5">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-hindsight-pain" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-hindsight-pain/80">
          Lessons learned
        </span>
        {loading && (
          <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-white/30" />
        )}
      </div>
      {error && !text ? (
        <p className="text-sm italic text-white/40">{error}</p>
      ) : (
        <div className="space-y-3 text-[15px] leading-relaxed text-white/80 [&_p]:font-serif">
          {(text || "").split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {!text && loading && (
            <p className="font-serif italic text-white/40">
              The coach is gathering its thoughts…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
