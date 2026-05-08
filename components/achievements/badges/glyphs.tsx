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

export const GLYPHS: Record<string, React.FC> = {
  welcome_to_the_terminal: GlyphWelcome,
  hello_wall_street: GlyphHelloWallStreet,
  the_architect: GlyphArchitect,
  the_watcher: GlyphWatcher,
  number_cruncher: GlyphNumberCruncher,
  newsie: GlyphNewsie,
  custom_built: GlyphCustomBuilt,
  the_cyborg: GlyphCyborg,
  curious_mind: GlyphCuriousMind,
  market_analyst: GlyphMarketAnalyst,
  equity_explorer: GlyphEquityExplorer,
  wall_street_walker: GlyphWallStreetWalker,
  centurion: GlyphCenturion,
  three_day_trader: GlyphThreeDay,
  week_warrior: GlyphWeek,
  fortnight_force: GlyphFortnight,
  monthly_maven: GlyphMonthly,
};
