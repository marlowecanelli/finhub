import { UNIVERSE } from "@/lib/screener-universe";

export type NewsArticle = {
  id: string; // stable hash of url
  url: string;
  title: string;
  description: string | null;
  source: string;
  publishedAt: string; // ISO
  imageUrl: string | null;
  tickers: string[]; // matched against UNIVERSE
  sectors: string[]; // derived from tickers
  impactScore: number; // count of distinct keyword matches
  impact: "low" | "high" | "breaking";
  matchedKeywords: string[];
  summary: string | null; // populated later by AI cache
};

const HIGH_IMPACT_KEYWORDS: { word: string; pattern: RegExp }[] = [
  { word: "Fed", pattern: /\b(fed|federal reserve|fomc|powell)\b/i },
  { word: "earnings", pattern: /\b(earnings|EPS|revenue beat|revenue miss|quarterly results)\b/i },
  { word: "acquisition", pattern: /\b(acquisition|acquires|acquired|takeover|buyout)\b/i },
  { word: "merger", pattern: /\b(merger|merges with)\b/i },
  { word: "guidance", pattern: /\b(guidance|outlook|forecast cut|forecast raised|raises forecast)\b/i },
  { word: "downgrade", pattern: /\b(downgrade(?:s|d)?|cut to (?:sell|hold|underweight))\b/i },
  { word: "upgrade", pattern: /\b(upgrade(?:s|d)?|raised to (?:buy|overweight))\b/i },
  { word: "lawsuit", pattern: /\b(lawsuit|sued|sues|antitrust|investigation)\b/i },
  { word: "IPO", pattern: /\b(IPO|goes public|files to go public)\b/i },
  { word: "layoffs", pattern: /\b(layoffs?|job cuts|workforce reduction)\b/i },
  { word: "buyback", pattern: /\b(buyback|share repurchase|repurchase program)\b/i },
  { word: "dividend", pattern: /\b(dividend (?:hike|increase|cut|raised))\b/i },
];

const BREAKING_WINDOW_MS = 2 * 60 * 60 * 1000;

const NAME_TO_TICKER = new Map<string, string>();
for (const u of UNIVERSE) {
  // Strip suffixes like "Inc.", "Corp.", "Co." for looser matching.
  const base = u.name.replace(/(Inc\.?|Corp\.?|Co\.?|plc|Ltd\.?|Group|Holdings?)/gi, "").trim();
  if (base.length >= 3) NAME_TO_TICKER.set(base.toLowerCase(), u.symbol);
}
const TICKER_SET = new Set(UNIVERSE.map((u) => u.symbol));
const SECTOR_BY_TICKER = new Map(UNIVERSE.map((u) => [u.symbol, u.sector] as const));

export function detectKeywords(text: string): string[] {
  const hits = new Set<string>();
  for (const { word, pattern } of HIGH_IMPACT_KEYWORDS) {
    if (pattern.test(text)) hits.add(word);
  }
  return Array.from(hits);
}

export function extractTickers(text: string): string[] {
  const found = new Set<string>();

  // $TICKER and bare TICKER tokens (1-5 uppercase letters), filtered to UNIVERSE.
  const tokenRe = /\$?\b([A-Z]{1,5}(?:[.\-][A-Z])?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(text))) {
    const sym = m[1]!;
    if (TICKER_SET.has(sym)) found.add(sym);
  }

  // Lowercase company-name match.
  const lower = text.toLowerCase();
  for (const [name, sym] of NAME_TO_TICKER) {
    if (lower.includes(name)) found.add(sym);
  }

  return Array.from(found);
}

export function classifyImpact(
  publishedAt: string,
  keywordCount: number
): "low" | "high" | "breaking" {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  if (ageMs <= BREAKING_WINDOW_MS && keywordCount > 0) return "breaking";
  if (keywordCount > 0) return "high";
  return "low";
}

export function articleId(url: string): string {
  let h = 5381;
  for (let i = 0; i < url.length; i++) h = ((h * 33) ^ url.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function buildArticle(input: {
  url: string;
  title: string;
  description: string | null;
  source: string;
  publishedAt: string;
  imageUrl: string | null;
}): NewsArticle {
  const text = `${input.title} ${input.description ?? ""}`;
  const matchedKeywords = detectKeywords(text);
  const tickers = extractTickers(text);
  const sectors = Array.from(
    new Set(
      tickers
        .map((t) => SECTOR_BY_TICKER.get(t))
        .filter((x): x is string => Boolean(x))
    )
  );
  const impact = classifyImpact(input.publishedAt, matchedKeywords.length);
  return {
    id: articleId(input.url),
    url: input.url,
    title: input.title,
    description: input.description,
    source: input.source,
    publishedAt: input.publishedAt,
    imageUrl: input.imageUrl,
    tickers,
    sectors,
    impactScore: matchedKeywords.length,
    impact,
    matchedKeywords,
    summary: null,
  };
}

// ---------- Provider fetchers ----------

type RawArticle = {
  url: string;
  title: string;
  description: string | null;
  source: string;
  publishedAt: string;
  imageUrl: string | null;
};

async function fetchNewsAPI(): Promise<RawArticle[]> {
  const key = process.env.NEWSAPI_KEY;
  if (!key) return [];
  const url = `https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=100&apiKey=${key}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`NewsAPI ${r.status}`);
  const data = (await r.json()) as {
    articles?: Array<{
      url: string;
      title: string | null;
      description: string | null;
      source: { name: string | null };
      publishedAt: string;
      urlToImage: string | null;
    }>;
  };
  return (data.articles ?? [])
    .filter((a): a is typeof a & { title: string } => Boolean(a.title && a.url))
    .map((a) => ({
      url: a.url,
      title: a.title,
      description: a.description,
      source: a.source?.name ?? "Unknown",
      publishedAt: a.publishedAt,
      imageUrl: a.urlToImage,
    }));
}

async function fetchFinnhub(): Promise<RawArticle[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];
  const r = await fetch(
    `https://finnhub.io/api/v1/news?category=general&token=${key}`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error(`Finnhub ${r.status}`);
  const data = (await r.json()) as Array<{
    id: number;
    headline: string;
    summary: string;
    url: string;
    image: string;
    source: string;
    datetime: number;
  }>;
  return data.map((a) => ({
    url: a.url,
    title: a.headline,
    description: a.summary || null,
    source: a.source ?? "Unknown",
    publishedAt: new Date(a.datetime * 1000).toISOString(),
    imageUrl: a.image || null,
  }));
}

export async function fetchArticles(): Promise<NewsArticle[]> {
  const provider =
    process.env.NEWSAPI_KEY ? "newsapi" : process.env.FINNHUB_API_KEY ? "finnhub" : null;
  if (!provider) return [];

  let raw: RawArticle[];
  try {
    raw = provider === "newsapi" ? await fetchNewsAPI() : await fetchFinnhub();
  } catch {
    return [];
  }

  // De-dupe by URL, build, sort newest first.
  const seen = new Set<string>();
  const articles: NewsArticle[] = [];
  for (const r of raw) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    articles.push(buildArticle(r));
  }
  articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return articles;
}
