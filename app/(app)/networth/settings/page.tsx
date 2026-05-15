"use client";

import { useRef, useState } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { useNetWorthStore } from "@/lib/networth/store";
import type { NetWorthState } from "@/lib/networth/types";

export default function SettingsPage() {
  const exportJSON = useNetWorthStore((s) => s.exportJSON);
  const importJSON = useNetWorthStore((s) => s.importJSON);
  const resetAll = useNetWorthStore((s) => s.resetAll);
  const snapshots = useNetWorthStore((s) => s.snapshots);
  const settings = useNetWorthStore((s) => s.settings);
  const setSettings = useNetWorthStore((s) => s.setSettings);
  const inputRef = useRef<HTMLInputElement>(null);
  const [importErr, setImportErr] = useState<string | null>(null);

  function downloadJSON() {
    const data = exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finhub-networth-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    const lines = ["date,totalAssets,totalLiabilities,netWorth,liquidNetWorth"];
    for (const s of snapshots) {
      lines.push(
        `${s.date},${s.totalAssets},${s.totalLiabilities},${s.netWorth},${s.liquidNetWorth}`
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finhub-networth-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as NetWorthState;
        if (typeof data.version !== "number") throw new Error("Bad format");
        importJSON(data);
        setImportErr(null);
        alert("Imported successfully.");
      } catch (err) {
        setImportErr(String(err));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">Your net worth data is stored locally in your browser.</p>
      </div>

      <Section title="Privacy">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-200">Default privacy mode</div>
            <div className="text-xs text-zinc-500">Blur numbers by default for screen-sharing.</div>
          </div>
          <select
            value={settings.privacyDefault}
            onChange={(e) => setSettings({ privacyDefault: e.target.value as "off" | "blurred" })}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            <option value="off">Off</option>
            <option value="blurred">Always blurred</option>
          </select>
        </div>
      </Section>

      <Section title="Data">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            onClick={downloadJSON}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            <Download className="h-4 w-4" /> Export JSON
          </button>
          <button
            onClick={downloadCSV}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 hover:bg-white/10"
          >
            <Upload className="h-4 w-4" /> Import JSON
          </button>
          <input ref={inputRef} type="file" accept="application/json" onChange={handleFile} className="hidden" />
        </div>
        {importErr && <div className="mt-2 text-sm text-rose-400">Import error: {importErr}</div>}
      </Section>

      <Section title="Danger Zone" tone="rose">
        <button
          onClick={() => {
            const a = confirm("Are you sure you want to delete ALL net worth data? This cannot be undone.");
            if (!a) return;
            const b = confirm("Final confirmation. Really delete everything?");
            if (!b) return;
            resetAll();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
        >
          <Trash2 className="h-4 w-4" /> Reset all net worth data
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "rose" }) {
  return (
    <div
      className={
        tone === "rose"
          ? "rounded-3xl border border-rose-400/20 bg-rose-950/20 p-6"
          : "rounded-3xl border border-white/5 bg-zinc-950/60 p-6"
      }
    >
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-400">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
