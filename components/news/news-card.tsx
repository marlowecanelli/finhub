"use client";

import Link from "next/link";
import { ExternalLink, Flame, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/lib/news";

type Props = { article: NewsArticle; variant?: "default" | "breaking" };

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.round(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const IMPACT_STYLE: Record<NewsArticle["impact"], string> = {
  breaking: "bg-[#ef4444]/10 text-[#ef4444] ring-1 ring-inset ring-[#ef4444]/30",
  high: "bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/30",
  low: "bg-muted/60 text-muted-foreground",
};

export function NewsCard({ article, variant = "default" }: Props) {
  const isBreaking = variant === "breaking" || article.impact === "breaking";

  return (
    <article
      className={cn(
        "glass relative overflow-hidden p-5 transition-all hover:border-white/20",
        isBreaking && "ring-1 ring-inset ring-[#ef4444]/30"
      )}
    >
      {isBreaking && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ef4444]/8 via-transparent to-transparent"
        />
      )}
      <div className="relative flex flex-col gap-3 md:flex-row md:gap-5">
        {article.imageUrl && (
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 overflow-hidden rounded-xl border border-border/60 md:w-44"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt=""
              loading="lazy"
              className="aspect-[16/10] w-full object-cover transition-transform duration-300 hover:scale-[1.03] md:aspect-square"
            />
          </a>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{article.source}</span>
            <span>·</span>
            <time>{relativeTime(article.publishedAt)}</time>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                IMPACT_STYLE[article.impact]
              )}
            >
              {article.impact === "breaking" && <Flame className="h-3 w-3" />}
              {article.impact === "high" && <Zap className="h-3 w-3" />}
              {article.impact}
            </span>
            {article.matchedKeywords.slice(0, 3).map((k) => (
              <span
                key={k}
                className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {k}
              </span>
            ))}
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="group block"
          >
            <h3 className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary md:text-lg">
              {article.title}
              <ExternalLink className="ml-1 inline h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
            </h3>
          </a>

          {article.summary ? (
            <p className="flex items-start gap-1.5 text-sm leading-relaxed text-muted-foreground">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              <span>{article.summary}</span>
            </p>
          ) : article.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {article.description}
            </p>
          ) : null}

          {article.tickers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {article.tickers.slice(0, 6).map((t) => (
                <Link
                  key={t}
                  href={`/ticker/${encodeURIComponent(t)}`}
                  className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/30 transition-colors hover:bg-primary/20"
                >
                  ${t}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
