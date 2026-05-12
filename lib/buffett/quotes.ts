export type BuffettQuote = {
  text: string;
  attribution: string;
};

export const BUFFETT_QUOTES: BuffettQuote[] = [
  {
    text: "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price.",
    attribution: "Warren Buffett, 1989 Shareholder Letter",
  },
  {
    text: "Our favorite holding period is forever.",
    attribution: "Warren Buffett, 1988 Shareholder Letter",
  },
  {
    text: "Price is what you pay. Value is what you get.",
    attribution: "Warren Buffett, 2008 Shareholder Letter",
  },
  {
    text: "Be fearful when others are greedy, and greedy when others are fearful.",
    attribution: "Warren Buffett, 2004 Shareholder Letter",
  },
  {
    text: "Risk comes from not knowing what you're doing.",
    attribution: "Warren Buffett",
  },
  {
    text: "The stock market is a device for transferring money from the impatient to the patient.",
    attribution: "Warren Buffett",
  },
  {
    text: "Time is the friend of the wonderful business, the enemy of the mediocre.",
    attribution: "Warren Buffett, 1989 Shareholder Letter",
  },
  {
    text: "Should you find yourself in a chronically leaking boat, energy devoted to changing vessels is likely to be more productive than energy devoted to patching leaks.",
    attribution: "Warren Buffett",
  },
  {
    text: "If a business does well, the stock eventually follows.",
    attribution: "Warren Buffett",
  },
  {
    text: "The most important investment you can make is in yourself.",
    attribution: "Warren Buffett",
  },
  {
    text: "I'd rather be approximately right than precisely wrong.",
    attribution: "Warren Buffett (paraphrasing John Maynard Keynes)",
  },
  {
    text: "Wide diversification is only required when investors do not understand what they are doing.",
    attribution: "Warren Buffett",
  },
  {
    text: "In the short run, the market is a voting machine. In the long run, it is a weighing machine.",
    attribution: "Benjamin Graham (Buffett's mentor)",
  },
  {
    text: "Never invest in a business you cannot understand.",
    attribution: "Warren Buffett",
  },
  {
    text: "The business schools reward difficult complex behavior more than simple behavior, but simple behavior is more effective.",
    attribution: "Warren Buffett",
  },
];

/**
 * Deterministically select a quote based on ticker and today's date.
 * Stable per-day per-ticker.
 */
export function getQuoteForTicker(ticker: string): BuffettQuote {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${ticker.toUpperCase()}:${today}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return BUFFETT_QUOTES[hash % BUFFETT_QUOTES.length] ?? BUFFETT_QUOTES[0]!;
}
