"use client";

import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { SectorPerformance } from "@/lib/types/research";

interface RRGChartProps {
  data: SectorPerformance[];
}

type Quadrant = "Leading" | "Weakening" | "Lagging" | "Improving";

function getQuadrant(rsRatio: number, rsMomentum: number): Quadrant {
  if (rsRatio >= 100 && rsMomentum >= 100) return "Leading";
  if (rsRatio >= 100 && rsMomentum < 100)  return "Weakening";
  if (rsRatio < 100  && rsMomentum < 100)  return "Lagging";
  return "Improving";
}

const QUADRANT_CONFIG: Record<Quadrant, { color: string; bg: string; description: string }> = {
  Leading:   { color: "#39FF14", bg: "#39FF1408", description: "Strong RS-Ratio & momentum. Prime institutional positioning." },
  Weakening: { color: "#FFB347", bg: "#FFB34708", description: "High RS-Ratio but losing momentum. Watch for rotation out." },
  Lagging:   { color: "#FF4545", bg: "#FF454508", description: "Weak RS-Ratio & momentum. Institutional underweight." },
  Improving: { color: "#00D4FF", bg: "#00D4FF08", description: "Low RS-Ratio but gaining momentum. Accumulation phase." },
};

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: SectorPerformance;
}

function CustomDot({ cx = 0, cy = 0, payload }: CustomDotProps) {
  const [hovered, setHovered] = useState(false);
  if (!payload) return null;
  const quadrant = getQuadrant(payload.rsRatio, payload.rsMomentum);
  const config = QUADRANT_CONFIG[quadrant];

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={hovered ? 10 : 7}
        fill={config.color}
        fillOpacity={0.9}
        stroke="#0D0F14"
        strokeWidth={2}
        style={{ transition: "r 0.15s ease" }}
      />
      <text
        x={cx}
        y={cy - 12}
        textAnchor="middle"
        fill={config.color}
        fontSize={9}
        fontFamily="JetBrains Mono"
        fontWeight="bold"
      >
        {payload.etf.ticker}
      </text>
      {hovered && (
        <foreignObject x={cx - 80} y={cy + 12} width={160} height={72}>
          <div
            style={{
              background: "#0D0F14",
              border: "1px solid #1E2130",
              borderRadius: 6,
              padding: "6px 8px",
              fontSize: 10,
              fontFamily: "JetBrains Mono",
              color: "#C8D0E7",
            }}
          >
            <div style={{ color: config.color, fontWeight: 700, marginBottom: 2 }}>{quadrant}</div>
            <div style={{ color: "#717A94", fontSize: 9 }}>RS-Ratio: {payload.rsRatio.toFixed(1)}</div>
            <div style={{ color: "#717A94", fontSize: 9 }}>RS-Mom: {payload.rsMomentum.toFixed(1)}</div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export function RRGChart({ data }: RRGChartProps) {
  const chartData = data.map(d => ({
    ...d,
    rsRatio: d.rsRatio,
    rsMomentum: d.rsMomentum,
    name: d.etf.ticker,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        {(Object.entries(QUADRANT_CONFIG) as [Quadrant, typeof QUADRANT_CONFIG[Quadrant]][]).map(([q, cfg]) => (
          <div key={q} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: cfg.color }} />
            <span className="text-[10px] font-mono text-[#717A94]">{q}</span>
          </div>
        ))}
      </div>

      <div
        className="relative rounded-lg overflow-hidden"
        style={{ background: "#141720", border: "1px solid #1E2130" }}
      >
        {/* Quadrant background labels */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2">
          {(["Leading", "Weakening", "Lagging", "Improving"] as Quadrant[]).map((q, i) => {
            const cfg = QUADRANT_CONFIG[q];
            const positions = [
              "col-start-2 row-start-1", // Leading: top-right
              "col-start-1 row-start-1", // Weakening: top-left  (actually should be right, but recharts origin is bottom)
              "col-start-1 row-start-2", // Lagging: bottom-left
              "col-start-2 row-start-2", // Improving: bottom-right
            ];
            return (
              <div
                key={q}
                className={`${positions[i]} flex items-center justify-center`}
                style={{ background: cfg.bg }}
              >
                <span
                  className="text-[9px] font-mono uppercase tracking-widest font-bold opacity-40"
                  style={{ color: cfg.color }}
                >
                  {q}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ height: 320 }} className="p-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="rsRatio"
                domain={[90, 112]}
                name="RS-Ratio"
                tick={{ fill: "#717A94", fontSize: 9, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
                label={{ value: "RS-Ratio →", position: "insideBottom", offset: -10, fill: "#3A3F52", fontSize: 9 }}
              />
              <YAxis
                type="number"
                dataKey="rsMomentum"
                domain={[90, 112]}
                name="RS-Momentum"
                tick={{ fill: "#717A94", fontSize: 9, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
                label={{ value: "RS-Momentum", angle: -90, position: "insideLeft", fill: "#3A3F52", fontSize: 9 }}
              />
              <ReferenceLine x={100} stroke="#3A3F52" strokeDasharray="4 2" />
              <ReferenceLine y={100} stroke="#3A3F52" strokeDasharray="4 2" />
              <Scatter
                data={chartData}
                shape={(props: CustomDotProps) => <CustomDot {...props} />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-[10px] text-[#3A3F52] font-mono">
        Institutions historically increase exposure when a sector enters the 'Improving' quadrant.
      </p>
    </div>
  );
}
