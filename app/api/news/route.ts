import { NextResponse } from "next/server";
import { fetchArticles } from "@/lib/news";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type CacheRow = { article_url: string; summary: string };

export async function GET() {
  const articles = await fetchArticles();

  // Hydrate any cached summaries (cheap read; no AI calls here).
  if (articles.length > 0) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const urls = articles.map((a) => a.url);
      const { data } = await admin
        .from("news_summaries_cache")
        .select("article_url, summary")
        .in("article_url", urls);
      const map = new Map<string, string>();
      for (const r of (data ?? []) as CacheRow[]) map.set(r.article_url, r.summary);
      for (const a of articles) {
        const s = map.get(a.url);
        if (s) a.summary = s;
      }
    }
  }

  return NextResponse.json({
    articles,
    fetchedAt: new Date().toISOString(),
    providerConfigured: Boolean(process.env.NEWSAPI_KEY || process.env.FINNHUB_API_KEY),
  });
}
