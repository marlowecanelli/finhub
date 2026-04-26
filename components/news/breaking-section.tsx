"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/lib/news";

type Props = { articles: NewsArticle[] };

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export function BreakingSection({ articles }: Props) {
  if (articles.length === 0) return null;
  return (
    <section className="glass relative overflow-hidden p-5 md:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ef4444]/15 via-transparent to-transparent"
      />
      <div className="relative">
        <div className="mb-4 flex items-center gap-2">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-[#ef4444]/15 text-[#ef4444] ring-1 ring-inset ring-[#ef4444]/30">
            <Flame className="h-3.5 w-3.5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]" />
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Breaking
          </h2>
          <span className="text-xs text-muted-foreground">
            ({articles.length} in the last 2 hours)
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 6).map((a) => (
            <li key={a.id}>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "group block h-full rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur-sm transition-all hover:border-[#ef4444]/40 hover:bg-[#ef4444]/5"
                )}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="truncate font-medium text-foreground/80">
                    {a.source}
                  </span>
                  <time>{relativeTime(a.publishedAt)}</time>
                </div>
                <h3 className="mt-1.5 line-clamp-3 text-sm font-semibold leading-snug text-foreground group-hover:text-foreground">
                  {a.title}
                </h3>
                {a.tickers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.tickers.slice(0, 3).map((t) => (
                      <Link
                        key={t}
                        href={`/ticker/${encodeURIComponent(t)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded bg-primary/10 px-1 py-0.5 font-mono text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/30"
                      >
                        ${t}
                      </Link>
                    ))}
                  </div>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
