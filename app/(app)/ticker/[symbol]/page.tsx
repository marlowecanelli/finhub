import { notFound } from "next/navigation";
import { getTickerSummary } from "@/lib/yahoo";
import { TickerHeader } from "@/components/ticker/ticker-header";
import { PriceChart } from "@/components/ticker/price-chart";
import { KeyStats } from "@/components/ticker/key-stats";
import { AiAnalysisCard } from "@/components/ticker/ai-analysis-card";
import { CompanyOverview } from "@/components/ticker/company-overview";
import { FinancialHighlights } from "@/components/ticker/financial-highlights";
import { NewsSection } from "@/components/ticker/news-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = { params: { symbol: string } };

export async function generateMetadata({ params }: PageProps) {
  const sym = params.symbol.toUpperCase();
  return {
    title: `${sym} · FinHub`,
    description: `Deep dive on ${sym}: price history, key stats, AI analysis, and news.`,
  };
}

export default async function TickerPage({ params }: PageProps) {
  const symbol = params.symbol.toUpperCase();

  let summary;
  try {
    summary = await getTickerSummary(symbol);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <TickerHeader quote={summary.quote} />

      <PriceChart symbol={symbol} currency={summary.quote.currency} />

      <KeyStats stats={summary.stats} currency={summary.quote.currency} />

      <AiAnalysisCard symbol={symbol} />

      <CompanyOverview profile={summary.profile} />

      <FinancialHighlights
        data={summary.financialsQuarterly}
        currency={summary.quote.currency}
      />

      <NewsSection symbol={symbol} />
    </div>
  );
}
