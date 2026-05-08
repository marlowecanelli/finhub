"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Brief = { content: string; generated_at: string; cached: boolean };

export function AiBrief() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(refresh = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/calendar-brief${refresh ? "?refresh=1" : ""}`);
      const json = (await res.json()) as { data?: Brief; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Unable to load brief");
      } else {
        setBrief(json.data ?? null);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
  }, []);

  return (
    <section className="relative mb-6 overflow-hidden rounded-xl border border-[hsl(var(--signal)/0.25)] bg-gradient-to-br from-[hsl(var(--signal)/0.05)] via-transparent to-transparent p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[hsl(var(--signal))]" />
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--signal))]">
            What to watch today
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => load(true)} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>
      <div className="mt-3 min-h-[80px] text-sm leading-relaxed text-foreground/90">
        {loading && !brief && <span className="text-muted-foreground">Composing morning brief…</span>}
        {error && <span className="text-muted-foreground">{error}</span>}
        {brief && <p className="whitespace-pre-line">{brief.content}</p>}
      </div>
    </section>
  );
}
