// ─────────────────────────────────────────────────────────────
// FinHub · Impact data
// Swap the numbers below with real assessment results when ready.
// Everything the #impact section renders is driven from this file.
// ─────────────────────────────────────────────────────────────

export type AssessmentSlice = {
  label: string;
  value: number; // percentage point (0–100)
};

export type AssessmentSet = {
  /** Headline shown above the chart, e.g. "40% confident". */
  headline: string;
  /** Two slices that sum to 100. */
  slices: [AssessmentSlice, AssessmentSlice];
};

/**
 * Pre/post survey results from the Bigelow Middle School visit.
 * PLACEHOLDER DATA — replace `value` and `headline` with real numbers.
 */
export const ASSESSMENT_DATA: {
  before: AssessmentSet;
  after: AssessmentSet;
} = {
  before: {
    headline: "40% confident",
    slices: [
      { label: "Confident", value: 40 },
      { label: "Not yet confident", value: 60 },
    ],
  },
  after: {
    headline: "85% confident",
    slices: [
      { label: "Confident", value: 85 },
      { label: "Not yet confident", value: 15 },
    ],
  },
};

/** Whether the figures above are still placeholders. Set to false once real data is in. */
export const ASSESSMENT_IS_PLACEHOLDER = true;

/** The Bigelow Middle School case study. */
export const CASE_STUDIES = [
  {
    school: "Bigelow Middle School",
    date: "05/26/2026",
    dateLabel: "May 26, 2026",
    eyebrow: "Field Note · 01",
    summary:
      "We ran an interactive presentation on spending and saving, banking, and how money works in everyday life, then closed with a Jeopardy-style review game so students could apply what they learned as teams.",
    topics: ["Spending & saving", "Banking basics", "Money in everyday life", "Jeopardy review game"],
  },
] as const;
