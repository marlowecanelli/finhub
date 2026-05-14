"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ExternalLink, RefreshCw } from "lucide-react";

interface FirehoseFiling {
  accession: string;
  form: string;
  filedAt: string;
  primaryDoc: string;
  description: string;
  ticker: string;
  companyName: string;
}

const FORM_GROUPS = [
  { id: "8-K",   label: "Material Events (8-K)", forms: ["8-K"] },
  { id: "10-Q",  label: "Quarterly (10-Q)",      forms: ["10-Q"] },
  { id: "10-K",  label: "Annual (10-K)",         forms: ["10-K"] },
  { id: "ALL",   label: "All",                   forms: ["8-K","10-Q","10-K"] },
];

const FORM_COLORS: Record<string, string> = {
  "10-K": "#A78BFA",
  "10-Q": "#00D4FF",
  "8-K":  "#FFB347",
};

export default function SecFilingsPage() {
  const [active, setActive] = useState<string>("ALL");
  const [filings, setFilings] = useState<FirehoseFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLoad, setLastLoad] = useState<Date | null>(null);

  async function load(group: string) {
    setLoading(true);
    try {
      const forms = FORM_GROUPS.find(g => g.id === group)?.forms ?? ["8-K","10-Q","10-K"];
      const res = await fetch(`/api/research/edgar?forms=${forms.join(",")}`);
      const json = await res.json();
      setFilings(json.filings ?? []);
      setLastLoad(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(active); }, [active]);

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">SEC Filings Firehose</h1>
          <p className="text-xs text-[#717A94] mt-1">Live filings from EDGAR — material events, quarterly and annual reports across 40 large-caps</p>
        </div>
        <button
          onClick={() => load(active)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-[11px] font-mono uppercase tracking-widest text-[#C8D0E7] bg-[#141720] border border-[#1E2130] hover:border-[#00D4FF]"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FORM_GROUPS.map(g => {
          const isActive = active === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setActive(g.id)}
              className={`px-3 py-1.5 rounded-sm text-[11px] font-mono uppercase tracking-wider transition-colors ${
                isActive ? "text-[#0D0F14] bg-[#00D4FF]" : "text-[#717A94] bg-[#141720] border border-[#1E2130] hover:text-[#C8D0E7]"
              }`}
            >
              {g.label}
            </button>
          );
        })}
        {lastLoad && (
          <span className="ml-auto text-[10px] font-mono text-[#3A3F52]">
            Updated {lastLoad.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "#141720", border: "1px solid #1E2130" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "#1E2130" }}>
          <FileText size={13} className="text-[#FFB347]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">
            {loading ? "Loading…" : `${filings.length} filings`}
          </span>
        </div>

        {loading && filings.length === 0 ? (
          <div className="p-8 text-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 mb-2 research-shimmer rounded" />
            ))}
          </div>
        ) : filings.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#717A94]">No filings found.</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">
                <th className="text-left px-4 py-2 w-20">Form</th>
                <th className="text-left px-4 py-2 w-32">Ticker</th>
                <th className="text-left px-4 py-2">Company / Description</th>
                <th className="text-right px-4 py-2 w-32">Filed</th>
                <th className="text-right px-4 py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filings.map(f => {
                const color = FORM_COLORS[f.form] ?? "#717A94";
                return (
                  <tr key={`${f.ticker}-${f.accession}`} className="border-t hover:bg-[#1E2130]/40 transition-colors" style={{ borderColor: "#1E2130" }}>
                    <td className="px-4 py-2">
                      <span className="inline-block rounded px-2 py-0.5 font-mono text-[10px] font-bold"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        {f.form}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/research/deep-dive?ticker=${f.ticker}`} className="font-mono font-semibold text-[#C8D0E7] hover:text-[#00D4FF]">
                        {f.ticker}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-[#C8D0E7]">{f.companyName}</div>
                      <div className="text-[10px] text-[#717A94]">{f.description}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[#717A94]">
                      {new Date(f.filedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <a href={f.primaryDoc} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-[#00D4FF] hover:underline">
                        Open <ExternalLink size={9} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-[10px] text-[#3A3F52] font-mono">
        Source: SEC EDGAR · data.sec.gov · Public domain · No API key required
      </div>
    </div>
  );
}
