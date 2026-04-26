import { NextResponse } from "next/server";
import { CLAUDE_MODEL, extractJson, getAnthropic } from "@/lib/anthropic";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type Input = { url: string; title: string; description?: string | null };

type CacheRow = { article_url: string; summary: string; created_at: string };

async function readCache(urls: string[]): Promise<Record<string, string>> {
  const admin = getSupabaseAdmin();
  if (!admin || urls.length === 0) return {};
  const { data } = await admin
    .from("news_summaries_cache")
    .select("article_url, summary, created_at")
    .in("article_url", urls);
  const out: Record<string, string> = {};
  for (const row of (data ?? []) as CacheRow[]) {
    if (Date.now() - new Date(row.created_at).getTime() > CACHE_TTL_MS) continue;
    out[row.article_url] = row.summary;
  }
  return out;
}

async function writeCache(entries: { url: string; summary: string }[]) {
  const admin = getSupabaseAdmin();
  if (!admin || entries.length === 0) return;
  const now = new Date().toISOString();
  await admin.from("news_summaries_cache").upsert(
    entries.map((e) => ({
      article_url: e.url,
      summary: e.summary,
      created_at: now,
    })),
    { onConflict: "article_url" }
  );
}

async function summarizeBatch(items: Input[]): Promise<Record<string, string>> {
  if (items.length === 0) return {};
  const client = getAnthropic();
  const prompt = `Write a single neutral, factual sentence (<=22 words) summarizing each article. Use the headline and description.
Return JSON ONLY: { "items": [{ "url": "...", "summary": "..." }] }. No markdown.

ARTICLES:
${items
  .map(
    (a, i) =>
      `${i + 1}. url=${a.url}\n   title: ${a.title}\n   description: ${a.description ?? ""}`
  )
  .join("\n\n")}`;

  const resp = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: Math.min(4000, 200 * items.length + 200),
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  });
  const text = resp.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");

  const out: Record<string, string> = {};
  try {
    const parsed = extractJson(text) as { items?: { url?: string; summary?: string }[] };
    for (const it of parsed.items ?? []) {
      if (it.url && it.summary) out[it.url] = it.summary.trim();
    }
  } catch {
    // ignore
  }
  return out;
}

export async function POST(req: Request) {
  let body: { articles?: Input[] };
  try {
    body = (await req.json()) as { articles?: Input[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const articles = (body.articles ?? []).filter(
    (a): a is Input => Boolean(a?.url && a.title)
  );
  if (articles.length === 0) return NextResponse.json({ summaries: {} });

  // Read cache first.
  const cached = await readCache(articles.map((a) => a.url));
  const need = articles.filter((a) => !cached[a.url]);

  let fresh: Record<string, string> = {};
  if (need.length > 0 && process.env.ANTHROPIC_API_KEY) {
    // Batch in chunks of 12 to keep prompts focused.
    const chunkSize = 12;
    for (let i = 0; i < need.length; i += chunkSize) {
      const chunk = need.slice(i, i + chunkSize);
      try {
        const part = await summarizeBatch(chunk);
        Object.assign(fresh, part);
      } catch {
        // continue with whatever we got
      }
    }
    await writeCache(
      Object.entries(fresh).map(([url, summary]) => ({ url, summary }))
    ).catch(() => {
      // non-fatal
    });
  }

  return NextResponse.json({ summaries: { ...cached, ...fresh } });
}
