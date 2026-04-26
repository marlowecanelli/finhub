import { headers } from "next/headers";
import { ScreenerClient } from "@/components/screener/screener-client";
import type { ScreenerRow } from "@/lib/screener";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadSnapshot(): Promise<{ rows: ScreenerRow[]; refreshedAt: string | null }> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return { rows: [], refreshedAt: null };
  try {
    const r = await fetch(`${proto}://${host}/api/screener`, {
      cache: "no-store",
      headers: { cookie: h.get("cookie") ?? "" },
    });
    const data = (await r.json()) as {
      rows?: ScreenerRow[];
      refreshedAt?: string;
    };
    return { rows: data.rows ?? [], refreshedAt: data.refreshedAt ?? null };
  } catch {
    return { rows: [], refreshedAt: null };
  }
}

export default async function ScreenerPage() {
  const { rows, refreshedAt } = await loadSnapshot();
  return <ScreenerClient initialRows={rows} refreshedAt={refreshedAt} />;
}
