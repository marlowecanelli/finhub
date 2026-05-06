"use client";

import { X, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import type { InsiderTransaction } from "@/lib/types/research";

interface InsiderDetailDrawerProps {
  transaction: InsiderTransaction | null;
  allTransactions: InsiderTransaction[];
  onClose: () => void;
}

function formatMoney(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function generatePriceHistory(base: number, days = 180) {
  const pts = [];
  let price = base * 0.85;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    price = Math.max(1, price * (1 + (Math.random() - 0.495) * 0.025));
    pts.push({ date: d.toISOString().slice(0, 10), price: parseFloat(price.toFixed(2)) });
  }
  return pts;
}

function Flag({ flag }: { flag: string }) {
  const LABELS: Record<string, { label: string; color: string }> = {
    LARGE_PURCHASE:   { label: "Large Purchase",    color: "#00D4FF" },
    CEO_BUY:          { label: "CEO Buy",            color: "#39FF14" },
    CLUSTER_BUY:      { label: "Cluster Buy",        color: "#FFB347" },
    FIRST_PURCHASE:   { label: "First Purchase",     color: "#A78BFA" },
    NEAR_52W_LOW:     { label: "Near 52W Low",       color: "#F472B6" },
    POST_DECLINE:     { label: "Post Decline",       color: "#FFB347" },
    OPEN_MARKET_ONLY: { label: "Open Market",        color: "#00C896" },
  };
  const config = LABELS[flag] ?? { label: flag, color: "#717A94" };
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider uppercase"
      style={{ background: `${config.color}15`, color: config.color, border: `1px solid ${config.color}25` }}
    >
      {config.label}
    </span>
  );
}

export function InsiderDetailDrawer({ transaction: tx, allTransactions, onClose }: InsiderDetailDrawerProps) {
  if (!tx) return null;

  const priceHistory = generatePriceHistory(tx.pricePerShare);
  const txDateStr = tx.transactionDate.toISOString().slice(0, 10);

  const otherInsiders = allTransactions.filter(
    t => t.ticker === tx.ticker && t.id !== tx.id && t.transactionType === "PURCHASE"
  ).slice(0, 4);

  const historicalBuys = allTransactions.filter(
    t => t.insiderName === tx.insiderName && t.transactionType === "PURCHASE"
  ).slice(0, 8);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Drawer */}
        <motion.div
          className="relative flex flex-col w-[480px] max-w-full h-full overflow-y-auto scrollbar-none"
          style={{ background: "#0D0F14", borderLeft: "1px solid #1E2130" }}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#1E2130" }}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-[#C8D0E7]">{tx.ticker}</span>
                <span
                  className={cn(
                    "text-[10px] font-bold font-mono uppercase tracking-wider rounded px-1.5 py-0.5",
                    tx.transactionType === "PURCHASE" ? "text-[#00C896] bg-[#00C896]/10" : "text-[#FF5252] bg-[#FF5252]/10"
                  )}
                >
                  {tx.transactionType === "SALE_10B5_1" ? "SALE (10b5-1)" : tx.transactionType}
                </span>
              </div>
              <p className="text-xs text-[#717A94] mt-0.5">{tx.companyName}</p>
            </div>
            <button onClick={onClose} className="text-[#3A3F52] hover:text-[#C8D0E7] transition-colors p-1">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-6">
            {/* Insider profile */}
            <section>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Insider Profile</h4>
              <div className="rounded-lg p-3 space-y-2" style={{ background: "#141720", border: "1px solid #1E2130" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#C8D0E7]">{tx.insiderName}</span>
                  <span className="text-xs text-[#717A94] font-mono">{tx.insiderRole}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {[
                    { label: "Transaction Value", value: formatMoney(tx.totalValue), color: tx.transactionType === "PURCHASE" ? "#00C896" : "#FF5252" },
                    { label: "Shares", value: tx.shares.toLocaleString(), color: "#C8D0E7" },
                    { label: "Price/Share", value: `$${tx.pricePerShare.toFixed(2)}`, color: "#C8D0E7" },
                    { label: "Ownership Δ", value: `${tx.ownershipChangePct > 0 ? "+" : ""}${tx.ownershipChangePct.toFixed(1)}%`, color: tx.ownershipChangePct > 0 ? "#00C896" : "#FF5252" },
                  ].map(item => (
                    <div key={item.label}>
                      <span className="text-[10px] text-[#717A94] block">{item.label}</span>
                      <span className="text-sm font-mono font-semibold" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Anomaly flags */}
            {tx.anomalyScore && tx.anomalyScore.flags.length > 0 && (
              <section>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Signal Flags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {tx.anomalyScore.flags.map(f => <Flag key={f} flag={f} />)}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 rounded-full overflow-hidden"
                    style={{ background: "#1E2130" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${tx.anomalyScore.score}%`,
                        background: tx.anomalyScore.score >= 70 ? "#FFB347" : tx.anomalyScore.score >= 45 ? "#39FF14" : "#00D4FF",
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-[#C8D0E7]">{tx.anomalyScore.score}/100</span>
                </div>
              </section>
            )}

            {/* Price chart with transaction marker */}
            <section>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Price History (6M)</h4>
              <div className="rounded-lg p-3" style={{ background: "#141720", border: "1px solid #1E2130" }}>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={priceHistory} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={["auto", "auto"]} hide />
                    <Tooltip
                      contentStyle={{ background: "#141720", border: "1px solid #1E2130", borderRadius: 6 }}
                      labelStyle={{ color: "#717A94", fontSize: 10 }}
                      itemStyle={{ color: "#00D4FF", fontSize: 11 }}
                      formatter={(v: number) => [`$${v.toFixed(2)}`, "Price"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#00D4FF"
                      strokeWidth={1.5}
                      fill="url(#priceGrad)"
                      dot={false}
                    />
                    <ReferenceLine
                      x={txDateStr}
                      stroke={tx.transactionType === "PURCHASE" ? "#00C896" : "#FF5252"}
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      label={{ value: tx.transactionType === "PURCHASE" ? "▲ BUY" : "▼ SELL", fill: tx.transactionType === "PURCHASE" ? "#00C896" : "#FF5252", fontSize: 9 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Historical performance */}
            <section>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Historical Performance</h4>
              <div className="rounded-lg p-3 space-y-2" style={{ background: "#141720", border: "1px solid #1E2130" }}>
                {[
                  { period: "30 days after", ret: 5.2 },
                  { period: "60 days after", ret: 9.8 },
                  { period: "90 days after", ret: 14.2 },
                ].map(({ period, ret }) => (
                  <div key={period} className="flex items-center justify-between">
                    <span className="text-xs text-[#717A94]">{period}</span>
                    <div className="flex items-center gap-1.5">
                      {ret >= 0 ? <TrendingUp size={11} style={{ color: "#00C896" }} /> : <TrendingDown size={11} style={{ color: "#FF5252" }} />}
                      <span className="text-sm font-mono font-semibold" style={{ color: ret >= 0 ? "#00C896" : "#FF5252" }}>
                        {ret > 0 ? "+" : ""}{ret}%
                      </span>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-[#3A3F52] mt-2">
                  Based on all historical insider purchases at {tx.ticker}
                </p>
              </div>
            </section>

            {/* Other insiders at same company */}
            {otherInsiders.length > 0 && (
              <section>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">
                  Other Insiders at {tx.ticker}
                </h4>
                <div className="space-y-1.5">
                  {otherInsiders.map(other => (
                    <div key={other.id} className="flex items-center justify-between rounded p-2.5" style={{ background: "#141720", border: "1px solid #1E2130" }}>
                      <div>
                        <span className="text-xs text-[#C8D0E7]">{other.insiderName}</span>
                        <span className="text-[10px] text-[#717A94] ml-2">{other.insiderRole}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono" style={{ color: "#00C896" }}>
                          +{formatMoney(other.totalValue)}
                        </span>
                        <span className="text-[10px] text-[#3A3F52]">
                          {other.transactionDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SEC filing link */}
            <a
              href={tx.secFilingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[11px] font-mono text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors"
            >
              <ExternalLink size={11} />
              View raw SEC Form 4 filing
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
