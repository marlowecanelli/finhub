// Curated screening universe: a representative slice of large/mega-cap US
// equities across all 11 GICS sectors. Trimmed (vs the full S&P 500) so the
// snapshot refresh stays well under Yahoo's rate limits and the UI stays
// snappy. Extend this list to broaden coverage — the screener auto-handles it.
export type UniverseEntry = {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
};

export const UNIVERSE: readonly UniverseEntry[] = [
  // Information Technology
  { symbol: "AAPL", name: "Apple Inc.", sector: "Information Technology", industry: "Consumer Electronics" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Information Technology", industry: "Software" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Information Technology", industry: "Semiconductors" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Information Technology", industry: "Semiconductors" },
  { symbol: "ORCL", name: "Oracle Corp.", sector: "Information Technology", industry: "Software" },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Information Technology", industry: "Software" },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Information Technology", industry: "Software" },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Information Technology", industry: "Semiconductors" },
  { symbol: "QCOM", name: "Qualcomm Inc.", sector: "Information Technology", industry: "Semiconductors" },
  { symbol: "INTC", name: "Intel Corp.", sector: "Information Technology", industry: "Semiconductors" },
  { symbol: "CSCO", name: "Cisco Systems Inc.", sector: "Information Technology", industry: "Communications Equipment" },
  { symbol: "TXN", name: "Texas Instruments", sector: "Information Technology", industry: "Semiconductors" },
  { symbol: "IBM", name: "IBM Corp.", sector: "Information Technology", industry: "IT Services" },
  { symbol: "AMAT", name: "Applied Materials", sector: "Information Technology", industry: "Semiconductor Equipment" },
  { symbol: "MU", name: "Micron Technology", sector: "Information Technology", industry: "Semiconductors" },
  { symbol: "NOW", name: "ServiceNow Inc.", sector: "Information Technology", industry: "Software" },
  { symbol: "INTU", name: "Intuit Inc.", sector: "Information Technology", industry: "Software" },
  { symbol: "PANW", name: "Palo Alto Networks", sector: "Information Technology", industry: "Software" },
  { symbol: "SNOW", name: "Snowflake Inc.", sector: "Information Technology", industry: "Software" },
  { symbol: "PLTR", name: "Palantir Technologies", sector: "Information Technology", industry: "Software" },

  // Communication Services
  { symbol: "GOOGL", name: "Alphabet Inc. (A)", sector: "Communication Services", industry: "Interactive Media" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Communication Services", industry: "Interactive Media" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication Services", industry: "Entertainment" },
  { symbol: "DIS", name: "Walt Disney Co.", sector: "Communication Services", industry: "Entertainment" },
  { symbol: "TMUS", name: "T-Mobile US Inc.", sector: "Communication Services", industry: "Wireless Telecom" },
  { symbol: "VZ", name: "Verizon Communications", sector: "Communication Services", industry: "Telecom" },
  { symbol: "T", name: "AT&T Inc.", sector: "Communication Services", industry: "Telecom" },
  { symbol: "CMCSA", name: "Comcast Corp.", sector: "Communication Services", industry: "Media" },
  { symbol: "WBD", name: "Warner Bros. Discovery", sector: "Communication Services", industry: "Entertainment" },
  { symbol: "EA", name: "Electronic Arts Inc.", sector: "Communication Services", industry: "Entertainment" },

  // Consumer Discretionary
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", industry: "Internet Retail" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", industry: "Automobiles" },
  { symbol: "HD", name: "Home Depot Inc.", sector: "Consumer Discretionary", industry: "Specialty Retail" },
  { symbol: "MCD", name: "McDonald's Corp.", sector: "Consumer Discretionary", industry: "Restaurants" },
  { symbol: "NKE", name: "Nike Inc.", sector: "Consumer Discretionary", industry: "Apparel" },
  { symbol: "LOW", name: "Lowe's Companies", sector: "Consumer Discretionary", industry: "Specialty Retail" },
  { symbol: "SBUX", name: "Starbucks Corp.", sector: "Consumer Discretionary", industry: "Restaurants" },
  { symbol: "BKNG", name: "Booking Holdings", sector: "Consumer Discretionary", industry: "Hotels & Travel" },
  { symbol: "TJX", name: "TJX Companies", sector: "Consumer Discretionary", industry: "Specialty Retail" },
  { symbol: "F", name: "Ford Motor Co.", sector: "Consumer Discretionary", industry: "Automobiles" },
  { symbol: "GM", name: "General Motors", sector: "Consumer Discretionary", industry: "Automobiles" },
  { symbol: "ABNB", name: "Airbnb Inc.", sector: "Consumer Discretionary", industry: "Hotels & Travel" },

  // Consumer Staples
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer Staples", industry: "Hypermarkets" },
  { symbol: "PG", name: "Procter & Gamble", sector: "Consumer Staples", industry: "Household Products" },
  { symbol: "KO", name: "Coca-Cola Co.", sector: "Consumer Staples", industry: "Beverages" },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Consumer Staples", industry: "Beverages" },
  { symbol: "COST", name: "Costco Wholesale", sector: "Consumer Staples", industry: "Hypermarkets" },
  { symbol: "PM", name: "Philip Morris Intl.", sector: "Consumer Staples", industry: "Tobacco" },
  { symbol: "MDLZ", name: "Mondelez International", sector: "Consumer Staples", industry: "Packaged Foods" },
  { symbol: "CL", name: "Colgate-Palmolive", sector: "Consumer Staples", industry: "Household Products" },
  { symbol: "TGT", name: "Target Corp.", sector: "Consumer Staples", industry: "General Merchandise" },
  { symbol: "MO", name: "Altria Group", sector: "Consumer Staples", industry: "Tobacco" },

  // Health Care
  { symbol: "LLY", name: "Eli Lilly & Co.", sector: "Health Care", industry: "Pharmaceuticals" },
  { symbol: "UNH", name: "UnitedHealth Group", sector: "Health Care", industry: "Health Insurance" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Health Care", industry: "Pharmaceuticals" },
  { symbol: "ABBV", name: "AbbVie Inc.", sector: "Health Care", industry: "Pharmaceuticals" },
  { symbol: "MRK", name: "Merck & Co.", sector: "Health Care", industry: "Pharmaceuticals" },
  { symbol: "TMO", name: "Thermo Fisher Scientific", sector: "Health Care", industry: "Life Sciences Tools" },
  { symbol: "ABT", name: "Abbott Laboratories", sector: "Health Care", industry: "Health Care Equipment" },
  { symbol: "DHR", name: "Danaher Corp.", sector: "Health Care", industry: "Life Sciences Tools" },
  { symbol: "PFE", name: "Pfizer Inc.", sector: "Health Care", industry: "Pharmaceuticals" },
  { symbol: "AMGN", name: "Amgen Inc.", sector: "Health Care", industry: "Biotechnology" },
  { symbol: "GILD", name: "Gilead Sciences", sector: "Health Care", industry: "Biotechnology" },
  { symbol: "BMY", name: "Bristol-Myers Squibb", sector: "Health Care", industry: "Pharmaceuticals" },
  { symbol: "ISRG", name: "Intuitive Surgical", sector: "Health Care", industry: "Health Care Equipment" },
  { symbol: "VRTX", name: "Vertex Pharmaceuticals", sector: "Health Care", industry: "Biotechnology" },
  { symbol: "REGN", name: "Regeneron Pharma", sector: "Health Care", industry: "Biotechnology" },

  // Financials
  { symbol: "BRK-B", name: "Berkshire Hathaway B", sector: "Financials", industry: "Diversified Financial" },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financials", industry: "Banks" },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", industry: "Payment Networks" },
  { symbol: "MA", name: "Mastercard Inc.", sector: "Financials", industry: "Payment Networks" },
  { symbol: "BAC", name: "Bank of America", sector: "Financials", industry: "Banks" },
  { symbol: "WFC", name: "Wells Fargo & Co.", sector: "Financials", industry: "Banks" },
  { symbol: "GS", name: "Goldman Sachs Group", sector: "Financials", industry: "Capital Markets" },
  { symbol: "MS", name: "Morgan Stanley", sector: "Financials", industry: "Capital Markets" },
  { symbol: "AXP", name: "American Express", sector: "Financials", industry: "Consumer Finance" },
  { symbol: "BLK", name: "BlackRock Inc.", sector: "Financials", industry: "Asset Management" },
  { symbol: "C", name: "Citigroup Inc.", sector: "Financials", industry: "Banks" },
  { symbol: "SCHW", name: "Charles Schwab", sector: "Financials", industry: "Capital Markets" },
  { symbol: "PYPL", name: "PayPal Holdings", sector: "Financials", industry: "Payment Networks" },
  { symbol: "COF", name: "Capital One Financial", sector: "Financials", industry: "Consumer Finance" },

  // Industrials
  { symbol: "GE", name: "GE Aerospace", sector: "Industrials", industry: "Aerospace & Defense" },
  { symbol: "CAT", name: "Caterpillar Inc.", sector: "Industrials", industry: "Construction Machinery" },
  { symbol: "RTX", name: "RTX Corp.", sector: "Industrials", industry: "Aerospace & Defense" },
  { symbol: "HON", name: "Honeywell International", sector: "Industrials", industry: "Industrial Conglomerates" },
  { symbol: "UNP", name: "Union Pacific Corp.", sector: "Industrials", industry: "Railroads" },
  { symbol: "BA", name: "Boeing Co.", sector: "Industrials", industry: "Aerospace & Defense" },
  { symbol: "DE", name: "Deere & Co.", sector: "Industrials", industry: "Agricultural Machinery" },
  { symbol: "LMT", name: "Lockheed Martin", sector: "Industrials", industry: "Aerospace & Defense" },
  { symbol: "UPS", name: "United Parcel Service", sector: "Industrials", industry: "Air Freight" },
  { symbol: "ETN", name: "Eaton Corp.", sector: "Industrials", industry: "Electrical Equipment" },
  { symbol: "MMM", name: "3M Co.", sector: "Industrials", industry: "Industrial Conglomerates" },
  { symbol: "FDX", name: "FedEx Corp.", sector: "Industrials", industry: "Air Freight" },

  // Energy
  { symbol: "XOM", name: "Exxon Mobil Corp.", sector: "Energy", industry: "Oil & Gas" },
  { symbol: "CVX", name: "Chevron Corp.", sector: "Energy", industry: "Oil & Gas" },
  { symbol: "COP", name: "ConocoPhillips", sector: "Energy", industry: "Oil & Gas" },
  { symbol: "SLB", name: "SLB", sector: "Energy", industry: "Oil & Gas Equipment" },
  { symbol: "EOG", name: "EOG Resources", sector: "Energy", industry: "Oil & Gas E&P" },
  { symbol: "MPC", name: "Marathon Petroleum", sector: "Energy", industry: "Oil & Gas Refining" },
  { symbol: "PSX", name: "Phillips 66", sector: "Energy", industry: "Oil & Gas Refining" },
  { symbol: "OXY", name: "Occidental Petroleum", sector: "Energy", industry: "Oil & Gas E&P" },

  // Utilities
  { symbol: "NEE", name: "NextEra Energy", sector: "Utilities", industry: "Electric Utilities" },
  { symbol: "DUK", name: "Duke Energy Corp.", sector: "Utilities", industry: "Electric Utilities" },
  { symbol: "SO", name: "Southern Co.", sector: "Utilities", industry: "Electric Utilities" },
  { symbol: "D", name: "Dominion Energy", sector: "Utilities", industry: "Electric Utilities" },
  { symbol: "AEP", name: "American Electric Power", sector: "Utilities", industry: "Electric Utilities" },

  // Real Estate
  { symbol: "PLD", name: "Prologis Inc.", sector: "Real Estate", industry: "Industrial REITs" },
  { symbol: "AMT", name: "American Tower", sector: "Real Estate", industry: "Specialized REITs" },
  { symbol: "EQIX", name: "Equinix Inc.", sector: "Real Estate", industry: "Specialized REITs" },
  { symbol: "CCI", name: "Crown Castle Inc.", sector: "Real Estate", industry: "Specialized REITs" },
  { symbol: "PSA", name: "Public Storage", sector: "Real Estate", industry: "Specialized REITs" },
  { symbol: "O", name: "Realty Income Corp.", sector: "Real Estate", industry: "Retail REITs" },

  // Materials
  { symbol: "LIN", name: "Linde plc", sector: "Materials", industry: "Industrial Gases" },
  { symbol: "SHW", name: "Sherwin-Williams", sector: "Materials", industry: "Specialty Chemicals" },
  { symbol: "FCX", name: "Freeport-McMoRan", sector: "Materials", industry: "Copper" },
  { symbol: "NEM", name: "Newmont Corp.", sector: "Materials", industry: "Gold" },
  { symbol: "APD", name: "Air Products & Chemicals", sector: "Materials", industry: "Industrial Gases" },
  { symbol: "DOW", name: "Dow Inc.", sector: "Materials", industry: "Commodity Chemicals" },
] as const;
