"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type NewsItem = {
  uuid: string;
  title: string;
  publisher: string | null;
  link: string;
  providerPublishTime: number | null;
  summary: string | null;
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
    <section className="glass p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
          <Newspaper className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Recent news</h2>
          <p className="text-xs text-muted-foreground">
            AI-summarized headlines from the past week
          </p>
        </div>
      </div>

      {items === null ? (
        <NewsSkeleton />
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {error ?? "No recent news found."}
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((n, i) => (
            <motion.li
              key={n.uuid}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              className="py-4 first:pt-0 last:pb-0"
            >
              <a
                href={n.link}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-start gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {n.publisher && <span>{n.publisher}</span>}
                    {n.publisher && n.providerPublishTime && <span>·</span>}
                    {n.providerPublishTime && (
                      <time>
                        {relativeTime(n.providerPublishTime)}
                      </time>
                    )}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                    {n.title}
                  </h3>
                  {n.summary && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {n.summary}
                    </p>
                  )}
                </div>
                <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </a>
            </motion.li>
          ))}
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
