import { headers } from "next/headers";
import { NewsClient } from "@/components/news/news-client";
import type { NewsArticle } from "@/lib/news";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadInitial(): Promise<{
  articles: NewsArticle[];
  fetchedAt: string | null;
  providerConfigured: boolean;
}> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return { articles: [], fetchedAt: null, providerConfigured: false };
  try {
    const r = await fetch(`${proto}://${host}/api/news`, {
      cache: "no-store",
      headers: { cookie: h.get("cookie") ?? "" },
    });
    const data = (await r.json()) as {
      articles?: NewsArticle[];
      fetchedAt?: string;
      providerConfigured?: boolean;
    };
    return {
      articles: data.articles ?? [],
      fetchedAt: data.fetchedAt ?? null,
      providerConfigured: Boolean(data.providerConfigured),
    };
  } catch {
    return { articles: [], fetchedAt: null, providerConfigured: false };
  }
}

export default async function NewsPage() {
  const { articles, fetchedAt, providerConfigured } = await loadInitial();
  return (
    <NewsClient
      initialArticles={articles}
      initialFetchedAt={fetchedAt}
      providerConfigured={providerConfigured}
    />
  );
}
