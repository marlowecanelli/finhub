"use client";

export type PaperTrade = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  timestamp: number;
  realizedPnl?: number;
};

export type PaperPosition = {
  symbol: string;
  shares: number;
  avgCost: number;
};

export type PaperSnapshot = {
  t: number;
  value: number;
  benchmark: number;
};

export type PaperState = {
  startingCash: number;
  cash: number;
  positions: Record<string, PaperPosition>;
  trades: PaperTrade[];
  snapshots: PaperSnapshot[];
  createdAt: number;
  xp: number;
  streak: number;
  lastTradeDay: string | null;
  achievements: string[];
};

export const STARTING_CASH = 100_000;
export const STORAGE_KEY = "finhub-paper-trading-v1";

export function createInitialState(): PaperState {
  return {
    startingCash: STARTING_CASH,
    cash: STARTING_CASH,
    positions: {},
    trades: [],
    snapshots: [],
    createdAt: Date.now(),
    xp: 0,
    streak: 0,
    lastTradeDay: null,
    achievements: [],
  };
}

export function loadState(): PaperState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as PaperState;
    return { ...createInitialState(), ...parsed };
  } catch {
    return createInitialState();
  }
}

export function saveState(state: PaperState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function portfolioValue(
  state: PaperState,
  prices: Record<string, number>
): number {
  let value = state.cash;
  for (const pos of Object.values(state.positions)) {
    const p = prices[pos.symbol];
    if (typeof p === "number") value += pos.shares * p;
  }
  return value;
}

export function levelFromXp(xp: number): { level: number; progress: number; toNext: number } {
  // Each level needs 100 * level XP. Compound-ish curve.
  let level = 1;
  let remaining = xp;
  let need = 100;
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = 100 * level;
  }
  return { level, progress: remaining, toNext: need };
}

export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  check: (s: PaperState, value: number) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_trade",
    title: "First Steps",
    description: "Place your first trade",
    emoji: "🎯",
    check: (s) => s.trades.length >= 1,
  },
  {
    id: "diversified",
    title: "Diversified",
    description: "Hold 5 different positions",
    emoji: "🌐",
    check: (s) => Object.keys(s.positions).length >= 5,
  },
  {
    id: "ten_trades",
    title: "Active Trader",
    description: "Complete 10 trades",
    emoji: "⚡",
    check: (s) => s.trades.length >= 10,
  },
  {
    id: "profit_1k",
    title: "Up a Grand",
    description: "Portfolio up $1,000",
    emoji: "💵",
    check: (s, v) => v - s.startingCash >= 1000,
  },
  {
    id: "profit_10k",
    title: "Five Figures",
    description: "Portfolio up $10,000",
    emoji: "💰",
    check: (s, v) => v - s.startingCash >= 10000,
  },
  {
    id: "double_up",
    title: "Double Up",
    description: "Double your starting cash",
    emoji: "🚀",
    check: (s, v) => v >= s.startingCash * 2,
  },
  {
    id: "streak_3",
    title: "On a Roll",
    description: "Trade 3 days in a row",
    emoji: "🔥",
    check: (s) => s.streak >= 3,
  },
  {
    id: "first_sell",
    title: "Take Profits",
    description: "Close a position",
    emoji: "💸",
    check: (s) => s.trades.some((t) => t.side === "sell"),
  },
  {
    id: "winner",
    title: "Stock Picker",
    description: "Close a trade for $100+ profit",
    emoji: "🎓",
    check: (s) => s.trades.some((t) => (t.realizedPnl ?? 0) >= 100),
  },
];

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
