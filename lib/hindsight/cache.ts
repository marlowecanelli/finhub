import { getSupabaseAdmin } from "@/lib/supabase-admin";

const memCache = new Map<string, { payload: unknown; expiresAt: number | null }>();

function isExpired(expiresAt: number | null): boolean {
  if (expiresAt == null) return false;
  return Date.now() > expiresAt;
}

export async function readCache<T>(key: string): Promise<T | null> {
  const hit = memCache.get(key);
  if (hit && !isExpired(hit.expiresAt)) return hit.payload as T;

  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from("hindsight_cache")
    .select("payload, expires_at")
    .eq("cache_key", key)
    .maybeSingle();
  if (error || !data) return null;
  const expires = data.expires_at ? new Date(data.expires_at).getTime() : null;
  if (isExpired(expires)) return null;
  memCache.set(key, { payload: data.payload, expiresAt: expires });
  return data.payload as T;
}

export async function writeCache(
  key: string,
  payload: unknown,
  ttlSeconds: number | null
): Promise<void> {
  const expiresAt = ttlSeconds == null ? null : Date.now() + ttlSeconds * 1000;
  memCache.set(key, { payload, expiresAt });
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const expires_at = expiresAt ? new Date(expiresAt).toISOString() : null;
  await sb
    .from("hindsight_cache")
    .upsert({ cache_key: key, payload, expires_at }, { onConflict: "cache_key" });
}
