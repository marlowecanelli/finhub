import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { BuffettScoreResponse } from "./types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TABLE = "buffett_score_cache";

export async function readCache(ticker: string): Promise<BuffettScoreResponse | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from(TABLE)
    .select("payload, computed_at")
    .eq("ticker", ticker.toUpperCase())
    .maybeSingle();

  if (error || !data) return null;

  const age = Date.now() - new Date(data.computed_at as string).getTime();
  if (age > CACHE_TTL_MS) return null;

  return data.payload as BuffettScoreResponse;
}

export async function writeCache(ticker: string, payload: BuffettScoreResponse): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  await admin.from(TABLE).upsert(
    {
      ticker: ticker.toUpperCase(),
      payload,
      computed_at: new Date().toISOString(),
    },
    { onConflict: "ticker" }
  );
}
