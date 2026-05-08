export type ParsedLot = {
  ticker: string;
  shares: number;
  cost_basis: number; // per share
  purchase_date: string;
  _sourceRow?: string; // for error reporting
};

export type BrokerFormat =
  | "fidelity-positions"
  | "schwab-transactions"
  | "robinhood-transactions"
  | "jpmorgan-transactions"
  | "etrade-transactions"
  | "generic-positions"
  | "generic-transactions"
  | "unknown";

export type ParseResult = {
  format: BrokerFormat;
  formatLabel: string;
  lots: ParsedLot[];
  skipped: number; // non-buy rows ignored
  errors: string[];
};

// Minimal CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(raw: string): string {
  if (!raw) return todayISO();
  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // MM/DD/YYYY
  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) return `${mdy[3]!}-${mdy[1]!.padStart(2, "0")}-${mdy[2]!.padStart(2, "0")}`;
  // Robinhood ISO with time: 2024-01-15T12:34:56.000000Z
  const isoTime = raw.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoTime) return isoTime[1]!;
  return todayISO();
}

function cleanNumber(raw: string): number {
  if (!raw) return 0;
  return Number(raw.replace(/[$,%\s]/g, ""));
}

// ── Format detection ────────────────────────────────────────────────────────

export function detectBrokerFormat(headers: string[]): BrokerFormat {
  const nh = headers.map(normalizeHeader);
  const has = (...terms: string[]) => terms.some((t) => nh.includes(t));
  const hasAny = (...terms: string[]) => terms.some((t) => nh.some((h) => h.includes(t)));

  // Fidelity positions: has "costbasispershare"
  if (hasAny("costbasispershare")) return "fidelity-positions";

  // Robinhood transactions: has "averageprice" and "side" and "ordertype"
  if (has("averageprice") || has("averageprice") || (has("side") && hasAny("ordertype")))
    return "robinhood-transactions";

  // Schwab transactions: has "feescommissions" or "action" + "amount"
  if (hasAny("feescommissions") || (has("action") && has("amount") && has("symbol")))
    return "schwab-transactions";

  // JP Morgan: has "transactiontype" and "symbol"
  if (hasAny("transactiontype") && has("symbol")) return "jpmorgan-transactions";

  // E*Trade: has "transactiontype" or "ordertype" and "commissions"
  if (hasAny("commission") && has("symbol") && has("quantity") && has("price"))
    return "etrade-transactions";

  // Generic positions: has symbol + quantity + some kind of cost
  if (has("symbol") && has("quantity") && hasAny("cost", "costbasis", "averagecost"))
    return "generic-positions";

  // Generic transactions: has symbol + quantity + price
  if (has("symbol") && has("quantity") && has("price")) return "generic-transactions";

  return "unknown";
}

export function formatLabel(f: BrokerFormat): string {
  switch (f) {
    case "fidelity-positions": return "Fidelity — Positions Export";
    case "robinhood-transactions": return "Robinhood — Transaction History";
    case "schwab-transactions": return "Charles Schwab — Transaction History";
    case "jpmorgan-transactions": return "JP Morgan / Chase — Transaction History";
    case "etrade-transactions": return "E*Trade — Transaction History";
    case "generic-positions": return "Generic Positions CSV";
    case "generic-transactions": return "Generic Transactions CSV";
    default: return "Unknown Format";
  }
}

// ── Per-broker parsers ───────────────────────────────────────────────────────

function parseFidelityPositions(headers: string[], rows: string[][]): Omit<ParseResult, "format" | "formatLabel"> {
  const idx = (name: string) => headers.findIndex((h) => normalizeHeader(h) === name);
  const symbolIdx = idx("symbol");
  const qtyIdx = idx("quantity");
  const costPerShareIdx = headers.findIndex((h) => normalizeHeader(h).includes("costbasispershare"));
  const dateIdx = -1; // positions don't have purchase date

  const lots: ParsedLot[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    const ticker = row[symbolIdx]?.replace(/[^A-Z0-9.]/g, "").toUpperCase();
    if (!ticker || ticker === "--" || ticker === "CASH" || ticker === "SPAXX**") continue;
    const shares = cleanNumber(row[qtyIdx] ?? "");
    const cost = cleanNumber(row[costPerShareIdx] ?? "");
    if (!Number.isFinite(shares) || shares <= 0) continue;
    lots.push({ ticker, shares, cost_basis: cost, purchase_date: todayISO() });
  }

  return { lots, skipped: 0, errors };
}

function parseRobinhoodTransactions(headers: string[], rows: string[][]): Omit<ParseResult, "format" | "formatLabel"> {
  const idx = (name: string) => headers.findIndex((h) => normalizeHeader(h) === name || h.toLowerCase().includes(name));
  const symbolIdx = idx("symbol");
  const sideIdx = idx("side");
  const qtyIdx = idx("quantity");
  const priceIdx = headers.findIndex((h) => normalizeHeader(h).includes("averageprice") || normalizeHeader(h) === "price");
  const dateIdx = idx("date");

  const lots: ParsedLot[] = [];
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const side = row[sideIdx]?.toLowerCase();
    if (side && side !== "buy") { skipped++; continue; }
    const ticker = row[symbolIdx]?.replace(/[^A-Z0-9.]/g, "").toUpperCase();
    if (!ticker) continue;
    const shares = cleanNumber(row[qtyIdx] ?? "");
    const price = cleanNumber(row[priceIdx] ?? "");
    if (!Number.isFinite(shares) || shares <= 0) continue;
    lots.push({
      ticker,
      shares,
      cost_basis: price,
      purchase_date: parseDate(row[dateIdx] ?? ""),
    });
  }

  return { lots, skipped, errors };
}

function parseSchawbTransactions(headers: string[], rows: string[][]): Omit<ParseResult, "format" | "formatLabel"> {
  const idx = (name: string) => headers.findIndex((h) => normalizeHeader(h) === name);
  const dateIdx = idx("date");
  const actionIdx = idx("action");
  const symbolIdx = idx("symbol");
  const qtyIdx = idx("quantity");
  const priceIdx = idx("price");

  const lots: ParsedLot[] = [];
  let skipped = 0;
  const errors: string[] = [];

  const buyActions = new Set(["buy", "buytoopenequity", "buytocovershort", "reinvestshares", "reinvestdividend"]);

  for (const row of rows) {
    const action = (row[actionIdx] ?? "").toLowerCase().replace(/\s/g, "");
    if (!buyActions.has(action) && !action.startsWith("buy")) { skipped++; continue; }
    const ticker = row[symbolIdx]?.replace(/[^A-Z0-9.]/g, "").toUpperCase();
    if (!ticker) continue;
    const shares = cleanNumber(row[qtyIdx] ?? "");
    const price = cleanNumber(row[priceIdx] ?? "");
    if (!Number.isFinite(shares) || shares <= 0) continue;
    lots.push({
      ticker,
      shares,
      cost_basis: price,
      purchase_date: parseDate(row[dateIdx] ?? ""),
    });
  }

  return { lots, skipped, errors };
}

function parseJPMorganTransactions(headers: string[], rows: string[][]): Omit<ParseResult, "format" | "formatLabel"> {
  const idx = (name: string) => headers.findIndex((h) => normalizeHeader(h).includes(name));
  const dateIdx = idx("date");
  const typeIdx = idx("transactiontype");
  const symbolIdx = idx("symbol");
  const qtyIdx = idx("quantity") >= 0 ? idx("quantity") : idx("shares");
  const priceIdx = idx("price");

  const lots: ParsedLot[] = [];
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const type = (row[typeIdx] ?? "").toLowerCase();
    if (!type.includes("buy") && !type.includes("purchase")) { skipped++; continue; }
    const ticker = row[symbolIdx]?.replace(/[^A-Z0-9.]/g, "").toUpperCase();
    if (!ticker) continue;
    const shares = cleanNumber(row[qtyIdx] ?? "");
    const price = cleanNumber(row[priceIdx] ?? "");
    if (!Number.isFinite(shares) || shares <= 0) continue;
    lots.push({
      ticker,
      shares,
      cost_basis: price,
      purchase_date: parseDate(row[dateIdx] ?? ""),
    });
  }

  return { lots, skipped, errors };
}

function parseGenericPositions(headers: string[], rows: string[][]): Omit<ParseResult, "format" | "formatLabel"> {
  const nh = headers.map(normalizeHeader);
  const idxOf = (...terms: string[]) =>
    nh.findIndex((h) => terms.some((t) => h === t || h.includes(t)));

  const symbolIdx = idxOf("symbol", "ticker");
  const qtyIdx = idxOf("quantity", "shares", "qty");
  const costIdx = idxOf("costbasispershare", "costpershare", "averagecost", "avgcost", "cost");

  const lots: ParsedLot[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    const ticker = row[symbolIdx]?.replace(/[^A-Z0-9.]/g, "").toUpperCase();
    if (!ticker) continue;
    const shares = cleanNumber(row[qtyIdx] ?? "");
    const cost = costIdx >= 0 ? cleanNumber(row[costIdx] ?? "") : 0;
    if (!Number.isFinite(shares) || shares <= 0) continue;
    lots.push({ ticker, shares, cost_basis: cost, purchase_date: todayISO() });
  }

  return { lots, skipped: 0, errors };
}

function parseGenericTransactions(headers: string[], rows: string[][]): Omit<ParseResult, "format" | "formatLabel"> {
  const nh = headers.map(normalizeHeader);
  const idxOf = (...terms: string[]) =>
    nh.findIndex((h) => terms.some((t) => h === t || h.includes(t)));

  const dateIdx = idxOf("date", "tradedate", "settledate");
  const typeIdx = idxOf("type", "action", "transactiontype", "side");
  const symbolIdx = idxOf("symbol", "ticker");
  const qtyIdx = idxOf("quantity", "shares", "qty");
  const priceIdx = idxOf("price", "tradeprice", "averageprice");

  const lots: ParsedLot[] = [];
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const type = (typeIdx >= 0 ? (row[typeIdx] ?? "") : "buy").toLowerCase();
    if (typeIdx >= 0 && !type.includes("buy") && !type.includes("purchase")) { skipped++; continue; }
    const ticker = row[symbolIdx]?.replace(/[^A-Z0-9.]/g, "").toUpperCase();
    if (!ticker) continue;
    const shares = cleanNumber(row[qtyIdx] ?? "");
    const price = priceIdx >= 0 ? cleanNumber(row[priceIdx] ?? "") : 0;
    if (!Number.isFinite(shares) || shares <= 0) continue;
    lots.push({
      ticker,
      shares,
      cost_basis: price,
      purchase_date: parseDate(dateIdx >= 0 ? (row[dateIdx] ?? "") : ""),
    });
  }

  return { lots, skipped, errors };
}

// ── Main entry point ─────────────────────────────────────────────────────────

export function parseBrokerCSV(text: string): ParseResult {
  // Strip leading BOM
  const clean = text.replace(/^﻿/, "");

  // Find the first non-empty line that looks like a header (has commas and letters)
  const allLines = clean.split(/\r?\n/).map((l) => l.trim());
  let headerLineIdx = -1;
  for (let i = 0; i < Math.min(allLines.length, 10); i++) {
    const l = allLines[i];
    if (l && l.includes(",") && /[a-zA-Z]/.test(l)) {
      headerLineIdx = i;
      break;
    }
  }
  if (headerLineIdx === -1) {
    return { format: "unknown", formatLabel: "Unknown Format", lots: [], skipped: 0, errors: ["Could not find a header row"] };
  }

  const headers = parseCSVLine(allLines[headerLineIdx] ?? "");
  const format = detectBrokerFormat(headers);
  const label = formatLabel(format);

  const dataRows = allLines
    .slice(headerLineIdx + 1)
    .filter((l) => l && !l.startsWith("Brokerage services") && l !== ",,,,,,,")
    .map(parseCSVLine);

  let result: Omit<ParseResult, "format" | "formatLabel">;
  switch (format) {
    case "fidelity-positions":
      result = parseFidelityPositions(headers, dataRows); break;
    case "robinhood-transactions":
      result = parseRobinhoodTransactions(headers, dataRows); break;
    case "schwab-transactions":
      result = parseSchawbTransactions(headers, dataRows); break;
    case "jpmorgan-transactions":
      result = parseJPMorganTransactions(headers, dataRows); break;
    case "generic-positions":
    case "unknown":
      result = parseGenericPositions(headers, dataRows); break;
    default:
      result = parseGenericTransactions(headers, dataRows); break;
  }

  return { format, formatLabel: label, ...result };
}

// ── Merge helpers ─────────────────────────────────────────────────────────────

export type MergeStrategy = "separate-lots" | "weighted-average";

export function mergeLots(lots: ParsedLot[], strategy: MergeStrategy): ParsedLot[] {
  if (strategy === "separate-lots") return lots;

  // Weighted average: group by ticker, compute blended avg cost
  const byTicker = new Map<string, ParsedLot[]>();
  for (const lot of lots) {
    const arr = byTicker.get(lot.ticker) ?? [];
    arr.push(lot);
    byTicker.set(lot.ticker, arr);
  }

  const merged: ParsedLot[] = [];
  for (const [ticker, tickerLots] of byTicker) {
    const totalShares = tickerLots.reduce((s, l) => s + l.shares, 0);
    const totalCost = tickerLots.reduce((s, l) => s + l.shares * l.cost_basis, 0);
    const avgCost = totalShares > 0 ? totalCost / totalShares : 0;
    const earliest = tickerLots.reduce((min, l) => (l.purchase_date < min ? l.purchase_date : min), tickerLots[0]!.purchase_date);
    merged.push({ ticker, shares: totalShares, cost_basis: avgCost, purchase_date: earliest });
  }
  return merged;
}
