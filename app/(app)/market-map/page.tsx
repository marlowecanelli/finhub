import { MarketMapClient } from "@/components/market-map/market-map-client";

export const metadata = {
  title: "Market Map · FinHub",
  description: "Live treemap heatmap of S&P 500, Nasdaq 100, and Dow 30 constituents.",
};

export default async function MarketMapPage({
  searchParams,
}: {
  searchParams: Promise<{ index?: string }>;
}) {
  const params = await searchParams;
  const index = params.index ?? "sp500";
  return <MarketMapClient initialIndex={index} />;
}
