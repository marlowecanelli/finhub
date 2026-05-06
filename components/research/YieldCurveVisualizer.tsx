"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid, ReferenceLine, LineChart, Line, Legend,
} from "recharts";
import { mockYieldCurve } from "@/lib/api/research/macro";
import type { YieldPoint } from "@/lib/types/research";

function generateHistoricalCurves() {
  const recession2001: YieldPoint[] = [
    { maturity: "1M", months: 1, yield: 5.82 },
    { maturity: "3M", months: 3, yield: 5.59 },
    { maturity: "6M", months: 6, yield: 5.28 },
    { maturity: "1Y", months: 12, yield: 5.02 },
    { maturity: "2Y", months: 24, yield: 4.71 },
    { maturity: "5Y", months: 60, yield: 4.89 },
    { maturity: "10Y", months: 120, yield: 5.16 },
    { maturity: "30Y", months: 360, yield: 5.48 },
  ];
  const recession2008: YieldPoint[] = [
    { maturity: "1M", months: 1, yield: 3.22 },
    { maturity: "3M", months: 3, yield: 3.08 },
    { maturity: "6M", months: 6, yield: 2.89 },
    { maturity: "1Y", months: 12, yield: 2.51 },
    { maturity: "2Y", months: 24, yield: 2.34 },
    { maturity: "5Y", months: 60, yield: 3.02 },
    { maturity: "10Y", months: 120, yield: 3.71 },
    { maturity: "30Y", months: 360, yield: 4.24 },
  ];
  const recession2020: YieldPoint[] = [
    { maturity: "1M", months: 1, yield: 0.08 },
    { maturity: "3M", months: 3, yield: 0.11 },
    { maturity: "6M", months: 6, yield: 0.14 },
    { maturity: "1Y", months: 12, yield: 0.15 },
    { maturity: "2Y", months: 24, yield: 0.18 },
    { maturity: "5Y", months: 60, yield: 0.44 },
    { maturity: "10Y", months: 120, yield: 0.72 },
    { maturity: "30Y", months: 360, yield: 1.47 },
  ];
  return { recession2001, recession2008, recession2020 };
}

function computeSpread(curve: YieldPoint[]): number {
  const y10 = curve.find(p => p.maturity === "10Y")?.yield ?? 0;
  const y2  = curve.find(p => p.maturity === "2Y")?.yield ?? 0;
  return parseFloat((y10 - y2).toFixed(3));
}

function nyFedRecessionProb(spread: number): number {
  const beta0 = -0.5333;
  const beta1 = -0.6330;
  const logit = beta0 + beta1 * spread;
  return parseFloat((1 / (1 + Math.exp(-logit)) * 100).toFixed(1));
}

export function YieldCurveVisualizer() {
  const today = mockYieldCurve();
  const hist = generateHistoricalCurves();

  const [showHistorical, setShowHistorical] = useState(false);

  const spread = computeSpread(today);
  const recProb = nyFedRecessionProb(spread);

  const maturityOrder = ["1M","3M","6M","1Y","2Y","3Y","5Y","7Y","10Y","20Y","30Y"];

  const chartData = maturityOrder.map(m => {
    const pt = today.find(p => p.maturity === m);
    const h01 = hist.recession2001.find(p => p.maturity === m);
    const h08 = hist.recession2008.find(p => p.maturity === m);
    const h20 = hist.recession2020.find(p => p.maturity === m);
    return {
      maturity: m,
      today: pt?.yield ?? null,
      r2001: h01?.yield ?? null,
      r2008: h08?.yield ?? null,
      r2020: h20?.yield ?? null,
    };
  });

  return (
    <div
      className="rounded-lg p-5 space-y-5"
      style={{ background: "#141720", border: "1px solid #1E2130" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#C8D0E7]">US Treasury Yield Curve</h3>
          <p className="text-xs text-[#717A94] mt-0.5">Live yields vs historical recession onsets</p>
        </div>
        <button
          onClick={() => setShowHistorical(h => !h)}
          className="text-[10px] font-mono rounded px-2 py-1 transition-all"
          style={{
            background: showHistorical ? "#00D4FF15" : "#1E2130",
            color: showHistorical ? "#00D4FF" : "#717A94",
            border: `1px solid ${showHistorical ? "#00D4FF30" : "#2A2F42"}`,
          }}
        >
          {showHistorical ? "Hide" : "Show"} Historical
        </button>
      </div>

      {/* Spread + Recession prob */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg p-3" style={{ background: "#0D0F14", border: "1px solid #1E2130" }}>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block">10Y-2Y Spread</span>
          <span
            className="text-2xl font-mono font-bold mt-1 block"
            style={{ color: spread < 0 ? "#FF4545" : "#39FF14" }}
          >
            {spread > 0 ? "+" : ""}{spread.toFixed(2)}%
          </span>
          {spread < 0 && (
            <span className="text-[10px] text-[#FF4545] font-mono">INVERTED</span>
          )}
        </div>
        <div className="rounded-lg p-3" style={{ background: "#0D0F14", border: "1px solid #1E2130" }}>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block">Rec. Probability</span>
          <span
            className="text-2xl font-mono font-bold mt-1 block"
            style={{ color: recProb > 50 ? "#FF4545" : recProb > 30 ? "#FFB347" : "#00C896" }}
          >
            {recProb}%
          </span>
          <span className="text-[10px] text-[#3A3F52] font-mono">NY Fed Model</span>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#0D0F14", border: "1px solid #1E2130" }}>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block">Fed Funds Rate</span>
          <span className="text-2xl font-mono font-bold mt-1 block" style={{ color: "#39FF14" }}>5.33%</span>
          <span className="text-[10px] text-[#3A3F52] font-mono">Effective Rate</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="maturity" tick={{ fill: "#717A94", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#717A94", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              contentStyle={{ background: "#0D0F14", border: "1px solid #1E2130", borderRadius: 6, fontSize: 11 }}
              labelStyle={{ color: "#717A94" }}
              formatter={(v: number, name: string) => {
                const LABELS: Record<string, string> = { today: "Today", r2001: "2001 Recession", r2008: "2008 Recession", r2020: "2020 Recession" };
                return [v !== null ? `${v.toFixed(2)}%` : "N/A", LABELS[name] ?? name];
              }}
            />
            <ReferenceLine y={0} stroke="#3A3F52" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="today" stroke="#00D4FF" strokeWidth={2.5} dot={{ fill: "#00D4FF", r: 3 }} name="today" />
            {showHistorical && <>
              <Line type="monotone" dataKey="r2001" stroke="#FF454540" strokeWidth={1} strokeDasharray="5 3" dot={false} name="r2001" />
              <Line type="monotone" dataKey="r2008" stroke="#FFB34740" strokeWidth={1} strokeDasharray="5 3" dot={false} name="r2008" />
              <Line type="monotone" dataKey="r2020" stroke="#39FF1440" strokeWidth={1} strokeDasharray="5 3" dot={false} name="r2020" />
            </>}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-[#3A3F52] font-mono">
        Source: US Treasury · NY Fed Recession Probability Model (Estrella & Mishkin, 1996)
      </p>
    </div>
  );
}
