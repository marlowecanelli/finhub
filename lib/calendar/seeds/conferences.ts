import type { CalendarEventInput } from "../types";

type Conf = {
  date: string;
  title: string;
  organizer: string;
  ticker?: string;
  description: string;
  importance?: "high" | "medium" | "critical";
  url?: string;
};

const CONFERENCES: Conf[] = [
  { date: "2026-06-08", title: "Apple WWDC 2026 Keynote", organizer: "Apple", ticker: "AAPL", description: "Annual developer conference; software roadmap and hardware unveils.", importance: "high", url: "https://developer.apple.com/wwdc" },
  { date: "2026-03-17", title: "NVIDIA GTC 2026", organizer: "NVIDIA", ticker: "NVDA", description: "GPU/AI keynote, often a major catalyst for the AI complex.", importance: "critical" },
  { date: "2026-01-07", title: "CES 2026 opens", organizer: "CTA", description: "Consumer electronics megashow — semis, autos, devices.", importance: "high" },
  { date: "2026-05-19", title: "Microsoft Build 2026", organizer: "Microsoft", ticker: "MSFT", description: "Developer conference; Azure, Copilot, AI roadmap.", importance: "high" },
  { date: "2026-09-29", title: "Microsoft Ignite 2026", organizer: "Microsoft", ticker: "MSFT", description: "Enterprise/IT conference — security, Azure, M365.", importance: "high" },
  { date: "2026-05-04", title: "Berkshire Hathaway Annual Meeting", organizer: "Berkshire Hathaway", ticker: "BRK-B", description: "Buffett & Munger Q&A; macro and capital allocation tells.", importance: "high" },
  { date: "2026-10-13", title: "Tesla AI Day", organizer: "Tesla", ticker: "TSLA", description: "Autonomy, Optimus, and Dojo updates.", importance: "high" },
  { date: "2026-09-09", title: "Apple iPhone Event", organizer: "Apple", ticker: "AAPL", description: "Annual hardware unveil; iPhone, Watch, sometimes AirPods.", importance: "high" },
  { date: "2026-10-06", title: "Google Cloud Next '26", organizer: "Google", ticker: "GOOGL", description: "Cloud and AI product announcements.", importance: "medium" },
  { date: "2026-11-30", title: "AWS re:Invent 2026", organizer: "Amazon", ticker: "AMZN", description: "AWS marquee event; new services and chip launches.", importance: "high" },
  { date: "2026-08-21", title: "Jackson Hole Economic Symposium", organizer: "KC Fed", description: "Central bankers' annual; Fed Chair speech moves rates.", importance: "critical" },
  { date: "2026-10-15", title: "IMF/World Bank Annual Meetings", organizer: "IMF", description: "Global finance ministers and central bankers convene.", importance: "medium" },
  { date: "2026-09-15", title: "Goldman Sachs Communacopia + Tech Conference", organizer: "Goldman Sachs", description: "Major TMT investor conference; many CEO appearances.", importance: "medium" },
];

export function conferenceEvents(): CalendarEventInput[] {
  return CONFERENCES.map((c) => ({
    event_type: "conference",
    ticker: c.ticker ?? null,
    title: c.title,
    description: c.description,
    event_date: new Date(`${c.date}T13:00:00.000Z`).toISOString(),
    timing: "all_day",
    importance: c.importance ?? "medium",
    metadata: {
      kind: "conference",
      organizer: c.organizer,
      url: c.url ?? null,
      location: null,
    },
    source: "seed:conferences",
    external_id: `conf-${c.date}-${c.title.replace(/\s+/g, "_").slice(0, 40)}`,
  }));
}
