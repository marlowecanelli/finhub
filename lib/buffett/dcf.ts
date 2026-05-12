/**
 * Two-stage Discounted Cash Flow model for intrinsic value per share.
 *
 * Stage 1: 5 years of FCF growing at min(historicalFcfCagr, 10%)
 * Terminal: FCF growing at 2.5% in perpetuity
 * Discount rate: 9%
 */

export type DcfResult = {
  intrinsicValuePerShare: number;
  fcfGrowthRate: number; // used in Stage 1
  terminalGrowthRate: number;
  discountRate: number;
  stage1Pvs: number[];
  terminalPv: number;
  totalPv: number;
  sharesUsed: number;
};

const DISCOUNT_RATE = 0.09;
const TERMINAL_GROWTH = 0.025;
const STAGE1_YEARS = 5;
const MAX_STAGE1_GROWTH = 0.10;

export function computeDcf(params: {
  fcfTTM: number; // trailing 12-month free cash flow (absolute $)
  fcfCagrHistory: number | null; // historical 5Y FCF CAGR as decimal, can be null
  sharesOutstanding: number;
}): DcfResult | null {
  const { fcfTTM, fcfCagrHistory, sharesOutstanding } = params;

  if (!isFinite(fcfTTM) || fcfTTM <= 0) return null;
  if (!isFinite(sharesOutstanding) || sharesOutstanding <= 0) return null;

  const growthRate = Math.min(
    fcfCagrHistory != null && isFinite(fcfCagrHistory) && fcfCagrHistory > -0.5
      ? fcfCagrHistory
      : 0.05, // default 5% if history unavailable
    MAX_STAGE1_GROWTH
  );

  // Stage 1: PV of years 1-5
  const stage1Pvs: number[] = [];
  let runningFcf = fcfTTM;
  for (let t = 1; t <= STAGE1_YEARS; t++) {
    runningFcf = runningFcf * (1 + growthRate);
    const pv = runningFcf / Math.pow(1 + DISCOUNT_RATE, t);
    stage1Pvs.push(pv);
  }

  // Terminal value at end of year 5 (Gordon Growth)
  const year5Fcf = runningFcf;
  const terminalValue = (year5Fcf * (1 + TERMINAL_GROWTH)) / (DISCOUNT_RATE - TERMINAL_GROWTH);
  const terminalPv = terminalValue / Math.pow(1 + DISCOUNT_RATE, STAGE1_YEARS);

  const totalPv = stage1Pvs.reduce((a, b) => a + b, 0) + terminalPv;
  const intrinsicValuePerShare = totalPv / sharesOutstanding;

  return {
    intrinsicValuePerShare,
    fcfGrowthRate: growthRate,
    terminalGrowthRate: TERMINAL_GROWTH,
    discountRate: DISCOUNT_RATE,
    stage1Pvs,
    terminalPv,
    totalPv,
    sharesUsed: sharesOutstanding,
  };
}
