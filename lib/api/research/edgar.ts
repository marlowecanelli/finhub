import "server-only";
import { getOrFetch } from "@/lib/cache";

// SEC requires a descriptive User-Agent on every request
const UA = "FinHub Research finhub-self.vercel.app contact@finhub.app";

const HEADERS = {
  "User-Agent": UA,
  "Accept": "application/json",
  "Accept-Encoding": "gzip, deflate",
};

export interface EdgarFiling {
  accession: string;
  form: string;
  filedAt: string;        // ISO date
  reportDate: string;     // ISO date
  primaryDoc: string;     // URL to primary doc
  filingIndexUrl: string; // URL to filing index
  description: string;
}

export interface CompanyTicker {
  cik: string;            // padded to 10 digits
  ticker: string;
  name: string;
}

// Curated set used for the firehose page. Bigger lists hit SEC rate limits.
const FIREHOSE_TICKERS = [
  "AAPL","MSFT","NVDA","GOOGL","AMZN","META","TSLA","AVGO","BRK.B","LLY",
  "UNH","JPM","V","XOM","JNJ","WMT","MA","PG","HD","COST","ORCL","BAC",
  "ABBV","KO","CVX","MRK","PEP","NFLX","AMD","INTC","CRM","DIS","MCD",
  "BA","CAT","GS","BLK","T","NKE","PFE",
];

async function loadTickerMap(): Promise<Map<string, CompanyTicker>> {
  return getOrFetch("edgar:tickerMap", async () => {
    const res = await fetch("https://www.sec.gov/files/company_tickers.json", { headers: HEADERS });
    if (!res.ok) throw new Error(`EDGAR ticker map ${res.status}`);
    const json = await res.json() as Record<string, { cik_str: number; ticker: string; title: string }>;
    const map = new Map<string, CompanyTicker>();
    for (const v of Object.values(json)) {
      const padded = String(v.cik_str).padStart(10, "0");
      map.set(v.ticker.toUpperCase(), { cik: padded, ticker: v.ticker.toUpperCase(), name: v.title });
    }
    return map;
  }, 24 * 60 * 60 * 1000); // 24h
}

export async function tickerToCik(ticker: string): Promise<CompanyTicker | null> {
  const sym = ticker.toUpperCase().replace(".", "-"); // SEC uses BRK-B not BRK.B in their map sometimes
  const map = await loadTickerMap();
  return map.get(ticker.toUpperCase()) ?? map.get(sym) ?? null;
}

function describeForm(form: string): string {
  const map: Record<string, string> = {
    "10-K": "Annual report",
    "10-Q": "Quarterly report",
    "8-K": "Material event",
    "4": "Insider transaction (Form 4)",
    "3": "Insider initial filing (Form 3)",
    "5": "Insider annual filing (Form 5)",
    "S-1": "IPO registration",
    "S-3": "Securities registration",
    "DEF 14A": "Proxy statement",
    "SC 13G": "Beneficial ownership (passive)",
    "SC 13D": "Beneficial ownership (activist)",
    "13F-HR": "Institutional holdings",
    "144": "Notice of proposed sale",
    "6-K": "Foreign issuer report",
    "20-F": "Foreign annual report",
  };
  return map[form] || form;
}

export async function fetchRecentFilings(ticker: string, limit = 20): Promise<{ company: CompanyTicker | null; filings: EdgarFiling[] }> {
  const c = await tickerToCik(ticker);
  if (!c) return { company: null, filings: [] };

  return getOrFetch(`edgar:filings:${c.cik}:${limit}`, async () => {
    const url = `https://data.sec.gov/submissions/CIK${c.cik}.json`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`EDGAR submissions ${res.status}`);
    const j = await res.json() as {
      recent?: {
        accessionNumber: string[]; form: string[]; filingDate: string[];
        reportDate: string[]; primaryDocument: string[]; primaryDocDescription: string[];
      };
      filings?: {
        recent: {
          accessionNumber: string[]; form: string[]; filingDate: string[];
          reportDate: string[]; primaryDocument: string[]; primaryDocDescription: string[];
        };
      };
    };

    const recent = j.filings?.recent ?? j.recent;
    if (!recent) return { company: c, filings: [] };

    const out: EdgarFiling[] = [];
    const n = Math.min(recent.accessionNumber.length, limit);
    for (let i = 0; i < n; i++) {
      const accession = recent.accessionNumber[i];
      const form = recent.form[i];
      const filed = recent.filingDate[i];
      const primary = recent.primaryDocument[i];
      if (!accession || !form || !filed || !primary) continue;
      const accNo = accession.replace(/-/g, "");
      out.push({
        accession,
        form,
        filedAt: filed,
        reportDate: recent.reportDate[i] || filed,
        primaryDoc: `https://www.sec.gov/Archives/edgar/data/${parseInt(c.cik, 10)}/${accNo}/${primary}`,
        filingIndexUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${c.cik}&type=&dateb=&owner=include&count=40`,
        description: recent.primaryDocDescription[i] || describeForm(form),
      });
    }
    return { company: c, filings: out };
  }, 10 * 60 * 1000); // 10 min
}

export interface FirehoseFiling extends EdgarFiling {
  ticker: string;
  companyName: string;
}

export async function fetchFirehose(forms: string[] = ["8-K", "10-K", "10-Q"]): Promise<FirehoseFiling[]> {
  return getOrFetch(`edgar:firehose:${forms.join(",")}`, async () => {
    const all: FirehoseFiling[] = [];
    // Run in small batches to avoid SEC rate limit (10 req/sec)
    const batchSize = 5;
    for (let i = 0; i < FIREHOSE_TICKERS.length; i += batchSize) {
      const batch = FIREHOSE_TICKERS.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(async t => {
        try {
          const { company, filings } = await fetchRecentFilings(t, 20);
          if (!company) return [];
          return filings
            .filter(f => forms.includes(f.form))
            .map(f => ({ ...f, ticker: company.ticker, companyName: company.name } as FirehoseFiling));
        } catch {
          return [];
        }
      }));
      results.forEach(r => all.push(...r));
      await new Promise(r => setTimeout(r, 120));
    }
    all.sort((a, b) => b.filedAt.localeCompare(a.filedAt));
    return all.slice(0, 100);
  }, 5 * 60 * 1000);
}
