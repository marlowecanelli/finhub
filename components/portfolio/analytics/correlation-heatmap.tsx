"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = { symbols: string[]; matrix: number[][] };

function corrColor(c: number): string {
  if (c >= 0) {
    const t = Math.min(1, c);
    const r = 245;
    const g = Math.round(180 - 60 * t);
    const b = Math.round(60 + 20 * (1 - t));
    return "rgba(" + r + "," + g + "," + b + "," + (0.15 + 0.55 * t) + ")";
  }
  const t = Math.min(1, -c);
  const r = Math.round(56 + 20 * (1 - t));
  const g = 189;
  const b = 248;
  return "rgba(" + r + "," + g + "," + b + "," + (0.15 + 0.55 * t) + ")";
}

export function CorrelationHeatmap({ symbols, matrix }: Props) {
  const [hover, setHover] = React.useState<{ i: number; j: number } | null>(null);
  const n = symbols.length;

  if (n < 2) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-border/60 bg-card/40 p-5 text-center text-xs text-muted-foreground backdrop-blur-xl">
        <p>Add at least two holdings to see correlations.</p>
      </div>
    );
  }

  let avgOff = 0;
  let cnt = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        avgOff += matrix[i]![j]!;
        cnt++;
      }
    }
  }
  avgOff = cnt > 0 ? avgOff / cnt : 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-medium tracking-tight">Correlation Matrix</h3>
          <p className="mt-1 text-xs text-muted-foreground">Lower correlations = more diversification benefit</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Avg Pairwise</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{avgOff.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th className="bg-transparent" />
              {symbols.map((s, j) => (
                <th
                  key={s}
                  className={cn("px-1 py-1 text-center font-mono text-[10px] font-medium text-muted-foreground transition-colors", hover?.j === j && "text-foreground")}
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map((rowSym, i) => (
              <tr key={rowSym}>
                <th className={cn("px-2 py-1 text-right font-mono text-[10px] font-medium text-muted-foreground transition-colors", hover?.i === i && "text-foreground")}>
                  {rowSym}
                </th>
                {symbols.map((_, j) => {
                  const c = matrix[i]![j]!;
                  return (
                    <td
                      key={j}
                      onMouseEnter={() => setHover({ i, j })}
                      onMouseLeave={() => setHover(null)}
                      className={cn(
                        "rounded-sm text-center font-mono text-[10px] font-medium tabular-nums transition-all",
                        i === j ? "text-foreground/70" : "text-foreground/85",
                        hover?.i === i && hover?.j === j && "ring-1 ring-inset ring-foreground/40"
                      )}
                      style={{ backgroundColor: corrColor(c), minWidth: 36, height: 28 }}
                    >
                      {i === j ? "1.00" : c.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hover && (
        <p className="mt-3 font-mono text-[10px] text-muted-foreground">
          {symbols[hover.i]} - {symbols[hover.j]} = <span className="font-semibold text-foreground">{matrix[hover.i]![hover.j]!.toFixed(3)}</span>
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Scale</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-sm">
          {Array.from({ length: 21 }).map((_, k) => {
            const c = -1 + (k / 20) * 2;
            return <div key={k} className="flex-1" style={{ backgroundColor: corrColor(c) }} />;
          })}
        </div>
        <div className="flex w-32 justify-between font-mono text-[9px] text-muted-foreground">
          <span>-1</span>
          <span>0</span>
          <span>+1</span>
        </div>
      </div>
    </div>
  );
}
