export type CriterionEducation = {
  criterionId: string;
  criterionName: string;
  explanation: string;
  quote: string;
  quoteAttribution: string;
};

export const CRITERION_EDUCATION: CriterionEducation[] = [
  {
    criterionId: "moat",
    criterionName: "Economic Moat",
    explanation:
      `Warren Buffett coined the term "economic moat" to describe a structural competitive advantage that protects a business from rivals, much like a castle moat wards off attackers. A business without a moat is simply a commodity -- eventually ground down to cost-of-capital returns by competition. Moats take several forms: an iconic consumer brand that commands pricing power, network effects that make a platform more valuable as it grows, switching costs that lock customers in, durable cost advantages, or efficient scale in a market that supports only one or two competitors. The test is simple but demanding: could a well-capitalized competitor replicate this business's economics within a decade? A wide moat says no. Buffett's emphasis on moats also explains his preference for simple, understandable businesses -- if you cannot explain why customers keep coming back, you probably cannot assess how long the advantage will last. Moat is the single most important determinant of long-run returns.`,
    quote: "In business, I look for economic castles protected by unbreachable moats.",
    quoteAttribution: "Warren Buffett, 1995 Shareholder Letter",
  },
  {
    criterionId: "earningsGrowth",
    criterionName: "Consistent Earnings Growth",
    explanation:
      "Buffett has always valued predictability over peak performance. A business that grows earnings consistently -- through recessions, rate cycles, and competitive shifts -- has proven that its model genuinely works. Erratic or declining earnings signal cyclicality, pricing-power erosion, or a management team that is spending rather than compounding. A five-year track record of positive, growing EPS also separates organic business improvement from financial engineering: share buybacks can inflate per-share earnings even when the underlying business stagnates. Buffett studies normalized, per-share earnings growth because it reveals whether management is actually growing the pie or merely slicing it into fewer pieces. A five-year EPS CAGR above five percent, with no losing years, is the minimum bar. Sustained double-digit growth is exceptional. The goal is not the number itself but the confidence that the earnings stream is durable and will be there ten or twenty years from now.",
    quote: "I want businesses with predictable, consistent earnings.",
    quoteAttribution: "Warren Buffett (paraphrase, widely reported)",
  },
  {
    criterionId: "roe",
    criterionName: "Strong Return on Equity",
    explanation:
      "Return on equity (ROE) measures how effectively management converts shareholders' capital into profit. Buffett has long used ROE as a litmus test for business quality, famously seeking companies that can earn high returns without unusual leverage. An ROE above fifteen percent over five years indicates a business with genuine pricing power and capital efficiency -- it makes more money than it needs to reinvest just to stand still. High ROE is only impressive without excessive debt propping it up; this criterion filters for that by examining the average over multiple years rather than a single peak. Businesses that compound equity at high rates effectively compound wealth for long-term shareholders. Conversely, a company that earns low returns on equity must constantly raise capital -- diluting shareholders -- or stagnate. Buffett's great compounding machines (GEICO, See's Candies, Coca-Cola) share one trait: they earn exceptional returns on the capital entrusted to them year after year.",
    quote: "The best business to own is one that over an extended period can employ large amounts of capital at very high rates of return.",
    quoteAttribution: "Warren Buffett, 1992 Shareholder Letter",
  },
  {
    criterionId: "debt",
    criterionName: "Low Debt",
    explanation:
      "Buffett is deeply skeptical of leverage. While debt can amplify returns in good times, it shrinks a business's margin of safety and can transform a temporary setback into an existential crisis. His preferred businesses -- insurance, consumer staples, dominant franchises -- generate so much cash that they rarely need to borrow. The ideal business is one that could pay off all its debt from a few years of earnings. Buffett also recognizes that high debt constrains management's flexibility: companies burdened by interest expense cannot opportunistically invest during downturns, buy back shares cheaply, or weather industry disruption with patience. This criterion examines two metrics: the debt-to-equity ratio (structural leverage) and long-term debt as a multiple of annual net income (repayment feasibility). Either can pass. A business with minimal debt and strong cash generation is positioned to be aggressive when others must be defensive -- a decisive competitive advantage during market dislocations.",
    quote: "I've seen more people fail because of liquor and leverage.",
    quoteAttribution: "Warren Buffett",
  },
  {
    criterionId: "margins",
    criterionName: "High Profit Margins",
    explanation:
      "Net profit margins above ten percent reflect genuine pricing power and cost discipline -- two hallmarks of a Buffett-style business. A company that retains more than ten cents of every revenue dollar after all expenses is one whose customers are not easily poached by cheaper alternatives. Equally important is margin stability or expansion over time. Shrinking margins are a warning sign: they suggest either that competition is intensifying, that input costs are rising faster than prices, or that the business is sacrificing profitability to chase growth. Buffett prefers businesses that can raise prices without losing volume -- the clearest test of pricing power. He has often noted that the single most important decision in evaluating a business is its pricing power. High, stable margins are that pricing power made visible. They also create a natural reinvestment cushion: businesses with fat margins can weather disruption, fund research and development, and return capital to shareholders without straining the balance sheet.",
    quote: "The single most important decision in evaluating a business is pricing power.",
    quoteAttribution: "Warren Buffett, CNBC interview, 2011",
  },
  {
    criterionId: "predictability",
    criterionName: "Predictable Business",
    explanation:
      "Buffett has repeatedly said he only invests in businesses whose economics he can project ten to twenty years into the future with reasonable confidence. Predictability is not the same as stability -- a rapidly growing company can be highly predictable if its end market is durable and its competitive position is clear. What Buffett avoids is volatility he cannot explain: commodity price swings, binary regulatory outcomes, technology disruption curves, and exploration-stage risk. Consumer staples, insurance, financial services, simple industrials, and dominant franchises tend to produce steady, forecastable revenue streams. Biotech pipelines, cyclical materials producers, and deep-cycle technology companies do not. The practical test: if revenue or earnings swung wildly over the past five years and you cannot articulate why, the future will be equally hard to read. Predictability also makes valuation more reliable -- you can own a predictable business with confidence, whereas an unpredictable one is really speculation dressed in a business suit.",
    quote: "I never attempt to make money on the stock market. I buy on the assumption that they could close the market the next day.",
    quoteAttribution: "Warren Buffett",
  },
  {
    criterionId: "management",
    criterionName: "Capable Management",
    explanation:
      "Buffett invests in managers as much as businesses, but he also insists that great management cannot rescue a mediocre business. Within a good business, however, management quality is decisive. His benchmarks are practical: does management allocate capital toward its highest-return use, or does it hoard cash, make dilutive acquisitions, or over-compensate itself? Do insiders own meaningful stakes, aligning their interests with shareholders? Has the company consistently earned returns on invested capital above its cost of capital -- the definition of value creation? Buffett reads annual reports looking for candor: managers who plainly explain mistakes, quantify trade-offs, and focus shareholder letters on per-share value rather than glamour metrics. He has said the best managers act like owners, not hired hands. This criterion combines quantitative signals (ROIC, insider ownership) with qualitative signals (tone and substance of the management narrative) to produce a composite view of stewardship quality.",
    quote: "We look for three things when we hire people: intelligence, initiative, and integrity. And if they don't have the last one, the first two will kill you.",
    quoteAttribution: "Warren Buffett",
  },
  {
    criterionId: "capitalAllocation",
    criterionName: "Shareholder-Friendly Capital Allocation",
    explanation:
      "A business that earns high returns is only as valuable as its capital allocation -- the choices management makes about what to do with the cash. Buffett sees three acceptable uses of excess cash in order of preference: reinvest at high returns in the core business, make sensible acquisitions at fair prices, and return capital to shareholders through buybacks or dividends. He is deeply critical of share-count dilution: companies that persistently issue shares are quietly taxing long-term owners. He equally dislikes excessive stock-based compensation, which transfers real economic value from shareholders to employees while hiding in the equity statement. A shrinking share count, a multi-year dividend growth streak, and modest SBC as a percentage of revenue are the external signals of a management team that takes capital discipline seriously. These metrics are easy to falsify in any single year but very hard to sustain artificially across five or ten years -- making them reliable long-term signals.",
    quote: "The best thing a company can do for its shareholders is to repurchase its shares when they're undervalued.",
    quoteAttribution: "Warren Buffett (paraphrase, widely reported)",
  },
  {
    criterionId: "valuation",
    criterionName: "Reasonable Valuation",
    explanation:
      "Even the greatest business becomes a poor investment at a high enough price. Buffett's famous observation -- price is what you pay, value is what you get -- captures this perfectly. Valuation is the last criterion because it only matters after you've established that the underlying business is worth owning. This criterion checks three things: whether the P/E ratio is reasonable, whether the free cash flow yield exceeds five percent (meaning the market is not asking you to pay too much for the cash the business generates), and whether a conservative discounted cash flow model suggests the stock is trading below its intrinsic value. The DCF uses a deliberately modest growth assumption -- capped at ten percent, reflecting realistic compounding -- and a nine percent discount rate. A margin of safety of more than twenty percent below intrinsic value is required for a pass. Buffett has always demanded a margin of safety: it protects against analytical errors, unforeseen competition, and the inevitable surprises that come with any long-term investment.",
    quote: "Price is what you pay. Value is what you get.",
    quoteAttribution: "Warren Buffett, 2008 Shareholder Letter",
  },
  {
    criterionId: "trackRecord",
    criterionName: "Long-Term Track Record",
    explanation:
      "Buffett is a long-term investor in every sense: he holds for years or decades, and he demands evidence that a business has also been durable over long periods. A ten-year track record of profitability -- with positive net income in at least eight of ten years -- filters out businesses that appear strong in the current cycle but crumble in downturns. Five-year stock price appreciation in excess of zero confirms that the market has recognized value creation over time. An unbroken dividend history of ten or more years is the ultimate signal of management confidence: no rational board maintains or raises dividends through uncertainty unless the underlying cash flows genuinely support it. Together, these indicators answer the most important long-term question: has this business actually proven it can survive and compound through adversity? Track record does not guarantee the future, but it is the strongest available evidence that the business model is real, the moat is genuine, and the management is disciplined.",
    quote: "If you aren't willing to own a stock for ten years, don't even think about owning it for ten minutes.",
    quoteAttribution: "Warren Buffett, 1996 Shareholder Letter",
  },
];
