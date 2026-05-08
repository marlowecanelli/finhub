"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type NewsItem = {
  uuid: string;
  title: string;
  publisher: string | null;
  link: string;
  providerPublishTime: number | null;
  summary: string | null;
};

const HIGH_IMPACT = /\b(fed|federal reserve|earnings|acquisition|merger|ceo|guidance|beat|miss|bankruptcy|acquisition|takeover|layoff|layoffs|recall|fraud|investigation|sec|lawsuit)\b/i;
const MED_IMPACT  = /\b(upgrade|downgrade|target|analyst|partnership|contract|deal|expansion|launch)\b/i;

function getImpact(title: string): "high" | "medium" | "low" {
  if (HIGH_IMPACT.test(title)) return "high";
  if (MED_IMPACT.test(title)) return "medium";
  return "low";
}

const IMPACT_CONFIG = {
  high:   { label: "High",   cls: "text-[#f97316] bg-[#f97316]/10 ring-[#f97316]/25", accent: "border-l-2 border-l-[#f97316]/60" },
  medium: { label: "Medium", cls: "text-amber-400 bg-amber-400/10 ring-amber-400/20", accent: "" },
  low:    { label: "Low",    cls: "text-muted-foreground bg-muted/40 ring-border",    accent: "" },
};

export function NewsSection({ symbol }: { symbol: string }) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/ticker/${encodeURIComponent(symbol)}/news`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.error) setError(data.error);
        setItems(data.items ?? []);
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load news");
          setItems([]);
        }
      });
    return () => {
      alive = false;
    };
  }, [symbol]);

  return (
    <section className="glass p-6 md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Section</span>
        <h2 className="font-display text-xl font-medium tracking-tight">Related News</h2>
      </div>

      {items === null ? (
        <NewsSkeleton />
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {error ?? "No recent news found."}
        </p>
      ) : (
        <ul className="divide-y divide-border/40">
          {items.map((n, i) => {
            const impact = getImpact(n.title);
            const cfg = IMPACT_CONFIG[impact];
            return (
              <motion.li
                key={n.uuid}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className={cn("py-4 first:pt-0 last:pb-0", impact === "high" ? "pl-3 " + cfg.accent : "")}
              >
                <a href={n.link} target="_blank" rel="noreferrer noopener" className="group flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {n.publisher && <span className="font-medium text-foreground/60">{n.publisher}</span>}
                      {n.publisher && n.providerPublishTime && <span>·</span>}
                      {n.providerPublishTime && <time>{relativeTime(n.providerPublishTime)}</time>}
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ring-1 ring-inset", cfg.cls)}>
                        {cfg.label}
                      </span>
                    </div>
                    <h3 className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                      {n.title}
                    </h3>
                    {n.summary && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {n.summary}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary" />
                </a>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function NewsSkeleton() {
  return (
    <ul className="divide-y divide-border/50">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="py-4 first:pt-0 last:pb-0">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-3 w-[75%]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function relativeTime(unix: number): string {
  const diff = Date.now() / 1000 - unix;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.round(diff / 86400)}d ago`;
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
