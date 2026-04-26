# FinHub

Your financial command center — research stocks, build portfolios, track goals, and stay ahead of the market in one beautifully-crafted workspace.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase**, **Framer Motion**, and **Zustand**.

---

## Prerequisites

- **Node.js ≥ 18.17** (Next 14 requirement) — recommended: the latest LTS
- **npm**, **pnpm**, or **yarn**
- A **Supabase** project (for auth)
- (Optional) An **Anthropic API key** for AI research features

> Don't have Node yet? Install via [nvm](https://github.com/nvm-sh/nvm) (`nvm install --lts`) or `brew install node`.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up env vars
cp .env.local.example .env.local
#   then fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Create a `.env.local` at the project root:

| Variable                         | Required | Where to get it                                                          |
| -------------------------------- | :------: | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`       |    ✅    | Supabase → Project Settings → API → **Project URL**                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  |    ✅    | Supabase → Project Settings → API → **anon / public** key                |
| `SUPABASE_SERVICE_ROLE_KEY`      |    ➖    | Supabase → Project Settings → API → **service_role** key (server-only)   |
| `ANTHROPIC_API_KEY`              |    ➖    | [console.anthropic.com](https://console.anthropic.com/) → API Keys       |
| `NEWSAPI_KEY`                    |    ➖    | [newsapi.org](https://newsapi.org)  · enables `/news`                    |
| `FINNHUB_API_KEY`                |    ➖    | [finnhub.io](https://finnhub.io) · alternative news provider             |
| `NEXT_PUBLIC_SITE_URL`           |    ➖    | Production URL (e.g. `https://finhub.app`) for SEO + OG tags             |

The service role key is used server-side for AI cache writes (`ai_analyses_cache`, `news_summaries_cache`, `screener_snapshots`) and to power the **delete-account** flow at `/settings`. Without it, AI features still work but won't cache across requests, and account deletion will return a friendly error.

> Without Supabase set, the app still boots — auth is disabled and protected routes pass through.

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com/).
2. Copy the **Project URL** and **anon key** into `.env.local`.
3. Enable email/password in **Authentication → Providers → Email**.
4. (Optional) Enable **Google** OAuth:
   - In Google Cloud Console, create an **OAuth 2.0 Client ID** (type: Web).
   - Add authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`.
   - Paste the client ID & secret into Supabase → **Authentication → Providers → Google**.
5. Under **Authentication → URL Configuration**, add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.com/auth/callback`

The OAuth callback is handled by `app/auth/callback/route.ts`, which exchanges the code for a session and redirects back to the app.

---

## Project structure

```
finhub/
├── app/
│   ├── (auth)/              # Sign-in / Sign-up (grouped layout)
│   ├── (app)/               # Authed app (sidebar + topbar layout)
│   │   ├── dashboard/       # Market overview, portfolio/news cards, quick actions
│   │   ├── screener/
│   │   ├── portfolio/
│   │   ├── builder/
│   │   ├── calculators/
│   │   ├── news/
│   │   └── ticker-lookup/
│   ├── auth/callback/       # Supabase OAuth code exchange
│   ├── layout.tsx           # Root layout — fonts, theme provider
│   ├── page.tsx             # Marketing landing page
│   └── globals.css          # Tailwind + design tokens (dark/light vars)
│
├── components/
│   ├── ui/                  # shadcn primitives (button, card, input, dropdown, sheet, …)
│   │   └── glass-card.tsx   # Reusable glassmorphism card
│   ├── layout/              # Sidebar, mobile drawer, top bar, user menu
│   ├── dashboard/           # Market card, empty states, quick actions, page shell
│   ├── auth/auth-form.tsx   # Email + Google sign-in/up form
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
│
├── lib/
│   ├── supabase.ts          # Browser client
│   ├── supabase-server.ts   # Server component / route handler client
│   └── utils.ts             # cn(), formatCurrency, formatPercent, formatCompact
│
├── store/
│   └── use-ui-store.ts      # Zustand store (sidebar collapse, mobile drawer)
│
├── middleware.ts            # Route protection (redirects unauthed → /sign-in)
├── tailwind.config.ts       # Theme tokens, brand colors, fonts, animations
├── components.json          # shadcn/ui config
└── .env.local.example
```

---

## Design system

**Fonts**
- `Inter` for UI text (loaded via `next/font`, CSS var `--font-inter`)
- `JetBrains Mono` for tabular numbers (CSS var `--font-jetbrains-mono`) — use `className="font-mono"` on prices, percentages, and metrics.

**Brand colors** (Tailwind aliases)
| Token               | Hex       | Use                              |
| ------------------- | --------- | -------------------------------- |
| `brand-bg`          | `#0a0e1a` | Dark mode background             |
| `brand-accent`      | `#3b82f6` | Primary actions, highlights      |
| `brand-success`     | `#10b981` | Positive deltas, confirmations   |
| `brand-danger`      | `#ef4444` | Negative deltas, destructive ops |

Semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, …) are driven by CSS variables in `globals.css` and switch automatically with the theme.

**Glassmorphism** — use the `.glass` utility class or the `<GlassCard />` component (`components/ui/glass-card.tsx`). Add `.glass-hover` for an interactive variant.

**Theme toggle** — `next-themes` persists the choice to `localStorage` under the key `finhub-theme`. Default is dark.

---

## Routing & auth

- **Marketing page** at `/`
- **Auth pages** at `/sign-in`, `/sign-up`
- **Authed app** under the `(app)` route group — shares the sidebar + top bar layout
- `middleware.ts` gates the authed prefixes (`/dashboard`, `/screener`, `/portfolio`, `/builder`, `/calculators`, `/news`, `/ticker-lookup`) and redirects unauthenticated users to `/sign-in?next=<path>`. Signed-in users on auth pages are bounced to `/dashboard`.

---

## State management

`store/use-ui-store.ts` uses **Zustand** with the `persist` middleware:
- `sidebarCollapsed` — persisted to `localStorage` under `finhub-ui`
- `mobileSidebarOpen` — session-only

Add new cross-component UI state here; for server data, prefer Server Components + Supabase.

---

## Scripts

```bash
npm run dev         # Start dev server on :3000
npm run build       # Production build
npm run start       # Serve production build
npm run lint        # Next.js ESLint
npm run typecheck   # tsc --noEmit (strict, noUncheckedIndexedAccess)
```

TypeScript is configured in strict mode with no implicit `any`.

---

## Adding a shadcn component

The project is configured (`components.json`) to use the shadcn CLI:

```bash
npx shadcn@latest add <component>
```

Components land in `components/ui/` and the `@/` alias is already wired up.

---

## Ticker Deep Dive (`/ticker/[symbol]`)

The deep-dive page (e.g. [/ticker/AAPL](http://localhost:3000/ticker/AAPL)) pulls live market data from Yahoo Finance and an AI BUY/SELL signal from Claude.

**Data flow**
- `lib/yahoo.ts` wraps `yahoo-finance2` for quotes, history, profile, financials, news, and search.
- `app/api/ticker/[symbol]/route.ts` returns the page-load summary (server-rendered).
- `app/api/ticker/[symbol]/history/route.ts` powers the chart timeframe switcher (client-fetched).
- `app/api/ticker/[symbol]/news/route.ts` returns the last 10 articles plus AI one-line summaries.
- `app/api/ai/ticker-analysis/route.ts` builds a context bundle (fundamentals, perf, headlines), prompts Claude Sonnet 4.5 for structured JSON, validates it, and writes to `ai_analyses_cache` (TTL 6h).

**Database setup** — apply the migration:

```bash
# Using Supabase CLI
supabase db push

# Or run the SQL directly in the Supabase SQL editor:
# supabase/migrations/0001_ai_analyses_cache.sql
```

**Search** — the top-bar `<TickerSearch />` component routes to `/ticker/[symbol]` on enter or selection. Press `⌘K` / `Ctrl+K` to focus from anywhere.

---

## Portfolio Tracker (`/portfolio`)

Each signed-in user gets a `portfolios` row (auto-created on first visit) with many `holdings`. Both tables are protected by RLS — users can only read/write their own rows.

**Migration** — apply [`supabase/migrations/0002_portfolios.sql`](supabase/migrations/0002_portfolios.sql) (`supabase db push` or paste into the SQL editor). Requires the `pgcrypto` extension (created by the migration).

**Live data** — [/api/portfolio/quotes](app/api/portfolio/quotes/route.ts) batches a list of symbols into one Yahoo `quote()` call and returns price + previousClose + sector. The client polls every 60 seconds (`REFRESH_MS` in [portfolio-client.tsx](components/portfolio/portfolio-client.tsx)), and every numeric updates with a count-up animation via the shared `AnimatedNumber`. Sector data is cached in-process for 24h to avoid an `assetProfile` round-trip on every refresh.

**Performance chart** — [/api/portfolio/performance](app/api/portfolio/performance/route.ts) accepts `{positions, tf}`, fetches per-symbol history in parallel, builds a unified timeline, and returns `{t, v}` points (sum of `lastPrice × shares`). Uses *current* shares for historical values — i.e. it shows what your current holdings would have been worth, not the actual transaction-by-transaction equity curve.

**P/L math** lives in [lib/portfolio.ts](lib/portfolio.ts) (`enrich`, `computeTotals`) — purely client-side from `cost_basis`, `shares`, and live prices.

---

## Stock Screener (`/screener`)

Filter a curated universe of large/mega-cap US equities by cap tier, sector, industry, P/E, dividend yield, 52-week performance, and price.

**Universe** — [`lib/screener-universe.ts`](lib/screener-universe.ts) is a hand-curated list (~115 names across all 11 GICS sectors). Extending it is just appending entries — the snapshot refresh, filter sidebar, and sector dropdown all read from this file. Yahoo's `quote()` endpoint is batched 50 at a time, so doubling the list ~doubles refresh time.

**Snapshot table** — [`screener_snapshots`](supabase/migrations/0003_screener.sql) holds one row per ticker, refreshed at most once per 24 hours. The [`/api/screener`](app/api/screener/route.ts) route serves the cached snapshot and refreshes in-flight when stale (or when `?refresh=1` is passed). The Refresh button in the header forces a refresh.

**Filtering & sorting** — fully client-side ([`lib/screener.ts`](lib/screener.ts) `applyFilters` / `applySort`). Filter changes update the table instantly, push state into the URL via `router.replace`, and reset to page 1.

**Saved screens** — `screener_presets` is per-user with RLS. The "Save screen" button in the sidebar persists the current filter bag; the "Saved screens" dropdown applies or deletes presets.

**Sparklines** — procedural (deterministic per symbol) so we don't pay for hundreds of historical fetches per snapshot. To upgrade, fetch a 30-day chart per ticker into a `spark_points jsonb` column and read it in [`Sparkline`](components/screener/sparkline.tsx).

**CSV export** — client-side blob download of the currently filtered+sorted set (not just the visible page).

---

## News Feed (`/news`)

A live financial news feed ranked by impact, with AI one-liners and ticker tags.

**Provider** — set one of `NEWSAPI_KEY` ([newsapi.org](https://newsapi.org)) or `FINNHUB_API_KEY` ([finnhub.io](https://finnhub.io)) in `.env.local`. NewsAPI is preferred when both are present. Without either, the page renders a friendly setup notice.

**Migration** — apply [`supabase/migrations/0004_news_cache.sql`](supabase/migrations/0004_news_cache.sql) (`news_summaries_cache`, 24h TTL).

**Pipeline**
1. [`/api/news`](app/api/news/route.ts) — fetches the latest top business headlines, dedupes by URL, runs each through [`buildArticle`](lib/news.ts) which detects keyword impact (Fed/earnings/acquisition/guidance/upgrade/downgrade/lawsuit/IPO/etc.), extracts tickers (UNIVERSE symbols + company-name match), assigns sectors, classifies impact (`breaking` if <2h old + has keyword, `high` if has keyword, otherwise `low`), and joins any cached summaries.
2. [`/api/ai/news-summary`](app/api/ai/news-summary/route.ts) — POST `{articles: [{url, title, description}]}` → reads the cache → batches uncached items 12 at a time to Claude Sonnet 4.5 → upserts into `news_summaries_cache` → returns `{summaries: {url: string}}`.

**UI** ([`news-client.tsx`](components/news/news-client.tsx))
- **Breaking** strip (last 2 hours, red accent) at the top
- **Filters** — ticker text, sector multi-select, impact toggle (All / High / Breaking)
- **Cards** — image, source, relative time, impact pill, matched-keyword chips, AI one-liner with sparkle icon, `$TICKER` chips linking to `/ticker/[symbol]`
- **Infinite scroll** — IntersectionObserver, 10 articles per page
- **Auto-refresh** — polls `/api/news` every 5 minutes; new articles surface as a center-bottom toast ("3 new articles"). Click to merge + scroll to top.

---

## Calculators (`/calculators`)

Index page links to three live calculators. All math lives in [`lib/calculators.ts`](lib/calculators.ts) and is exercised purely on the client — no submit buttons, every keystroke recalculates and re-animates the affected numbers via the shared `AnimatedNumber`.

**Dividend** ([`/calculators/dividend`](app/(app)/calculators/dividend/page.tsx)) — `projectDividends()` runs two parallel monthly simulations (reinvested + cash) so the comparison line chart can render both regardless of the toggle. Outputs: animated final value / total dividends / net gain stat cards, area chart of value over time with a dotted "contributions" baseline, dual-line reinvested-vs-not chart, and a collapsible year-by-year table.

**Position size** ([`/calculators/position-size`](app/(app)/calculators/position-size/page.tsx)) — `computePosition()` returns shares, risk amount, R/R ratio, and direction (long/short inferred from entry vs stop). The [`RiskBar`](components/calculators/risk-bar.tsx) draws a 1D price line with stop · entry · target markers and animated red/green zones.

**Savings goals** ([`/calculators/savings-goals`](app/(app)/calculators/savings-goals/page.tsx)) — backed by `goals` table ([migration 0005](supabase/migrations/0005_goals.sql)) with per-user RLS. Each card uses `projectGoal()` for `requiredMonthly` (from target date), `observedMonthlyPace` (from time since creation), and a status of `complete` / `ahead` / `on-track` / `behind` / `no-pace`. Add/edit/delete dialogs and a dual-mode "Update progress" dialog (add deposit *or* set total).

---

## AI Portfolio Builder (`/builder`)

A 7-step Framer-Motion wizard that gathers goal · horizon · risk · initial · monthly · preferences · experience, then asks Claude Sonnet 4.5 for a structured allocation.

**Wizard** ([`components/builder/wizard.tsx`](components/builder/wizard.tsx)) — answers persisted to `localStorage` under `finhub-builder-answers` so a refresh doesn't lose progress. Top progress bar with 7 segments, Back/Continue buttons, and per-step validation. The risk step uses a custom 5-segment slider showing historical drawdown range and expected annual return at the selected level.

**API** — [`/api/ai/portfolio-builder`](app/api/ai/portfolio-builder/route.ts) builds a tightly-scoped prompt ([`buildPrompt`](lib/builder.ts)), calls Claude Sonnet 4.5 with low temperature, and runs the response through [`validateRecommendation`](lib/builder.ts) (asset_allocation must sum to 100 ±2, etf_picks non-empty, all numbers finite, etc.).

**Results** ([`components/builder/results.tsx`](components/builder/results.tsx)) — animated entry with allocation pie, expected-return + rebalance card, risk assessment, ETF picks grid (each card links to `/ticker/[symbol]` with allocation %, dollar amount, and AI rationale), an additional Stock Picks section (only when aggressive), and a prominent amber disclaimer.

**Save to Portfolio** — fetches live prices via [`/api/portfolio/quotes`](app/api/portfolio/quotes/route.ts), creates a new `portfolios` row named `"AI {goal} portfolio"`, then bulk-inserts holdings sized by `(allocation_percent / 100) * initialInvestment / price`. On success, a green banner offers a one-click link to `/portfolio`.

**Regenerate** — re-runs the same answers through the API; **Edit answers** returns to step 1 with the saved answers intact.

---

## Production polish (post-launch)

Everything landed in the polish pass:

**Toasts** — global system at [`components/toast/toast-provider.tsx`](components/toast/toast-provider.tsx). Mounted in [`app/layout.tsx`](app/layout.tsx). Use it from anywhere:

```ts
import { useToast } from "@/components/toast/toast-provider";
const t = useToast();
t.success("Saved", "Holding added to portfolio");
t.error("Couldn't update", err.message);
```

Auto-dismiss after 4 s (6 s for errors), animated slide-in from the bottom-right, ⌘/keyboard-friendly close button.

**Error boundaries** — `error.tsx` next to each major route (`/portfolio`, `/screener`, `/news`, `/builder`, `/calculators`, `/ticker/[symbol]`) all delegate to a shared [`<FeatureError />`](components/feature-error.tsx). Plus a top-level [`app/global-error.tsx`](app/global-error.tsx) for the worst case.

**Watchlist** — migration [`0006_watchlist.sql`](supabase/migrations/0006_watchlist.sql), per-user `watchlist_items` with RLS. Page at [`/watchlist`](app/(app)/watchlist/page.tsx) shows live-quoted cards (60 s refresh, animated prices). The [`<WatchlistButton />`](components/watchlist/watchlist-button.tsx) drops in anywhere — already wired into the ticker deep-dive header — and posts toasts on add/remove.

**Settings** — [`/settings`](app/(app)/settings/page.tsx) covers email change, password change, and account deletion. Deletion calls [`/api/account/delete`](app/api/account/delete/route.ts) which uses the **service-role** Supabase client to call `auth.admin.deleteUser`. RLS cascades wipe portfolios, holdings, watchlists, goals, and presets via `ON DELETE CASCADE`.

**Landing page** — full hero, six-feature grid, free-tier pricing card with CTAs, and a closing card. Sitewide [`<Footer />`](components/layout/footer.tsx) on every authenticated route + the landing page.

**404** — [`app/not-found.tsx`](app/not-found.tsx) with a `$LOST · -100.00%` ticker visual.

**SEO** — root [`metadata`](app/layout.tsx) with OpenGraph + Twitter card pointing to [`/og.svg`](public/og.svg). Native Next.js [`app/robots.ts`](app/robots.ts) and [`app/sitemap.ts`](app/sitemap.ts) generate `/robots.txt` and `/sitemap.xml` at build time. Set `NEXT_PUBLIC_SITE_URL` in production for canonical URLs.

**What's not verified from this environment** — I don't have a browser or Node here, so I can't run Lighthouse, walk through every viewport in DevTools, or render the OG image to confirm it crops cleanly on Twitter/Slack. Validate those before launch:

```bash
# Lighthouse via Chrome (after `npm run build && npm start`)
npx lighthouse http://localhost:3000/dashboard --view

# Visual diff on each route at 375px / 768px / 1280px
```

If any Lighthouse score drops below 90, common offenders in this codebase are: large hero font weights without `font-display: swap` (already set), uncached AI route responses (the cache tables fix this), and the screener snapshot first-run (already lazy-loads after the page renders).

---

## Deploying

Any Next.js-compatible host works. On **Vercel**:

1. Import the repo.
2. Add the env vars from `.env.local.example` — including `NEXT_PUBLIC_SITE_URL` for SEO.
3. Add your production URL to Supabase **Authentication → URL Configuration → Redirect URLs** (`https://your-domain.com/auth/callback`).
4. Apply all six migrations in order: `supabase db push` (or paste each file in the SQL editor).
5. Ship it.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for project conventions and the demo recording flow in [`docs/demo-script.md`](docs/demo-script.md).

---

## Roadmap

- Connect Screener to a real fundamentals API
- Portfolio import (CSV + brokerage OAuth)
- AI research panel powered by `ANTHROPIC_API_KEY`
- News feed with watchlist filtering
- Calculators: FIRE, retirement, mortgage, DCA

Built with care. Inspired by Linear, Stripe, and Arc.
