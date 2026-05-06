// Stale-while-revalidate in-memory cache for research API calls

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttlMs: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > entry.ttlMs) return null;
  return entry.data;
}

export function setCached<T>(key: string, data: T, ttlMs = 15 * 60 * 1000): void {
  store.set(key, { data, fetchedAt: Date.now(), ttlMs });
}

export function isStale(key: string, staleMs = 15 * 60 * 1000): boolean {
  const entry = store.get(key);
  if (!entry) return true;
  return Date.now() - entry.fetchedAt > staleMs;
}

export function getFetchedAt(key: string): Date | null {
  const entry = store.get(key);
  if (!entry) return null;
  return new Date(entry.fetchedAt);
}

export function invalidate(key: string): void {
  store.delete(key);
}

export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 15 * 60 * 1000
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;
  const data = await fetcher();
  setCached(key, data, ttlMs);
  return data;
}
