import { CalendarClient } from "@/components/calendar/calendar-client";
import { createServerSupabase } from "@/lib/supabase-server";
import { getWatchlistTickers } from "@/lib/calendar/repo";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Calendar — FinHub",
  description: "Earnings, dividends, FOMC, IPOs, OPEX, treasury auctions — every market-moving event in one place.",
};

export default async function CalendarPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  let watchlistCount = 0;
  if (user) {
    const tickers = await getWatchlistTickers(supabase, user.id);
    watchlistCount = tickers.length;
  }
  return <CalendarClient hasWatchlist={watchlistCount > 0} authed={!!user} />;
}
