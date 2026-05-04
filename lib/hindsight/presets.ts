export type Preset = {
  ticker: string;
  date: string;
  label: string;
  blurb: string;
};

export const PRESETS: Preset[] = [
  { ticker: "AAPL", date: "1980-12-12", label: "Apple at IPO", blurb: "The original four-comma trade." },
  { ticker: "AMZN", date: "1997-05-15", label: "Amazon at IPO", blurb: "From bookstore to everything." },
  { ticker: "NVDA", date: "2015-01-02", label: "Nvidia, pre-AI", blurb: "Before anyone said GPU at dinner." },
  { ticker: "TSLA", date: "2013-01-02", label: "Tesla, pre-Model 3", blurb: "Back when it was a sci-fi bet." },
  { ticker: "BTC-USD", date: "2014-01-01", label: "Bitcoin", blurb: "Internet money, ten years on." },
  { ticker: "^GSPC", date: "2000-01-03", label: "S&P 500", blurb: "Boring, broad, and steady." },
];

export const CRISIS_EVENTS: { date: string; label: string }[] = [
  { date: "1987-10-19", label: "Black Monday" },
  { date: "2000-03-10", label: "Dot-com peak" },
  { date: "2008-09-15", label: "Lehman files" },
  { date: "2020-03-23", label: "COVID bottom" },
  { date: "2022-06-13", label: "Bear market 2022" },
];
