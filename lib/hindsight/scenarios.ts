import type { Scenario } from "./types";

export const SCENARIOS: Scenario[] = [
  {
    key: "gfc-2008",
    name: "2008 Financial Crisis",
    start: "2008-09-01",
    end: "2009-03-09",
    teaser: "Lehman fails. Credit freezes. Markets lose half their value.",
    narrative:
      "When Lehman Brothers filed for bankruptcy in September 2008, it triggered the worst financial panic since 1929. Credit markets seized, banks teetered, and the S&P 500 lost more than half its value over six months. By the time the bottom hit on March 9, 2009, the average American 401(k) had been gutted, and few investors believed recovery was possible.",
    keyEvents: [
      { date: "2008-09-15", label: "Lehman files Chapter 11" },
      { date: "2008-10-03", label: "TARP signed into law" },
      { date: "2008-12-16", label: "Fed cuts rates to near zero" },
      { date: "2009-03-09", label: "S&P 500 bottoms at 676" },
    ],
  },
  {
    key: "covid-2020",
    name: "2020 COVID Crash",
    start: "2020-02-19",
    end: "2020-04-07",
    teaser: "The fastest bear market in history. And the fastest recovery.",
    narrative:
      "The S&P 500 fell 34% in 33 days, the fastest descent into bear-market territory ever recorded. Lockdowns shuttered the global economy overnight. Then the Fed and Congress acted at unprecedented scale, and stocks recovered all losses in five months. Investors who panic-sold at the bottom missed one of history's sharpest rebounds.",
    keyEvents: [
      { date: "2020-02-19", label: "S&P 500 all-time high" },
      { date: "2020-03-12", label: "WHO declares pandemic" },
      { date: "2020-03-15", label: "Fed cuts to zero, restarts QE" },
      { date: "2020-03-23", label: "Market bottom" },
    ],
  },
  {
    key: "rate-hikes-2022",
    name: "2022 Rate Hike Cycle",
    start: "2022-01-03",
    end: "2022-10-12",
    teaser: "Inflation runs hot. The Fed hikes the fastest in 40 years.",
    narrative:
      "Stocks and bonds fell together for the first time in modern memory as the Fed lifted rates from 0% to 4.5% in nine months. Long-duration tech, the darling of the prior decade, was punished hardest. The 60/40 portfolio had its worst year since 1937. Investors learned what 'duration risk' actually feels like.",
    keyEvents: [
      { date: "2022-01-03", label: "S&P 500 all-time high" },
      { date: "2022-03-16", label: "Fed begins hiking cycle" },
      { date: "2022-06-13", label: "S&P enters bear market" },
      { date: "2022-10-12", label: "Cycle low" },
    ],
  },
  {
    key: "dotcom-2000",
    name: "2000 Dot-Com Bust",
    start: "2000-03-10",
    end: "2002-10-09",
    teaser: "Two and a half years of grinding decline. The Nasdaq lost 78%.",
    narrative:
      "After a euphoric run-up driven by internet mania, the Nasdaq peaked on March 10, 2000 and proceeded to lose nearly four-fifths of its value over thirty-one months. Many tech leaders never recovered. The S&P 500 fell 49%. This was the slow-motion crash, where 'this time is different' was beaten out of a generation of investors.",
    keyEvents: [
      { date: "2000-03-10", label: "Nasdaq peak at 5048" },
      { date: "2001-09-11", label: "September 11 attacks" },
      { date: "2002-07-21", label: "WorldCom bankruptcy" },
      { date: "2002-10-09", label: "Bear market bottom" },
    ],
  },
  {
    key: "black-monday-1987",
    name: "1987 Black Monday",
    start: "1987-10-01",
    end: "1987-11-30",
    teaser: "October 19. The Dow fell 22.6% in a single session.",
    narrative:
      "The largest one-day percentage drop in stock market history. Program trading, portfolio insurance, and a cascade of selling vaporized a fifth of the market's value before lunch. Yet by year-end, stocks had clawed back most of the loss. For investors who held on, 1987 ended in the green.",
    keyEvents: [
      { date: "1987-10-19", label: "Black Monday: Dow -22.6%" },
      { date: "1987-10-20", label: "Fed pledges liquidity" },
    ],
  },
];

export function getScenario(key: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.key === key);
}
