// ---------- Dividend projection ----------

export type DividendInputs = {
  initialInvestment: number;
  monthlyContribution: number;
  annualYieldPct: number; // e.g. 3 for 3%
  dividendGrowthPct: number;
  priceAppreciationPct: number;
  years: number;
  reinvest: boolean;
};

export type DividendYearRow = {
  year: number;
  contributions: number; // cumulative new money added (init + monthly)
  dividendsReceivedYear: number;
  dividendsReceivedTotal: number;
  portfolioValue: number; // end-of-year value reflecting current toggle
  reinvestedValue: number; // value assuming reinvest=true (always)
  notReinvestedValue: number; // value assuming reinvest=false (price-only + cash dividends)
};

const MONTHS = 12;

export function projectDividends(input: DividendInputs): DividendYearRow[] {
  const years = Math.max(0, Math.min(60, Math.round(input.years)));
  const rows: DividendYearRow[] = [];

  // Two parallel simulations so we can show the comparison even if reinvest=false.
  const simReinvest = createSim(input);
  const simCash = createSim(input);

  let cumContrib = input.initialInvestment;
  let totalDivReinvest = 0;
  let totalDivCash = 0;

  for (let y = 1; y <= years; y++) {
    const r = stepYear(simReinvest, true);
    const c = stepYear(simCash, false);
    cumContrib += input.monthlyContribution * MONTHS;
    totalDivReinvest += r.divThisYear;
    totalDivCash += c.divThisYear;

    const reportedDivYear = input.reinvest ? r.divThisYear : c.divThisYear;
    const reportedDivTotal = input.reinvest ? totalDivReinvest : totalDivCash;
    const reinvestedValue = r.value;
    const notReinvestedValue = c.value + totalDivCash;
    const reportedValue = input.reinvest ? reinvestedValue : notReinvestedValue;

    rows.push({
      year: y,
      contributions: cumContrib,
      dividendsReceivedYear: reportedDivYear,
      dividendsReceivedTotal: reportedDivTotal,
      portfolioValue: reportedValue,
      reinvestedValue,
      notReinvestedValue,
    });
  }

  return rows;
}

type Sim = {
  shares: number;
  pricePerShare: number;
  yearlyYieldPct: number;
  monthlyContribution: number;
  priceAppreciationPct: number;
  dividendGrowthPct: number;
};

function createSim(input: DividendInputs): Sim {
  // Treat the initial investment as buying shares at $1 base price.
  const basePrice = 100; // arbitrary; the math is invariant under this choice
  return {
    shares: input.initialInvestment / basePrice,
    pricePerShare: basePrice,
    yearlyYieldPct: input.annualYieldPct,
    monthlyContribution: input.monthlyContribution,
    priceAppreciationPct: input.priceAppreciationPct,
    dividendGrowthPct: input.dividendGrowthPct,
  };
}

function stepYear(sim: Sim, reinvest: boolean): { divThisYear: number; value: number } {
  let divThisYear = 0;
  // Monthly compounding: contribute, accrue dividend at monthly rate, optionally reinvest.
  const monthlyYield = sim.yearlyYieldPct / 100 / MONTHS;
  for (let m = 0; m < MONTHS; m++) {
    if (sim.monthlyContribution > 0 && sim.pricePerShare > 0) {
      sim.shares += sim.monthlyContribution / sim.pricePerShare;
    }
    const divThisMonth = sim.shares * sim.pricePerShare * monthlyYield;
    divThisYear += divThisMonth;
    if (reinvest && sim.pricePerShare > 0) {
      sim.shares += divThisMonth / sim.pricePerShare;
    }
  }
  // Apply annual price appreciation + dividend growth.
  sim.pricePerShare *= 1 + sim.priceAppreciationPct / 100;
  sim.yearlyYieldPct *= 1 + sim.dividendGrowthPct / 100;
  return {
    divThisYear,
    value: sim.shares * sim.pricePerShare,
  };
}

// ---------- Position sizing ----------

export type PositionInputs = {
  accountSize: number;
  riskPct: number;
  entry: number;
  stop: number;
  target: number | null;
};

export type PositionResult = {
  shares: number;
  riskAmount: number;
  riskPerShare: number;
  rewardPerShare: number | null;
  positionValue: number;
  rewardAmount: number | null;
  rrRatio: number | null;
  long: boolean; // true if entry above stop (long position)
  valid: boolean;
};

export function computePosition(i: PositionInputs): PositionResult {
  const accountSize = Math.max(0, i.accountSize);
  const riskPct = Math.max(0, i.riskPct);
  const entry = Math.max(0, i.entry);
  const stop = Math.max(0, i.stop);
  const target = i.target != null && i.target > 0 ? i.target : null;

  const riskAmount = accountSize * (riskPct / 100);
  const riskPerShare = Math.abs(entry - stop);
  const long = entry > stop;
  const valid =
    accountSize > 0 && entry > 0 && stop > 0 && riskPerShare > 0 && riskPct > 0;

  const shares = valid ? Math.floor(riskAmount / riskPerShare) : 0;
  const positionValue = shares * entry;

  const rewardPerShare =
    target != null
      ? long
        ? target - entry
        : entry - target
      : null;

  const rewardAmount =
    rewardPerShare != null ? Math.max(0, rewardPerShare) * shares : null;

  const rrRatio =
    rewardPerShare != null && riskPerShare > 0 && rewardPerShare > 0
      ? rewardPerShare / riskPerShare
      : null;

  return {
    shares,
    riskAmount,
    riskPerShare,
    rewardPerShare,
    positionValue,
    rewardAmount,
    rrRatio,
    long,
    valid,
  };
}

// ---------- Compound interest ----------

export type CompoundInputs = {
  principal: number;
  monthlyContrib: number;
  annualRate: number; // as percent, e.g. 8 for 8%
  years: number;
  compoundFreq: "monthly" | "quarterly" | "annually";
};

export type CompoundRow = {
  year: number;
  balance: number;
  contributions: number;
  interest: number;
};

export function projectCompound(i: CompoundInputs): CompoundRow[] {
  const periodsPerYear =
    i.compoundFreq === "monthly" ? 12 : i.compoundFreq === "quarterly" ? 4 : 1;
  const ratePerPeriod = i.annualRate / 100 / periodsPerYear;
  const periodsPerMonth = periodsPerYear / 12; // fractional if quarterly/annually

  const rows: CompoundRow[] = [];
  let balance = i.principal;
  let totalContributions = i.principal;

  // We simulate month by month but only compound at the right frequency
  // Instead, simulate period by period
  const totalPeriods = periodsPerYear * Math.max(0, Math.round(i.years));
  const monthsPerPeriod = 12 / periodsPerYear;

  for (let period = 1; period <= totalPeriods; period++) {
    // Add monthly contributions for each month in this period
    const contribThisPeriod = i.monthlyContrib * monthsPerPeriod;
    balance += contribThisPeriod;
    totalContributions += contribThisPeriod;

    // Apply interest
    balance *= 1 + ratePerPeriod;

    // Record at year boundaries
    if (period % periodsPerYear === 0) {
      const year = period / periodsPerYear;
      rows.push({
        year,
        balance,
        contributions: totalContributions,
        interest: balance - totalContributions,
      });
    }
  }

  return rows;
}

// ---------- Loan amortization ----------

export type LoanInputs = {
  principal: number;
  annualRate: number; // as percent
  termYears: number;
  extraMonthly: number;
};

export type LoanScheduleRow = {
  month: number;
  balance: number;
  principal: number;
  interest: number;
};

export type LoanResult = {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  payoffMonths: number;
  schedule: LoanScheduleRow[];
};

export function computeLoan(i: LoanInputs): LoanResult {
  const principal = Math.max(0, i.principal);
  const monthlyRate = i.annualRate / 100 / 12;
  const n = Math.round(i.termYears * 12);
  const extra = Math.max(0, i.extraMonthly);

  if (principal <= 0 || n <= 0 || i.annualRate < 0) {
    return {
      monthlyPayment: 0,
      totalPaid: 0,
      totalInterest: 0,
      payoffMonths: 0,
      schedule: [],
    };
  }

  // Standard monthly payment formula
  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = principal / n;
  } else {
    const factor = Math.pow(1 + monthlyRate, n);
    monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
  }

  const schedule: LoanScheduleRow[] = [];
  let balance = principal;
  let month = 0;
  let totalPaid = 0;

  while (balance > 0.005 && month < n) {
    month++;
    const interestThisMonth = balance * monthlyRate;
    const payment = Math.min(balance + interestThisMonth, monthlyPayment + extra);
    const principalThisMonth = payment - interestThisMonth;
    balance = Math.max(0, balance - principalThisMonth);
    totalPaid += payment;

    // Include first 36 months + every 12th month after that
    if (month <= 36 || month % 12 === 0) {
      schedule.push({
        month,
        balance,
        principal: principalThisMonth,
        interest: interestThisMonth,
      });
    }
  }

  return {
    monthlyPayment,
    totalPaid,
    totalInterest: totalPaid - principal,
    payoffMonths: month,
    schedule,
  };
}

// ---------- Break-even ----------

export type BreakEvenInputs = {
  fixedCosts: number;
  variableCostPerUnit: number;
  pricePerUnit: number;
  currentUnits?: number;
};

export type BreakEvenResult = {
  bepUnits: number;
  bepRevenue: number;
  contributionMargin: number; // per unit
  contributionMarginRatio: number; // 0–1
  marginOfSafety?: number;
  marginOfSafetyPct?: number;
  valid: boolean;
};

export function computeBreakEven(i: BreakEvenInputs): BreakEvenResult {
  const contributionMargin = i.pricePerUnit - i.variableCostPerUnit;
  const valid =
    contributionMargin > 0 &&
    i.fixedCosts >= 0 &&
    i.pricePerUnit > 0 &&
    Number.isFinite(contributionMargin);

  if (!valid) {
    return {
      bepUnits: 0,
      bepRevenue: 0,
      contributionMargin,
      contributionMarginRatio: i.pricePerUnit > 0 ? contributionMargin / i.pricePerUnit : 0,
      valid: false,
    };
  }

  const bepUnits = i.fixedCosts / contributionMargin;
  const bepRevenue = bepUnits * i.pricePerUnit;
  const contributionMarginRatio = contributionMargin / i.pricePerUnit;

  const result: BreakEvenResult = {
    bepUnits,
    bepRevenue,
    contributionMargin,
    contributionMarginRatio,
    valid: true,
  };

  if (i.currentUnits != null && i.currentUnits > 0) {
    const currentRevenue = i.currentUnits * i.pricePerUnit;
    result.marginOfSafety = currentRevenue - bepRevenue;
    result.marginOfSafetyPct =
      currentRevenue > 0 ? result.marginOfSafety / currentRevenue : 0;
  }

  return result;
}

// ---------- Goal projection ----------

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // ISO date
  created_at: string; // ISO
};

export type GoalProjection = {
  remaining: number;
  pctComplete: number; // 0–100
  monthsToTarget: number;
  requiredMonthly: number;
  observedMonthlyPace: number; // savings/month since creation, can be 0
  projectedCompletion: Date | null;
  status: "on-track" | "behind" | "ahead" | "complete" | "no-pace";
};

export function projectGoal(g: Goal): GoalProjection {
  const remaining = Math.max(0, g.target_amount - g.current_amount);
  const pctComplete = Math.min(
    100,
    Math.max(0, (g.current_amount / Math.max(1e-9, g.target_amount)) * 100)
  );

  const today = new Date();
  const targetDate = new Date(g.target_date);
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.4375;
  const monthsToTarget = Math.max(0, (targetDate.getTime() - today.getTime()) / msPerMonth);

  const created = new Date(g.created_at);
  const monthsSinceCreated = Math.max(
    0.5,
    (today.getTime() - created.getTime()) / msPerMonth
  );
  const observedMonthlyPace = g.current_amount / monthsSinceCreated;

  const requiredMonthly = monthsToTarget > 0 ? remaining / monthsToTarget : remaining;

  let projectedCompletion: Date | null = null;
  if (remaining === 0) {
    projectedCompletion = today;
  } else if (observedMonthlyPace > 0) {
    const monthsAtPace = remaining / observedMonthlyPace;
    projectedCompletion = new Date(
      today.getTime() + monthsAtPace * msPerMonth
    );
  }

  let status: GoalProjection["status"] = "no-pace";
  if (remaining === 0) status = "complete";
  else if (projectedCompletion) {
    if (projectedCompletion.getTime() <= targetDate.getTime()) {
      status =
        targetDate.getTime() - projectedCompletion.getTime() > 30 * 24 * 60 * 60 * 1000
          ? "ahead"
          : "on-track";
    } else status = "behind";
  }

  return {
    remaining,
    pctComplete,
    monthsToTarget,
    requiredMonthly,
    observedMonthlyPace,
    projectedCompletion,
    status,
  };
}
