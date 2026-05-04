import { NextResponse } from "next/server";
import { fetchBenchmark, fetchDividends, fetchHistorical } from "@/lib/hindsight/data";
import { calcTimeMachine } from "@/lib/hindsight/calc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  ticker: string;
  date: string; // ISO YYYY-MM-DD
  amount: number;
  reinvestDividends?: boolean;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { ticker, date, amount } = body;
  if (!ticker || !date || !amount || amount <= 0) {
    return NextResponse.json({ error: "Missing or invalid inputs" }, { status: 400 });
  }
  const reinvest = body.reinvestDividends ?? true;

  const from = new Date(`${date}T00:00:00Z`);
  const to = new Date();
  if (isNaN(from.getTime()) || from > to) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const [prices, dividends, benchmark] = await Promise.all([
    fetchHistorical(ticker, from, to),
    fetchDividends(ticker, from, to),
    fetchBenchmark(from, to),
  ]);

  if (prices.length === 0) {
    return NextResponse.json(
      { error: `No price history for ${ticker} starting ${date}.` },
      { status: 404 }
    );
  }

  const calc = calcTimeMachine({
    amount,
    reinvestDividends: reinvest,
    prices,
    dividends,
    benchmark,
  });

  const first = prices[0]!;
  const last = prices[prices.length - 1]!;
  return NextResponse.json({
    ticker: ticker.toUpperCase(),
    startDate: first.date,
    endDate: last.date,
    amount,
    reinvestDividends: reinvest,
    ...calc,
  });
}
