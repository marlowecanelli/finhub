import { headers } from "next/headers";
import { MarketRecapClient } from "./market-recap-client";
import type { MarketRecap } from "@/lib/market-recap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Market Recap | FinHub",
  description: "AI-generated daily market recap — what moved, why, and what to watch tomorrow.",
};

async function loadRecap(): Promise<MarketRecap | null> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return null;
  try {
    const res = await fetch(`${proto}://${host}/api/market-recap`, {
      cache: "no-store",
      headers: { cookie: h.get("cookie") ?? "" },
    });
    const data = (await res.json()) as { recap: MarketRecap | null };
    return data.recap ?? null;
  } catch {
    return null;
  }
}

export default async function MarketRecapPage() {
  const recap = await loadRecap();
  return <MarketRecapClient initialRecap={recap} />;
}
