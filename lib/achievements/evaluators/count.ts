import type { SupabaseClient } from "@supabase/supabase-js";
import type { Requirement } from "../types";

/**
 * Returns how many events match the requirement for the given user. Used to
 * compute progress for "count" requirements, which count repeats of an event
 * (optionally filtered by payload predicates).
 */
export async function countProgress(
  db: SupabaseClient,
  userId: string,
  req: Extract<Requirement, { kind: "count" }>
): Promise<number> {
  let q = db
    .from("achievement_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", req.event);

  if (req.where) {
    for (const [k, v] of Object.entries(req.where)) {
      // jsonb @> filter via supabase contains
      q = q.contains("payload", { [k]: v });
    }
  }

  const { count, error } = await q;
  if (error) throw error;
  return Math.min(count ?? 0, req.target);
}
