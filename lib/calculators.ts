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
