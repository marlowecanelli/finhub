import { headers } from "next/headers";
import { MarketRecapClient } from "./market-recap-client";
import type { MarketRecap, RecapSummary } from "@/lib/market-recap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Market Recap | FinHub",
  description: "AI-generated daily market recap — what moved, why, and what to watch tomorrow.",
};

function baseUrl() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const cookie = h.get("cookie") ?? "";
  return { base: `${proto}://${host}`, cookie };
}

async function loadRecap(): Promise<MarketRecap | null> {
  const { base, cookie } = baseUrl();
  if (!base || base === "http://") return null;
  try {
    const res = await fetch(`${base}/api/market-recap`, {
      cache: "no-store",
      headers: { cookie },
    });
    const data = (await res.json()) as { recap: MarketRecap | null };
    return data.recap ?? null;
  } catch {
    return null;
  }
}

async function loadArchive(): Promise<RecapSummary[]> {
  const { base, cookie } = baseUrl();
  if (!base || base === "http://") return [];
  try {
    const res = await fetch(`${base}/api/market-recap/archive`, {
      cache: "no-store",
      headers: { cookie },
    });
    const data = (await res.json()) as { archive: RecapSummary[] };
    return data.archive ?? [];
  } catch {
    return [];
  }
}

export default async function MarketRecapPage() {
  const [recap, archive] = await Promise.all([loadRecap(), loadArchive()]);
  return <MarketRecapClient initialRecap={recap} initialArchive={archive} />;
}
