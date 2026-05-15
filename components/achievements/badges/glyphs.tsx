import * as React from "react";

/**
 * Each glyph is a centered mark drawn within the inner circle (r=20 around
 * 32,32). Stroke color is inherited from currentColor so the parent badge
 * controls tint. Keep marks geometric, no emoji, no cute mascots.
 */

const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.4,
  fill: "none" as const,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Onboarding ----------------------------------------------------------------

export function GlyphWelcome() {
  return (
    <g>
      <path {...STROKE} d="M32 22 C26 22 24 26 24 31 V37 H40 V31 C40 26 38 22 32 22 Z" />
      <path {...STROKE} d="M22 39 H42" />
      <circle cx={32} cy={42} r={1.6} fill="currentColor" />
    </g>
  );
}

export function GlyphHelloWallStreet() {
  return (
    <g>
      <path {...STROKE} d="M22 40 L28 34 L32 36 L42 24" />
      <circle cx={42} cy={24} r={1.6} fill="currentColor" />
      <path {...STROKE} d="M22 42 H42" />
    </g>
  );
}

export function GlyphArchitect() {
  return (
    <g>
      <path {...STROKE} d="M22 26 H42" />
      <path {...STROKE} d="M22 41 H42" />
      <path {...STROKE} d="M25 26 V41" />
      <path {...STROKE} d="M32 26 V41" />
      <path {...STROKE} d="M39 26 V41" />
      <path {...STROKE} d="M20 24 L32 19 L44 24" />
    </g>
  );
}

export function GlyphWatcher() {
  return (
    <g>
      <path {...STROKE} d="M21 32 C24 26 28 24 32 24 C36 24 40 26 43 32 C40 38 36 40 32 40 C28 40 24 38 21 32 Z" />
      <circle cx={32} cy={32} r={3} {...STROKE} />
      <circle cx={32} cy={32} r={1.2} fill="currentColor" />
    </g>
  );
}

export function GlyphNumberCruncher() {
  return (
    <g>
      <rect x={23} y={22} width={18} height={22} rx={2} {...STROKE} />
      <rect x={25} y={24} width={14} height={4} rx={1} {...STROKE} />
      {[28, 32, 36].map((cx) => (
        <React.Fragment key={cx}>
          <circle cx={cx} cy={32} r={1.2} fill="currentColor" />
          <circle cx={cx} cy={37} r={1.2} fill="currentColor" />
        </React.Fragment>
      ))}
    </g>
  );
}

export function GlyphNewsie() {
  return (
    <g>
      <rect x={22} y={23} width={20} height={18} rx={1.5} {...STROKE} />
      <path {...STROKE} d="M25 28 H35" />
      <path {...STROKE} d="M25 31 H39" />
      <path {...STROKE} d="M25 34 H37" />
      <path {...STROKE} d="M25 37 H33" />
    </g>
  );
}

export function GlyphCustomBuilt() {
  return (
    <g>
      <path {...STROKE} d="M22 24 H42 L34 33 V42 L30 40 V33 Z" />
    </g>
  );
}

export function GlyphCyborg() {
  return (
    <g>
      <path {...STROKE} d="M24 32 A8 8 0 0 1 40 32" />
      <path {...STROKE} d="M40 32 A8 8 0 0 1 24 32" />
      <circle cx={28} cy={32} r={1.4} fill="currentColor" />
      <circle cx={36} cy={32} r={1.4} fill="currentColor" />
      <path {...STROKE} d="M26 26 L26 22" />
      <path {...STROKE} d="M38 26 L38 22" />
    </g>
  );
}

// Research ------------------------------------------------------------------

export function GlyphCuriousMind() {
  return (
    <g>
      <circle cx={30} cy={32} r={6} {...STROKE} />
      <path {...STROKE} d="M35 37 L42 44" />
      <path {...STROKE} d="M27 32 H33" />
      <path {...STROKE} d="M30 29 V35" />
    </g>
  );
}

export function GlyphMarketAnalyst() {
  return (
    <g>
      <path {...STROKE} d="M22 42 H42" />
      {Array.from({ length: 5 }).map((_, i) => (
        <rect
          key={i}
          x={23 + i * 4}
          y={42 - (i + 1) * 2.5}
          width={2}
          height={(i + 1) * 2.5}
          fill="currentColor"
        />
      ))}
      <path {...STROKE} d="M22 24 L42 24" strokeDasharray="2 2" />
    </g>
  );
}

export function GlyphEquityExplorer() {
  return (
    <g>
      <circle cx={32} cy={32} r={10} {...STROKE} />
      <path d="M32 24 L34 32 L32 40 L30 32 Z" fill="currentColor" />
      <circle cx={32} cy={32} r={1.4} fill="currentColor" />
    </g>
  );
}

export function GlyphWallStreetWalker() {
  return (
    <g>
      <path {...STROKE} d="M22 42 H42" />
      <rect x={23} y={32} width={4} height={10} {...STROKE} />
      <rect x={28} y={28} width={4} height={14} {...STROKE} />
      <rect x={33} y={24} width={4} height={18} {...STROKE} />
      <rect x={38} y={30} width={3} height={12} {...STROKE} />
    </g>
  );
}

export function GlyphCenturion() {
  return (
    <g>
      <path {...STROKE} d="M40 26 A10 10 0 1 0 40 38" />
      <text x={32} y={36} textAnchor="middle" fontSize={9} fill="currentColor" fontFamily="serif">
        100
      </text>
    </g>
  );
}

export function GlyphDeepDiver() {
  return (
    <g>
      <path {...STROKE} d="M32 22 V42" />
      <path {...STROKE} d="M26 36 L32 42 L38 36" />
      <path {...STROKE} d="M24 28 C24 28 28 30 32 28 C36 26 40 28 40 28" />
      <path {...STROKE} d="M24 33 C24 33 28 35 32 33 C36 31 40 33 40 33" />
    </g>
  );
}

export function GlyphEarningsHawk() {
  return (
    <g>
      <rect x={23} y={23} width={18} height={18} rx={2} {...STROKE} />
      <path {...STROKE} d="M23 28 H41" />
      <path {...STROKE} d="M28 23 V21" />
      <path {...STROKE} d="M36 23 V21" />
      <path {...STROKE} d="M27 34 L30 31 L33 34 L38 28" />
    </g>
  );
}

export function GlyphChartReader() {
  return (
    <g>
      {/* Candlestick chart */}
      <path {...STROKE} d="M22 42 H42" />
      {/* Candle 1 (red) */}
      <rect x={24} y={30} width={3} height={8} fill="currentColor" opacity={0.5} />
      <path {...STROKE} d="M25.5 28 V30 M25.5 38 V41" />
      {/* Candle 2 (green) */}
      <rect x={30} y={26} width={3} height={10} fill="currentColor" />
      <path {...STROKE} d="M31.5 23 V26 M31.5 36 V40" />
      {/* Candle 3 */}
      <rect x={36} y={29} width={3} height={7} fill="currentColor" opacity={0.7} />
      <path {...STROKE} d="M37.5 26 V29 M37.5 36 V41" />
    </g>
  );
}

export function GlyphScreenedIn() {
  return (
    <g>
      <path {...STROKE} d="M22 24 H42 L34 33 V42 L30 40 V33 Z" />
      <circle cx={39} cy={39} r={4} fill="currentColor" opacity={0.2} stroke="currentColor" strokeWidth={1.4} />
      <path {...STROKE} d="M37.5 39 L38.5 40 L41 37.5" />
    </g>
  );
}

export function GlyphFilterJockey() {
  return (
    <g>
      <path {...STROKE} d="M22 26 H42" />
      <path {...STROKE} d="M22 32 H42" />
      <path {...STROKE} d="M22 38 H42" />
      <circle cx={27} cy={26} r={2.5} fill="currentColor" opacity={0.2} stroke="currentColor" strokeWidth={1.2} />
      <circle cx={35} cy={32} r={2.5} fill="currentColor" opacity={0.2} stroke="currentColor" strokeWidth={1.2} />
      <circle cx={29} cy={38} r={2.5} fill="currentColor" opacity={0.2} stroke="currentColor" strokeWidth={1.2} />
    </g>
  );
}

export function GlyphQuantitative() {
  return (
    <g>
      {/* Sigma / summation symbol */}
      <path {...STROKE} d="M38 23 H26 L33 32 L26 41 H38" />
      <path {...STROKE} d="M26 23 H38" />
      <path {...STROKE} d="M26 41 H38" />
    </g>
  );
}

export function GlyphWatchlistCurator() {
  return (
    <g>
      <path {...STROKE} d="M22 27 H36" />
      <path {...STROKE} d="M22 32 H36" />
      <path {...STROKE} d="M22 37 H32" />
      <circle cx={39} cy={37} r={4} {...STROKE} />
      <circle cx={39} cy={37} r={1.5} fill="currentColor" />
    </g>
  );
}

export function GlyphBuyList() {
  return (
    <g>
      <rect x={22} y={22} width={20} height={20} rx={2} {...STROKE} />
      <path {...STROKE} d="M26 28 L29 31 L36 24" />
      <path {...STROKE} d="M26 35 H38" />
      <path {...STROKE} d="M26 39 H34" />
    </g>
  );
}

// Streaks -------------------------------------------------------------------

function FlameWithNumber({ n }: { n: string }) {
  return (
    <g>
      <path
        {...STROKE}
        d="M28 22 C24 28 24 32 28 36 C32 40 36 38 38 34 C39 31 36 31 35 33 C34 35 32 35 31 33 C30 30 33 26 32 22"
      />
      <text
        x={32}
        y={46}
        textAnchor="middle"
        fontSize={6}
        fill="currentColor"
        fontFamily="monospace"
      >
        {n}
      </text>
    </g>
  );
}

export function GlyphThreeDay() {
  return <FlameWithNumber n="3" />;
}
export function GlyphWeek() {
  return <FlameWithNumber n="7" />;
}
export function GlyphFortnight() {
  return <FlameWithNumber n="14" />;
}
export function GlyphMonthly() {
  return <FlameWithNumber n="30" />;
}
export function GlyphSixtyDay() {
  return <FlameWithNumber n="60" />;
}
export function GlyphCenturionStreak() {
  return <FlameWithNumber n="100" />;
}

export function GlyphFullYear() {
  return (
    <g>
      {/* Radiant sun / full revolution */}
      <circle cx={32} cy={32} r={6} {...STROKE} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 32 + Math.cos(r) * 9;
        const y1 = 32 + Math.sin(r) * 9;
        const x2 = 32 + Math.cos(r) * 12;
        const y2 = 32 + Math.sin(r) * 12;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />;
      })}
      <text x={32} y={36} textAnchor="middle" fontSize={5} fill="currentColor" fontFamily="monospace">
        365
      </text>
    </g>
  );
}

export function GlyphDailyReader() {
  return (
    <g>
      <rect x={22} y={23} width={20} height={18} rx={1.5} {...STROKE} />
      <path {...STROKE} d="M25 28 H35" />
      <path {...STROKE} d="M25 32 H39" />
      {/* Small flame */}
      <path {...STROKE} d="M36 39 C35 37 35 36 36 35 C37 36 38 37 37 39" />
    </g>
  );
}

export function GlyphWeeklyReader() {
  return (
    <g>
      <rect x={22} y={23} width={20} height={18} rx={1.5} {...STROKE} />
      <path {...STROKE} d="M25 28 H35" />
      <path {...STROKE} d="M25 32 H39" />
      <path {...STROKE} d="M25 36 H33" />
      {/* 7-day checkmarks */}
      <path {...STROKE} d="M35 36 L37 38 L40 34" />
    </g>
  );
}

// Portfolio -----------------------------------------------------------------

export function GlyphFirstHolding() {
  return (
    <g>
      <circle cx={32} cy={32} r={9} {...STROKE} />
      <path {...STROKE} d="M32 27 V37" />
      <path {...STROKE} d="M27 32 H37" />
    </g>
  );
}

export function GlyphWellDiversified() {
  return (
    <g>
      {/* Pie chart */}
      <circle cx={32} cy={32} r={10} {...STROKE} />
      <path d="M32 32 L32 22 A10 10 0 0 1 42 32 Z" fill="currentColor" opacity={0.6} />
      <path d="M32 32 L42 32 A10 10 0 0 1 32 42 Z" fill="currentColor" opacity={0.35} />
      <path d="M32 32 L32 42 A10 10 0 0 1 22 32 Z" fill="currentColor" opacity={0.2} />
    </g>
  );
}

export function GlyphPortfolioBuilder() {
  return (
    <g>
      {/* Stacked layers / building blocks */}
      <rect x={24} y={37} width={16} height={4} rx={1} {...STROKE} />
      <rect x={26} y={31} width={12} height={4} rx={1} {...STROKE} />
      <rect x={28} y={25} width={8} height={4} rx={1} {...STROKE} />
      <path {...STROKE} d="M32 25 V23" />
      <circle cx={32} cy={22} r={1.5} fill="currentColor" />
    </g>
  );
}

export function GlyphDualMandate() {
  return (
    <g>
      {/* Two overlapping portfolio shapes */}
      <rect x={22} y={26} width={13} height={16} rx={2} {...STROKE} />
      <rect x={29} y={22} width={13} height={16} rx={2} fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <path {...STROKE} d="M26 31 H31" />
      <path {...STROKE} d="M26 35 H29" />
    </g>
  );
}

// News ----------------------------------------------------------------------

export function GlyphMorningBrief() {
  return (
    <g>
      {/* Sun peeking over horizon */}
      <path {...STROKE} d="M20 37 H44" />
      <path {...STROKE} d="M32 35 A6 6 0 0 1 26 35" />
      <path {...STROKE} d="M32 35 A6 6 0 0 0 38 35" />
      <path {...STROKE} d="M32 28 V25" />
      <path {...STROKE} d="M25 31 L23 29" />
      <path {...STROKE} d="M39 31 L41 29" />
      {/* Paper */}
      <rect x={25} y={39} width={14} height={5} rx={1} {...STROKE} />
      <path {...STROKE} d="M27 41 H35" />
    </g>
  );
}

export function GlyphNewsJunkie() {
  return (
    <g>
      {/* Stack of newspapers */}
      <rect x={23} y={27} width={18} height={14} rx={1.5} {...STROKE} />
      <rect x={22} y={25} width={18} height={14} rx={1.5} {...STROKE} />
      <rect x={21} y={23} width={18} height={14} rx={1.5} {...STROKE} />
      <path {...STROKE} d="M24 27 H31" />
      <path {...STROKE} d="M24 30 H35" />
    </g>
  );
}

export function GlyphMarketSentinel() {
  return (
    <g>
      {/* Eye in a shield */}
      <path {...STROKE} d="M32 21 L42 25 V34 C42 39 37 42 32 44 C27 42 22 39 22 34 V25 Z" />
      <path {...STROKE} d="M25 33 C27 29 30 28 32 28 C34 28 37 29 39 33 C37 37 34 38 32 38 C30 38 27 37 25 33 Z" />
      <circle cx={32} cy={33} r={2} fill="currentColor" />
    </g>
  );
}

// AI & Power User -----------------------------------------------------------

export function GlyphFirstPrompt() {
  return (
    <g>
      {/* Lightning bolt */}
      <path d="M35 22 L27 33 H33 L29 44 L41 31 H35 Z" fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function GlyphPowerUser() {
  return (
    <g>
      {/* Circuit node pattern */}
      <circle cx={32} cy={32} r={3} {...STROKE} />
      <path {...STROKE} d="M32 29 V24" />
      <path {...STROKE} d="M35 32 H40" />
      <path {...STROKE} d="M32 35 V40" />
      <path {...STROKE} d="M29 32 H24" />
      <circle cx={32} cy={23} r={1.5} fill="currentColor" />
      <circle cx={41} cy={32} r={1.5} fill="currentColor" />
      <circle cx={32} cy={41} r={1.5} fill="currentColor" />
      <circle cx={23} cy={32} r={1.5} fill="currentColor" />
    </g>
  );
}

export function GlyphAINative() {
  return (
    <g>
      {/* Infinity / continuous loop suggesting AI partnership */}
      <path
        {...STROKE}
        d="M24 32 C24 28 27 25 31 25 C35 25 37 29 37 32 C37 35 39 39 43 39 C47 39 48 35 48 32"
        style={{ display: "none" }}
      />
      {/* Cleaner: two overlapping circles forming infinity */}
      <path {...STROKE} d="M22 32 C22 27 26 24 30 24 C34 24 36 28 32 32 C28 36 30 40 34 40 C38 40 42 37 42 32 C42 27 38 24 34 24" />
    </g>
  );
}

export function GlyphScreenWizard() {
  return (
    <g>
      {/* Wand + filter funnel */}
      <path {...STROKE} d="M38 22 L26 38" />
      <circle cx={39} cy={21} r={2} fill="currentColor" />
      <path {...STROKE} d="M23 25 H37 L31 34 V42 L28 40 V34 Z" />
    </g>
  );
}

export function GlyphFactChecker() {
  return (
    <g>
      {/* Brain outline simplified + checkmark */}
      <path {...STROKE} d="M26 36 C22 34 22 28 26 26 C26 23 29 22 31 23 C32 21 34 21 35 23 C38 22 41 24 41 27 C43 29 43 34 40 36 H26 Z" />
      <path {...STROKE} d="M28 31 L30 33 L36 27" />
    </g>
  );
}

// Goals ---------------------------------------------------------------------

export function GlyphGoalSetter() {
  return (
    <g>
      {/* Target / bullseye */}
      <circle cx={32} cy={32} r={10} {...STROKE} />
      <circle cx={32} cy={32} r={6} {...STROKE} />
      <circle cx={32} cy={32} r={2} fill="currentColor" />
      <path {...STROKE} d="M38 26 L42 22" />
      <path {...STROKE} d="M40 22 H42 V24" />
    </g>
  );
}

export function GlyphTripleThreat() {
  return (
    <g>
      {/* Three target rings staggered */}
      <circle cx={26} cy={35} r={5} {...STROKE} />
      <circle cx={26} cy={35} r={2} fill="currentColor" opacity={0.5} />
      <circle cx={32} cy={29} r={5} {...STROKE} />
      <circle cx={32} cy={29} r={2} fill="currentColor" opacity={0.7} />
      <circle cx={38} cy={35} r={5} {...STROKE} />
      <circle cx={38} cy={35} r={2} fill="currentColor" />
    </g>
  );
}

export function GlyphDreamRealized() {
  return (
    <g>
      {/* Star burst */}
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const inner = deg % 72 === 0 ? 10 : 6;
        const outer = deg % 72 === 0 ? 14 : 8;
        const x1 = 32 + Math.cos(r) * inner;
        const y1 = 32 + Math.sin(r) * inner;
        const x2 = 32 + Math.cos(r) * outer;
        const y2 = 32 + Math.sin(r) * outer;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />;
      })}
      <circle cx={32} cy={32} r={4} fill="currentColor" opacity={0.4} />
      <circle cx={32} cy={32} r={2} fill="currentColor" />
    </g>
  );
}

// Hidden / Meta / Social ----------------------------------------------------

export function GlyphContrarian() {
  return (
    <g>
      {/* Arrow going against the grain */}
      <path {...STROKE} d="M22 36 L36 36" strokeDasharray="2 2" />
      <path {...STROKE} d="M36 28 L28 28" />
      <path {...STROKE} d="M32 24 L28 28 L32 32" />
    </g>
  );
}

export function GlyphShareWealth() {
  return (
    <g>
      {/* Share / network icon */}
      <circle cx={32} cy={26} r={3} {...STROKE} />
      <circle cx={24} cy={38} r={3} {...STROKE} />
      <circle cx={40} cy={38} r={3} {...STROKE} />
      <path {...STROKE} d="M29 28 L27 36" />
      <path {...STROKE} d="M35 28 L37 36" />
    </g>
  );
}

export function GlyphCompletionist() {
  return (
    <g>
      {/* Trophy / cup */}
      <path {...STROKE} d="M25 22 H39 V34 C39 38 36 41 32 42 C28 41 25 38 25 34 Z" />
      <path {...STROKE} d="M25 26 C22 26 21 29 23 31 L25 32" />
      <path {...STROKE} d="M39 26 C42 26 43 29 41 31 L39 32" />
      <path {...STROKE} d="M28 42 H36" />
      <path {...STROKE} d="M30 42 V44 H34 V42" />
    </g>
  );
}

export const GLYPHS: Record<string, React.FC> = {
  // Onboarding
  welcome_to_the_terminal: GlyphWelcome,
  hello_wall_street: GlyphHelloWallStreet,
  the_architect: GlyphArchitect,
  the_watcher: GlyphWatcher,
  number_cruncher: GlyphNumberCruncher,
  newsie: GlyphNewsie,
  custom_built: GlyphCustomBuilt,
  the_cyborg: GlyphCyborg,
  // Research
  curious_mind: GlyphCuriousMind,
  market_analyst: GlyphMarketAnalyst,
  equity_explorer: GlyphEquityExplorer,
  wall_street_walker: GlyphWallStreetWalker,
  centurion: GlyphCenturion,
  deep_diver: GlyphDeepDiver,
  earnings_hawk: GlyphEarningsHawk,
  chart_reader: GlyphChartReader,
  screened_in: GlyphScreenedIn,
  filter_jockey: GlyphFilterJockey,
  quantitative: GlyphQuantitative,
  watchlist_curator: GlyphWatchlistCurator,
  buy_list: GlyphBuyList,
  // Streaks
  three_day_trader: GlyphThreeDay,
  week_warrior: GlyphWeek,
  fortnight_force: GlyphFortnight,
  monthly_maven: GlyphMonthly,
  sixty_day_strong: GlyphSixtyDay,
  centurion_streak: GlyphCenturionStreak,
  full_year: GlyphFullYear,
  daily_reader: GlyphDailyReader,
  weekly_reader: GlyphWeeklyReader,
  // Portfolio
  first_holding: GlyphFirstHolding,
  well_diversified: GlyphWellDiversified,
  portfolio_builder: GlyphPortfolioBuilder,
  dual_mandate: GlyphDualMandate,
  // News
  morning_brief: GlyphMorningBrief,
  news_junkie: GlyphNewsJunkie,
  market_sentinel: GlyphMarketSentinel,
  // AI
  first_prompt: GlyphFirstPrompt,
  power_user: GlyphPowerUser,
  ai_native: GlyphAINative,
  screen_wizard: GlyphScreenWizard,
  fact_checker: GlyphFactChecker,
  // Goals
  goal_setter: GlyphGoalSetter,
  triple_threat: GlyphTripleThreat,
  dream_realized: GlyphDreamRealized,
  // Hidden / Social / Meta
  the_contrarian: GlyphContrarian,
  share_the_wealth: GlyphShareWealth,
  the_completionist: GlyphCompletionist,
};
