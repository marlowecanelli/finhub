import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { computeBuffettScore } from "@/lib/buffett/computeBuffettScore";
import { SP500_TICKERS } from "@/lib/buffett/sp500";
import type { BuffettScoreResponse } from "@/lib/buffett/types";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel max for Pro
export const dynamic = "force-dynamic";

const CONCURRENCY = 10;
const TICKER_TIMEOUT_MS = 15_000;
const BATCH_SIZE = 125; // 4 batches of 125 = full S&P 500; each fits in 300s

/**
 * Simple semaphore — runs at most `concurrency` tasks simultaneously.
 */
async function withConcurrency<T>(
  items: readonly string[],
  concurrency: number,
  fn: (item: string) => Promise<T>
): Promise<Array<{ ticker: string; result: T | null; error?: string }>> {
  const results: Array<{ ticker: string; result: T | null; error?: string }> = [];
  const queue = [...items];

  async function worker() {
    while (queue.length > 0) {
      const ticker = queue.shift()!;
      try {
        const result = await fn(ticker);
        results.push({ ticker, result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown";
        results.push({ ticker, result: null, error: message });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

async function computeWithTimeout(ticker: string): Promise<BuffettScoreResponse | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.error(`[buffett-cron] Timeout: ${ticker}`);
      resolve(null);
    }, TICKER_TIMEOUT_MS);

    computeBuffettScore(ticker)
      .then((res) => {
        clearTimeout(timer);
        resolve(res.ok ? res.score : null);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Supabase admin unavailable" }, { status: 503 });
  }

  // Dry-run mode: process a small subset for testing
  const isDryRun = request.nextUrl.searchParams.get("dry_run") === "1";
  // batch=0..3 processes a quarter of the S&P 500 at a time (fits in Vercel 300s limit)
  // omit batch param to run all (legacy / local use only)
  const batchParam = request.nextUrl.searchParams.get("batch");
  const batchIndex = batchParam !== null ? parseInt(batchParam, 10) : null;

  let tickers: readonly string[];
  if (isDryRun) {
    tickers = SP500_TICKERS.slice(0, 10);
  } else if (batchIndex !== null && !isNaN(batchIndex)) {
    const start = batchIndex * BATCH_SIZE;
    tickers = SP500_TICKERS.slice(start, start + BATCH_SIZE);
  } else {
    tickers = SP500_TICKERS;
  }

  console.log(`[buffett-cron] Starting. Tickers: ${tickers.length}, dry_run: ${isDryRun}, batch: ${batchIndex ?? "all"}`);

  const startedAt = Date.now();
  let successes = 0;
  let failures = 0;

  const processed = await withConcurrency(tickers, CONCURRENCY, computeWithTimeout);

  // Upsert successes to screener table
  const rows = processed
    .filter((p) => p.result != null)
    .map((p) => {
      const r = p.result!;
      return {
        ticker: r.ticker,
        company_name: r.companyName,
        sector: r.sector ?? null,
        market_cap: null as number | null, // not in BuffettScoreResponse
        dividend_yield: null as number | null,
        overall: r.overall,
        label: r.label,
        payload: r as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      };
    });

  if (rows.length > 0) {
    // Upsert in chunks of 50 to avoid request limits
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const { error } = await admin
        .from("buffett_screener_results")
        .upsert(chunk, { onConflict: "ticker" });
      if (error) {
        console.error(`[buffett-cron] Upsert error at chunk ${i}:`, error.message);
      }
    }
    successes = rows.length;
  }

  failures = processed.filter((p) => p.result == null).length;

  const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `[buffett-cron] Done. successes=${successes} failures=${failures} duration=${durationSec}s`
  );

  return NextResponse.json({
    ok: true,
    dry_run: isDryRun,
    batch: batchIndex ?? "all",
    processed: tickers.length,
    successes,
    failures,
    duration_sec: parseFloat(durationSec),
    failed_tickers: processed.filter((p) => p.result == null).map((p) => p.ticker),
  });
}
