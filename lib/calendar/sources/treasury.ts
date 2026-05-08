import type { CalendarEventInput, TreasuryMetadata } from "../types";

type TreasuryAuctionRow = {
  cusip: string;
  securityType: string; // "Note", "Bond", "Bill", "TIPS", "FRN"
  securityTerm: string; // "10-Year", "30-Year", etc.
  auctionDate: string; // YYYY-MM-DD
  issueDate: string;
  offeringAmount: string; // dollars
};

const URL =
  "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/upcoming_auctions?sort=-auction_date&page[size]=100";

function instrumentFor(term: string, type: string):
  TreasuryMetadata["instrument"] | null {
  const t = term.toLowerCase();
  const ty = type.toLowerCase();
  if (ty.includes("tips")) return "TIPS";
  if (ty.includes("frn")) return "FRN";
  if (t.startsWith("2-")) return "2Y";
  if (t.startsWith("3-")) return "3Y";
  if (t.startsWith("5-")) return "5Y";
  if (t.startsWith("7-")) return "7Y";
  if (t.startsWith("10-")) return "10Y";
  if (t.startsWith("20-")) return "20Y";
  if (t.startsWith("30-")) return "30Y";
  return null;
}

export async function fetchTreasuryAuctions(): Promise<CalendarEventInput[]> {
  try {
    const res = await fetch(URL, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: TreasuryAuctionRow[] };
    const rows = json.data ?? [];
    const out: CalendarEventInput[] = [];
    for (const r of rows) {
      const inst = instrumentFor(r.securityTerm, r.securityType);
      if (!inst) continue;
      // Exclude bills (covered separately if desired). Focus on notes/bonds/TIPS.
      const ymd = r.auctionDate;
      const eventDate = new Date(`${ymd}T18:00:00.000Z`); // ~1pm ET
      out.push({
        event_type: "treasury",
        ticker: null,
        title: `${r.securityTerm} ${r.securityType} auction`,
        description: `US Treasury auction (${r.cusip}). Settlement ${r.issueDate}.`,
        event_date: eventDate.toISOString(),
        timing: "dmh",
        importance: inst === "10Y" || inst === "30Y" ? "high" : "medium",
        metadata: {
          kind: "treasury",
          instrument: inst,
          amount: r.offeringAmount ? Number(r.offeringAmount) : null,
        },
        source: "treasury:auctions",
        external_id: `treasury-${r.cusip}`,
      });
    }
    return out;
  } catch {
    return [];
  }
}
