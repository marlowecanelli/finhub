export type AssetCategory =
  | "cash"
  | "investment"
  | "retirement"
  | "realEstate"
  | "vehicle"
  | "crypto"
  | "collectible"
  | "business"
  | "other";

export type LiabilityCategory =
  | "mortgage"
  | "studentLoan"
  | "creditCard"
  | "autoLoan"
  | "personalLoan"
  | "medical"
  | "taxDebt"
  | "other";

export interface AutoUpdateConfig {
  type: "crypto" | "stockHolding" | "vehicleDepreciation" | "realEstateReminder";
  tickerOrCoinId?: string;
  quantity?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  depreciationCurve?: "standard" | "luxury" | "truck" | "classic" | "flat";
  reminderIntervalDays?: number;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  isLiquid: boolean;
  autoUpdate?: AutoUpdateConfig;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  // Optional extra fields per category (free-form)
  meta?: Record<string, string | number | undefined>;
  archived?: boolean;
}

export interface Liability {
  id: string;
  name: string;
  category: LiabilityCategory;
  balance: number;
  originalBalance?: number;
  interestRate?: number; // decimal (0.0699)
  minimumPayment?: number;
  payoffDate?: string;
  lender?: string;
  creditLimit?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

export interface Snapshot {
  date: string; // YYYY-MM-DD
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidNetWorth: number;
  assetBreakdown: Partial<Record<AssetCategory, number>>;
  liabilityBreakdown: Partial<Record<LiabilityCategory, number>>;
}

export interface Annotation {
  id: string;
  date: string;
  title: string;
  emoji?: string;
  description?: string;
}

export type GoalType =
  | "netWorth"
  | "liquidNetWorth"
  | "debtFree"
  | "emergencyFund"
  | "fire"
  | "custom";

export interface Goal {
  id: string;
  type: GoalType;
  label: string;
  target: number;
  deadline?: string;
  createdAt: string;
  achievedAt?: string;
}

export interface Achievement {
  id: string;
  unlockedAt: string;
  type: string;
}

export interface ActivityEvent {
  id: string;
  ts: string;
  message: string;
  delta?: number;
}

export interface NetWorthSettings {
  privacyDefault: "off" | "blurred";
  currency: string;
  monthlyExpenses?: number;
  annualSpending?: number;
}

export interface NetWorthState {
  version: number;
  assets: Asset[];
  liabilities: Liability[];
  snapshots: Snapshot[];
  annotations: Annotation[];
  goals: Goal[];
  achievements: Achievement[];
  activity: ActivityEvent[];
  settings: NetWorthSettings;
  // Linked portfolio mirror (read-only asset)
  linkedPortfolioValue?: number;
  linkedPortfolioUpdatedAt?: string;
  // Crypto cache
  cryptoCache?: Record<string, { price: number; ts: number }>;
}

export const ASSET_CATEGORY_META: Record<
  AssetCategory,
  { label: string; emoji: string; liquidByDefault: boolean }
> = {
  cash: { label: "Cash", emoji: "💵", liquidByDefault: true },
  investment: { label: "Investments", emoji: "📈", liquidByDefault: true },
  retirement: { label: "Retirement", emoji: "🏦", liquidByDefault: false },
  realEstate: { label: "Real Estate", emoji: "🏠", liquidByDefault: false },
  vehicle: { label: "Vehicle", emoji: "🚗", liquidByDefault: false },
  crypto: { label: "Crypto", emoji: "₿", liquidByDefault: true },
  collectible: { label: "Collectibles", emoji: "🎨", liquidByDefault: false },
  business: { label: "Business", emoji: "💼", liquidByDefault: false },
  other: { label: "Other", emoji: "✨", liquidByDefault: false },
};

export const LIABILITY_CATEGORY_META: Record<
  LiabilityCategory,
  { label: string; emoji: string }
> = {
  mortgage: { label: "Mortgage", emoji: "🏠" },
  studentLoan: { label: "Student Loan", emoji: "🎓" },
  creditCard: { label: "Credit Card", emoji: "💳" },
  autoLoan: { label: "Auto Loan", emoji: "🚗" },
  personalLoan: { label: "Personal Loan", emoji: "📝" },
  medical: { label: "Medical", emoji: "🏥" },
  taxDebt: { label: "Tax Debt", emoji: "🧾" },
  other: { label: "Other", emoji: "📌" },
};
