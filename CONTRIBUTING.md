# Contributing to FinHub

Thanks for your interest! FinHub is built to be approachable, performant, and pleasant to work in. This guide covers what to know before opening a PR.

## Quick start

```bash
git clone https://github.com/your-org/finhub.git
cd finhub
npm install
cp .env.local.example .env.local       # then fill in keys
supabase db push                       # applies migrations 0001–0006
npm run dev
```

Open `http://localhost:3000`.

## Project conventions

- **TypeScript** is `strict` with `noUncheckedIndexedAccess`. No `any` — narrow types properly or `unknown`.
- **No prop-drilling for cross-cutting state.** Use a small Zustand store or React Context provider (see `store/use-ui-store.ts`, `components/toast/toast-provider.tsx`).
- **Server vs. client components**:
  - Default to **server** components. Mark with `"use client"` only when you need state, effects, or browser APIs.
  - Server components do data fetching directly via Supabase or `fetch`. Client components hit `/api/*` routes.
- **Styling**: Tailwind + the `glass` / `glass-hover` utilities from `app/globals.css`. Use CSS variables (`bg-background`, `text-foreground`, …) so the theme toggle works everywhere.
- **Numbers**: render with `font-mono` (and `tabular-nums` for tables). Use `formatCurrency` / `formatPercent` / `formatCompact` from `lib/utils.ts`.
- **Animated values**: prefer `<AnimatedNumber />` over plain text when the value updates from a poll.
- **Icons**: Lucide React only.
- **Comments**: only when the WHY is non-obvious. Self-explanatory code beats narration.

## Adding a feature

1. **Migration** if you need new tables — `supabase/migrations/000N_<name>.sql`. Always enable RLS and write per-user policies.
2. **lib/** module for pure logic + types. Keep it framework-agnostic where possible.
3. **API routes** (`app/api/...`) for anything that needs an env var (server-only keys) or shared cache.
4. **Components** under `components/<feature>/`. The convention: a single `*-client.tsx` root that owns state, smaller children for visual pieces.
5. **Page**: server component in `app/(app)/<route>/page.tsx` does the SSR fetch and hands off to the client component.
6. **Loading + error**: drop a `loading.tsx` and `error.tsx` next to `page.tsx`. Reuse `<FeatureError />` for consistency.
7. **Toasts**: import `useToast()` from `@/components/toast/toast-provider` for any user-visible success/error feedback.

## Working with Claude (the AI features)

- Always set `model = CLAUDE_MODEL` (`claude-sonnet-4-5`) — that constant lives in `lib/anthropic.ts`.
- Use `extractJson()` from the same file when prompting for JSON.
- **Cache aggressively.** Every AI route in this codebase reads from a Supabase cache table before hitting Claude (`ai_analyses_cache`, `news_summaries_cache`, …). Add a similar cache when you add a new AI route.
- Validate the model output before returning it. Claude can produce malformed JSON — gate on a `validate*()` helper before persisting.

## Code style

- Run `npm run lint` and `npm run typecheck` before pushing. CI will reject otherwise.
- Conventional commits encouraged: `feat(screener): persist filter presets`, `fix(news): handle missing image url`, etc.
- Don't smuggle unrelated changes into a PR. Small, scoped diffs review faster.

## Testing

This codebase doesn't have a test suite yet. If you add one:
- Use **Vitest** for unit tests in `lib/`.
- Use **Playwright** for end-to-end (auth, save flows).

## Reporting bugs / requesting features

Open a GitHub issue. Include:
- Steps to reproduce
- Expected vs. actual
- Screenshots/recordings for UI bugs
- Browser + OS

For security issues, email security@your-domain (do **not** open a public issue).

## License

By contributing, you agree your contributions are licensed under the same license as the project (see `LICENSE`).
