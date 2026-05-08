import { NextResponse } from "next/server";
import { fetchInsiderTransactions } from "@/lib/api/research/insider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const transactions = await fetchInsiderTransactions();
    return NextResponse.json({ transactions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch insider data" },
      { status: 502 },
    );
  }
}
