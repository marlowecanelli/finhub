// Thin wrapper around the FRED REST API. Free; requires FRED_API_KEY.
// https://fred.stlouisfed.org/docs/api/fred/

export function fredApiKey(): string | null {
  return process.env.FRED_API_KEY ?? null;
}

export interface FredObservation {
  date: string;
  value: number;
}

export interface FredSeriesMeta {
  id: string;
  title: string;
  units: string;
  frequency: string;
  lastUpdated: string;
}

async function fredFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = fredApiKey();
  if (!key) return null;
  const search = new URLSearchParams({ api_key: key, file_type: "json", ...params });
  const url = `https://api.stlouisfed.org/fred/${path}?${search.toString()}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export async function fredSeriesMeta(seriesId: string): Promise<FredSeriesMeta | null> {
  const json = await fredFetch<{ seriess: { id: string; title: string; units_short: string; frequency_short: string; last_updated: string }[] }>(
    "series",
    { series_id: seriesId },
  );
  const s = json?.seriess?.[0];
  if (!s) return null;
  return {
    id: s.id,
    title: s.title,
    units: s.units_short,
    frequency: s.frequency_short,
    lastUpdated: s.last_updated,
  };
}

export async function fredObservations(
  seriesId: string,
  opts: { start?: string; units?: "lin" | "pch" | "pc1"; limit?: number } = {},
): Promise<FredObservation[]> {
  const params: Record<string, string> = {
    series_id: seriesId,
    sort_order: "asc",
  };
  if (opts.start) params.observation_start = opts.start;
  if (opts.units) params.units = opts.units;
  if (opts.limit) params.limit = String(opts.limit);

  const json = await fredFetch<{ observations: { date: string; value: string }[] }>(
    "series/observations",
    params,
  );
  if (!json) return [];
  return json.observations
    .map(o => ({ date: o.date, value: parseFloat(o.value) }))
    .filter(o => Number.isFinite(o.value));
}

interface ReleaseDate {
  release_id: number;
  release_name: string;
  date: string;
}

export async function fredReleaseDates(
  releaseId: number,
  opts: { start?: string; end?: string } = {},
): Promise<ReleaseDate[]> {
  const params: Record<string, string> = {
    release_id: String(releaseId),
    sort_order: "asc",
    include_release_dates_with_no_data: "true",
  };
  if (opts.start) params.realtime_start = opts.start;
  if (opts.end) params.realtime_end = opts.end;

  const json = await fredFetch<{ release_dates: ReleaseDate[] }>("release/dates", params);
  return json?.release_dates ?? [];
}
