import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ScreenerTable } from "./components/ScreenerTable";
import { Disclaimer } from "@/components/buffett/Disclaimer";
import type { ScreenerRow } from "@/lib/buffett/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Buffett Screener · FinHub",
  description:
    "S&P 500 ranked by adherence to Warren Buffett's investing principles. Filter by sector, market cap, dividend yield, and Buffett Score.",
};

async function getScreenerData(): Promise<{ rows: ScreenerRow[]; updatedAt: string | null }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { rows: [], updatedAt: null };

  const { data, error } = await admin
    .from("buffett_screener_results")
    .select("ticker, company_name, sector, market_cap, dividend_yield, overall, label, payload, updated_at")
    .order("overall", { ascending: false });

  if (error || !data) return { rows: [], updatedAt: null };

  const rows = data as ScreenerRow[];
  const updatedAt = rows.length > 0 ? (rows[0]?.updated_at ?? null) : null;
  return { rows, updatedAt };
}

export default async function BuffettScreenerPage() {
  const { rows, updatedAt } = await getScreenerData();

  const isEmpty = rows.length === 0;

  return (
    <div className="min-h-screen bg-[#F7F3EC] dark:bg-[#100E0C]">
      {/* Editorial header */}
      <header className="border-b border-[#D9D2C2]/60 bg-[#F7F3EC] dark:border-[#2A2520] dark:bg-[#100E0C]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-0 md:py-14">
          <p className="editorial-eyebrow text-[#B08A3E]">Value Investing</p>
          <h1 className="font-display mt-2 text-4xl font-semibold leading-tight text-[#1A1814] dark:text-[#F7F3EC] md:text-5xl">
            The Buffett Screener.
          </h1>
          <p className="mt-3 font-serif text-[1rem] italic text-[#1A1814]/60 dark:text-[#F7F3EC]/50 md:text-[1.1rem]">
            S&P 500 ranked by adherence to the principles of Warren Buffett.
          </p>
          {updatedAt && (
            <p className="mt-4 font-sans text-[0.72rem] text-[#1A1814]/35 dark:text-[#F7F3EC]/25">
              Last updated:{" "}
              {new Date(updatedAt).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="pb-16">
        {isEmpty ? (
          <div className="mx-auto max-w-7xl px-4 py-20 text-center md:px-0">
            <p className="font-display text-2xl font-semibold text-[#1A1814]/40 dark:text-[#F7F3EC]/30">
              Scores not yet computed.
            </p>
            <p className="mt-3 font-serif text-[0.9rem] italic text-[#1A1814]/35 dark:text-[#F7F3EC]/25">
              The nightly cron job populates this screener. Run{" "}
              <code className="font-mono text-[0.85rem]">
                GET /api/cron/buffett-screener?dry_run=1
              </code>{" "}
              to seed with a sample of 10 stocks.
            </p>
          </div>
        ) : (
          <ScreenerTable rows={rows} updatedAt={updatedAt} />
        )}
      </main>

      {/* Footer disclaimer */}
      <footer className="border-t border-[#D9D2C2]/40 dark:border-[#2A2520] bg-[#F7F3EC] dark:bg-[#100E0C] px-4 py-6 md:px-0">
        <div className="mx-auto max-w-7xl">
          <Disclaimer />
        </div>
      </footer>
    </div>
  );
}
