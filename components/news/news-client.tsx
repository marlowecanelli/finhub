"use client";

import * as React from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreakingSection } from "./breaking-section";
import { NewsCard } from "./news-card";
import { NewsFilters, type NewsFilterState } from "./news-filters";
import { NewArticlesToast } from "./new-articles-toast";
import { BreakingSkeleton, NewsCardSkeleton } from "./skeletons";
import type { NewsArticle } from "@/lib/news";

const REFRESH_MS = 5 * 60 * 1000;
const PAGE_SIZE = 10;

type Props = {
  initialArticles: NewsArticle[];
  initialFetchedAt: string | null;
  providerConfigured: boolean;
};

export function NewsClient({
  initialArticles,
  initialFetchedAt,
  providerConfigured,
}: Props) {
  const [articles, setArticles] = React.useState<NewsArticle[]>(initialArticles);
  const [pendingArticles, setPendingArticles] = React.useState<NewsArticle[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [fetchedAt, setFetchedAt] = React.useState<string | null>(initialFetchedAt);
  const [filters, setFilters] = React.useState<NewsFilterState>({
    ticker: "",
    sectors: [],
    impact: "all",
  });
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // ---------- AI summary hydration ----------
  const summarizing = React.useRef(false);
  React.useEffect(() => {
    if (summarizing.current) return;
    const need = articles.filter((a) => !a.summary).slice(0, 24);
    if (need.length === 0) return;
    summarizing.current = true;
    fetch("/api/ai/news-summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        articles: need.map((a) => ({
          url: a.url,
          title: a.title,
          description: a.description,
        })),
      }),
    })
      .then((r) => r.json())
      .then((data: { summaries?: Record<string, string> }) => {
        const map = data.summaries ?? {};
        setArticles((rows) =>
          rows.map((r) => (map[r.url] && !r.summary ? { ...r, summary: map[r.url]! } : r))
        );
      })
      .catch(() => {
        // ignore — cards just stay without AI summary
      })
      .finally(() => {
        summarizing.current = false;
      });
  }, [articles]);

  // ---------- Auto-refresh ----------
  const fetchLatest = React.useCallback(
    async (silent: boolean) => {
      if (!silent) setRefreshing(true);
      try {
        const r = await fetch("/api/news", { cache: "no-store" });
        const data = (await r.json()) as { articles: NewsArticle[]; fetchedAt: string };
        const incoming = data.articles ?? [];
        if (silent) {
          const knownIds = new Set(articles.map((a) => a.id));
          const fresh = incoming.filter((a) => !knownIds.has(a.id));
          if (fresh.length > 0) {
            setPendingArticles(fresh.concat(pendingArticles));
          }
        } else {
          setArticles(incoming);
          setPendingArticles([]);
        }
        setFetchedAt(data.fetchedAt);
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    [articles, pendingArticles]
  );

  React.useEffect(() => {
    if (!providerConfigured) return;
    const id = window.setInterval(() => void fetchLatest(true), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [fetchLatest, providerConfigured]);

  function applyPending() {
    if (pendingArticles.length === 0) return;
    const knownIds = new Set(articles.map((a) => a.id));
    const merge = pendingArticles.filter((a) => !knownIds.has(a.id));
    const next = [...merge, ...articles].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    setArticles(next);
    setPendingArticles([]);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ---------- Derived ----------
  const sectorOptions = React.useMemo(
    () =>
      Array.from(
        new Set(articles.flatMap((a) => a.sectors).filter(Boolean))
      ).sort(),
    [articles]
  );

  const filtered = React.useMemo(() => {
    return articles.filter((a) => {
      if (filters.impact === "high" && a.impact === "low") return false;
      if (filters.impact === "breaking" && a.impact !== "breaking") return false;
      if (filters.ticker.trim()) {
        const t = filters.ticker.trim().toUpperCase();
        if (!a.tickers.includes(t)) return false;
      }
      if (filters.sectors.length > 0) {
        if (!a.sectors.some((s) => filters.sectors.includes(s))) return false;
      }
      return true;
    });
  }, [articles, filters]);

  const breaking = React.useMemo(
    () => articles.filter((a) => a.impact === "breaking").slice(0, 6),
    [articles]
  );

  // Reset page when filters change
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  // Infinite scroll
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length]);

  if (!providerConfigured) {
    return <ProviderMissing />;
  }

  const slice = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            News
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Market news, ranked by impact
          </h1>
          {fetchedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Auto-refreshes every 5 minutes · last fetched{" "}
              {new Date(fetchedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void fetchLatest(false)}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
      </header>

      {articles.length === 0 ? (
        <div className="space-y-4">
          <BreakingSkeleton />
          {Array.from({ length: 4 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <BreakingSection articles={breaking} />

          <NewsFilters
            value={filters}
            onChange={setFilters}
            sectorOptions={sectorOptions}
            totalCount={articles.length}
            filteredCount={filtered.length}
          />

          {slice.length === 0 ? (
            <div className="glass p-10 text-center text-sm text-muted-foreground">
              No articles match these filters.
            </div>
          ) : (
            <ul className="space-y-3">
              {slice.map((a) => (
                <li key={a.id}>
                  <NewsCard article={a} />
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <div ref={sentinelRef} className="space-y-3 py-2">
              <NewsCardSkeleton />
            </div>
          )}
        </>
      )}

      <NewArticlesToast count={pendingArticles.length} onClick={applyPending} />
    </div>
  );
}

function ProviderMissing() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
        <Newspaper className="h-5 w-5" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">News provider not configured</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Add <code className="font-mono text-xs">NEWSAPI_KEY</code> or{" "}
        <code className="font-mono text-xs">FINNHUB_API_KEY</code> to{" "}
        <code className="font-mono text-xs">.env.local</code> and restart the dev server.
      </p>
    </div>
  );
}
