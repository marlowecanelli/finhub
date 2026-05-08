import type { SupabaseClient } from "@supabase/supabase-js";
import type { Requirement } from "../types";

/**
 * Counts distinct values of payload[key] across the user's events of one
 * type. We pull the values and dedupe in memory because Supabase REST does
 * not expose `count(distinct)`. For large catalogs this stays cheap because
 * the query is indexed on (user_id, event_type) and we only need
 * payload->>key.
 */
export async function distinctProgress(
  db: SupabaseClient,
  userId: string,
  req: Extract<Requirement, { kind: "distinct" }>
): Promise<number> {
  let q = db
    .from("achievement_events")
    .select("payload")
    .eq("user_id", userId)
    .eq("event_type", req.event)
    .limit(5000);

  if (req.where) {
    for (const [k, v] of Object.entries(req.where)) {
      q = q.contains("payload", { [k]: v });
    }
  }

  const { data, error } = await q;
  if (error) throw error;

  const seen = new Set<string>();
  for (const row of data ?? []) {
    const payload = (row as { payload: Record<string, unknown> | null }).payload;
    const v = payload?.[req.key];
    if (typeof v === "string") seen.add(v.toUpperCase());
    else if (typeof v === "number") seen.add(String(v));
  }
  return Math.min(seen.size, req.target);
}
