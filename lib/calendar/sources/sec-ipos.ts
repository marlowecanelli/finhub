import type { CalendarEventInput } from "../types";

/**
 * Lightweight SEC EDGAR S-1 filings reader. Returns recently filed S-1s as
 * "filed" status IPO events; pricing/trading dates aren't in EDGAR so we treat
 * the filing date as the surface and let a curated source (or manual entry)
 * upgrade them to "priced"/"trading" later.
 *
 * EDGAR JSON: https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=S-1&output=atom
 * We use the JSON full-text search endpoint instead for stability.
 */
const SEARCH_URL =
  "https://efts.sec.gov/LATEST/search-index?q=%22registration+statement%22&dateRange=custom&forms=S-1&startdt=__START__&enddt=__END__";

type Hit = {
  _id: string;
  _source: {
    display_names?: string[];
    form?: string;
    file_date?: string;
    adsh?: string;
  };
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function fetchSecIpoFilings(): Promise<CalendarEventInput[]> {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 1000 * 60 * 60 * 24 * 30);
    const url = SEARCH_URL.replace("__START__", ymd(start)).replace("__END__", ymd(end));
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FinHub Calendar finhub@example.com",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { hits?: { hits?: Hit[] } };
    const hits = json.hits?.hits ?? [];
    const out: CalendarEventInput[] = [];
    for (const h of hits.slice(0, 60)) {
      const name = h._source.display_names?.[0]?.split("(")[0]?.trim();
      const filed = h._source.file_date;
      if (!name || !filed) continue;
      const eventDate = new Date(`${filed}T13:00:00.000Z`);
      out.push({
        event_type: "ipo",
        ticker: null,
        title: `${name} files S-1`,
        description: `${name} filed an S-1 registration with the SEC; expected pricing TBD.`,
        event_date: eventDate.toISOString(),
        timing: "all_day",
        importance: "medium",
        metadata: {
          kind: "ipo",
          status: "filed",
          expectedTicker: null,
          priceLow: null,
          priceHigh: null,
          sharesOffered: null,
          dealSize: null,
          underwriters: [],
          sector: null,
        },
        source: "sec:s1",
        external_id: `s1-${h._id}`,
      });
    }
    return out;
  } catch {
    return [];
  }
}
