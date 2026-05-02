// ---------- Black-Scholes option pricing ----------

// Abramowitz & Stegun 7.1.26 approximation for erf (max error 1.5e-7)
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly =
    t *
    (0.254829592 +
      t *
        (-0.284496736 +
          t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const result = 1 - poly * Math.exp(-x * x);
  return x >= 0 ? result : -result;
}

export function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export type BSInputs = {
  spot: number; // S
  strike: number; // K
  expiry: number; // T in years
  rate: number; // r as decimal
  vol: number; // σ as decimal
};

export type BSResult = {
  call: number;
  put: number;
  d1: number;
  d2: number;
  callDelta: number;
  putDelta: number;
  gamma: number;
  callTheta: number; // per calendar day
  putTheta: number; // per calendar day
  vega: number; // per 1% vol change
  callRho: number; // per 1% rate change
  putRho: number; // per 1% rate change
  callIntrinsic: number;
  putIntrinsic: number;
  callTimeValue: number;
  putTimeValue: number;
  probITM: number; // N(d2) — risk-neutral prob call expires ITM
};

export function blackScholes(i: BSInputs): BSResult | null {
  const { spot: S, strike: K, expiry: T, rate: r, vol: sigma } = i;

  if (
    S <= 0 ||
    K <= 0 ||
    T <= 0 ||
    sigma <= 0 ||
    !Number.isFinite(S) ||
    !Number.isFinite(K) ||
    !Number.isFinite(T) ||
    !Number.isFinite(r) ||
    !Number.isFinite(sigma)
  ) {
    return null;
  }

  const sqrtT = Math.sqrt(T);
  const d1 =
    (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const Nm_d1 = normalCDF(-d1);
  const Nm_d2 = normalCDF(-d2);
  const nd1 = normalPDF(d1);
  const expRT = Math.exp(-r * T);

  const call = S * Nd1 - K * expRT * Nd2;
  const put = K * expRT * Nm_d2 - S * Nm_d1;

  const callDelta = Nd1;
  const putDelta = Nd1 - 1;

  const gamma = nd1 / (S * sigma * sqrtT);

  // Theta per calendar day
  const callThetaAnnual =
    -(S * nd1 * sigma) / (2 * sqrtT) - r * K * expRT * Nd2;
  const putThetaAnnual =
    -(S * nd1 * sigma) / (2 * sqrtT) + r * K * expRT * Nm_d2;
  const callTheta = callThetaAnnual / 365;
  const putTheta = putThetaAnnual / 365;

  // Vega per 1% change in vol
  const vegaRaw = S * nd1 * sqrtT;
  const vega = vegaRaw / 100;

  // Rho per 1% change in rate
  const callRho = (K * T * expRT * Nd2) / 100;
  const putRho = (-K * T * expRT * Nm_d2) / 100;

  const callIntrinsic = Math.max(0, S - K);
  const putIntrinsic = Math.max(0, K - S);
  const callTimeValue = Math.max(0, call - callIntrinsic);
  const putTimeValue = Math.max(0, put - putIntrinsic);

  const probITM = Nd2;

  return {
    call,
    put,
    d1,
    d2,
    callDelta,
    putDelta,
    gamma,
    callTheta,
    putTheta,
    vega,
    callRho,
    putRho,
    callIntrinsic,
    putIntrinsic,
    callTimeValue,
    putTimeValue,
    probITM,
  };
}

// Generate payoff-at-expiration series for recharts
export function payoffSeries(
  strike: number,
  callPremium: number,
  putPremium: number,
  spot: number
): Array<{ s: number; call: number; put: number }> {
  const center = strike;
  const low = center * 0.5;
  const high = center * 1.5;
  const step = (high - low) / 59;
  const points: Array<{ s: number; call: number; put: number }> = [];
  for (let i = 0; i < 60; i++) {
    const s = low + i * step;
    const call = Math.max(0, s - strike) - callPremium;
    const put = Math.max(0, strike - s) - putPremium;
    points.push({ s: parseFloat(s.toFixed(2)), call, put });
  }
  return points;
}
