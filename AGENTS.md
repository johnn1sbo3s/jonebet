# Repository Guidelines

## Project Overview

**DataPlay Bets** — Dark-only sports betting performance dashboard. Vue 3 SPA built on Nuxt 4 that visualizes model performance, bankroll evolution, fixtures, and daily bets from an external Python API.

- **Stack**: Nuxt 4.4.7, Vue 3, NuxtUI v4, Tailwind CSS v4, Chart.js, Pinia, Zod v4, Vitest
- **API**: External at `https://api.jonebet.xyz` (separate Python backend repo)
- **Language**: Portuguese (Brazilian) UI; mixed PT/EN comments
- **Theme**: Dark-only, teal primary, zinc surface hierarchy (950→900→800)

## Architecture & Data Flow

```
Pages (file-based routing)
  ↓ useFetch / $fetch / composables
Composables (useModelApi.js — 10 endpoints, LRU cache, Zod validation)
  ↓ GET requests
External API (https://api.jonebet.xyz)
  ↓ parsed response (safeParse fallback on mismatch)
Components (27 Vue components, auto-imported)
  ↓ render
Chart.js (client-only plugin registration)
```

**Key patterns:**
- All data fetching lives in `app/composables/useModelApi.js` — 10 composable functions with shared LRU cache (200 entries, `useState`)
- Zod schemas in `app/utils/schemas.js` validate every API response; mismatch returns fallback + `console.warn`, never throws
- Chart.js stack (chart.js, zoom, annotation, registerables) is lazy-loaded and registered once via `app/utils/chartSetup.js` (`ensureChartSetup`) when the first chart mounts — never re-register in components
- No lodash — native replacements in `app/utils/lodashHelpers.js` with `_` prefix
- `app/error.vue` is the top-level error boundary; pages let errors bubble or surface via composable `error` refs

## Key Directories

| Path | Purpose |
|------|---------|
| `app/pages/` | 7 routes: dashboard (`index.vue`), fixtures, daily-bets, performance (`[[model]].vue` catch-all), academy, scanner, daily-report |
| `app/components/` | 27 Vue components — flat directory, no subdirectories |
| `app/composables/` | `useModelApi.js` (API + cache), `useChartOptions.js` (Chart.js factories), `useAcademiaGlossario.js` (glossary loader) |
| `app/utils/` | 9 files: lodash replacements, number/date formatters, enums, timezone, zod schemas, model name resolvers |
| `app/stores/` | Empty — Pinia installed via `@pinia/nuxt` but no stores yet |
| `app/layouts/` | `default.vue` — responsive header with 5-item nav |
| `app/plugins/` | Empty — Chart.js registration moved to `app/utils/chartSetup.js` (lazy, on first chart mount) |
| `app/assets/css/` | `main.css` — Tailwind v4 theme tokens, animations, scrollbar styling |
| `tests/` | Vitest specs under `tests/app/components/` |
| `eslint-rules/` | 2 custom ESLint rules (sibling-separator, no-html-comments) |
| `scripts/` | `check-arbitrary-values.cjs` — Tailwind arbitrary pixel value scanner (lint-staged gate) |

## Development Commands

```bash
pnpm run dev          # Start dev server
pnpm test:unit        # Run Vitest unit tests (single run)
pnpm lint             # ESLint (auto-runs via lint-staged on commit)
```

**Pre-commit hook** (`.husky/pre-commit` → `pnpm lint-staged`):
- Prettier formatting
- ESLint with 2 custom rules
- Tailwind arbitrary value check (`scripts/check-arbitrary-values.cjs`)

**Do NOT run `npx eslint`, `npx prettier --check`, or `pnpm build` after every edit** — they're slow and auto-run on commit. User checks visually via `pnpm run dev`.

## Code Conventions & Common Patterns

### General
- **No TypeScript** in source files — all plain `<script setup>` (plain JS)
- **camelCase** multi-word component filenames (`betsTableCard.vue`, `pageHeader.vue`)
- **Flat components directory** — no subdirectories within `components/`
- **Nuxt auto-imports** — components and composables are auto-registered; no explicit imports needed

### Formatting
- Prettier: no semicolons, single quotes, trailing commas, 120 char width
- `prettier-plugin-tailwindcss` for class sorting
- 2-space indentation (`.vscode/settings.json`)

### Styling
- Tailwind v4 with `@theme` tokens in `app/assets/css/main.css`
- Custom font: Plus Jakarta Sans (`font-sans`)
- `text-2xs` (10px / 0.625rem) for compact indicators — use instead of `text-[10px]` (barred by lint)
- Profit coloring: `text-teal-500` positive, `text-red-500` negative
- No shadows — depth via surface contrast only (zinc 950→900→800)
- Rounded cards: `rounded-2xl` globally via `app.config.ts`

### Number Formatting
Dot decimal, no thousands separator. Use helpers from `app/utils/formatNumber.js`:
- `formatUnit(n)` → `"<n>u"` for stake-unit values (profit, invested, EV, drawdown, etc.)
- `formatPercent(n)` → `"<n>%"` for percent fields (ROI, WR, Kelly, etc.)
- `formatNumber(n)` → bare number for odds, counts, statistical scalars
- Do **not** use `toLocaleString('pt-BR')` or `toFixed(2)` for these

### Enums
Frozen tables in `app/utils/enums.js`: `SOURCE`, `RESULT`, `GROUP_BY`, `PERIOD`, `TRADING_DAYS_PER_YEAR` (252). Never inline magic strings.

### Date/Time
- Luxon with `America/Sao_Paulo` timezone
- `formatDate(iso, { style })` — `'long'` → `dd/MM/yyyy`, `'short'` → `dd/MM/yy`
- `SP_TZ` constant and `yesterdayIso()` in `app/utils/timezone.js`

### Error Handling
- `safeParse()` in composables wraps every API response; mismatch → fallback + warn, never throw
- `app/error.vue` catches unhandled errors; use `clearError({ redirect: '/' })`
- Composable `error` refs surface to `<DataErrorCard>` in pages

### Testing Patterns
- `mountSuspended()` from `@nuxt/test-utils/runtime` for async component mounting
- `// @vitest-environment nuxt` per-file override for Nuxt runtime
- Centralized mocking in `app/test.setup.ts` (chart.js, composables, `useRoute`, `useRuntimeConfig`)
- Assertions: `wrapper.text()` + `toContain`, `.classes()` + `toContain`, `.emitted()` for events
- UModal portals: test via `document.body` wrapper

## Important Files

| File | Role |
|------|------|
| `nuxt.config.ts` | Modules, runtime config, Vite optimizeDeps, dark colorMode |
| `app/app.config.ts` | NuxtUI theme (teal/blue/slate colors, component slot overrides) |
| `app/app.vue` | Root: UApp + NuxtLoadingIndicator + NuxtLayout |
| `app/error.vue` | Global error/404 boundary |
| `app/composables/useModelApi.js` | Central API layer — 10 composables, LRU cache, Zod validation |
| `app/utils/schemas.js` | Zod schemas for 11 API endpoints + `safeParse()` |
| `app/utils/formatNumber.js` | `formatNumber`, `formatPercent`, `formatUnit` |
| `app/utils/chartSetup.js` | Lazy singleton Chart.js registration (`ensureChartSetup`) |
| `app/assets/css/main.css` | Tailwind v4 theme tokens, animations, dark overrides |
| `vitest.config.ts` | Test config: happy-dom, setup file, include pattern |
| `app/test.setup.ts` | Global test mocks (chart.js, composables, Nuxt globals) |
| `eslint.config.mjs` | ESLint config with 2 custom rules |
| `.prettierrc` | Formatting: no semi, single quotes, 120 width, tailwindcss plugin |
| `scripts/check-arbitrary-values.cjs` | Lint-staged gate for Tailwind arbitrary pixel values |

## Runtime/Tooling Preferences

- **Runtime**: Node.js (Nuxt 4, ESM)
- **Package manager**: pnpm (single-package workspace)
- **Node**: Nuxt 4.4.7 compat date 2026-06-05
- **No lodash** — use `app/utils/lodashHelpers.js` instead
- **No TypeScript** in source — plain `<script setup>` JS only
- **Chart.js**: client-only via plugin; never import/register in components
- **Zod v4**: runtime validation with passthrough for unknown backend fields
- **Pinia**: installed but no stores — keep page-local state in `<script setup>`

## Testing & QA

- **Framework**: Vitest 4.1.8 + @nuxt/test-utils 4.0.3 + happy-dom 20.10.3
- **Run**: `pnpm test:unit` (single run, no watch)
- **Setup**: `app/test.setup.ts` — stubs chart.js stack, vue-chart-3, 6 useModelApi composables, `useRoute`, `useRuntimeConfig`
- **Specs**: 8 files, 55 tests under `tests/app/components/`
- **Coverage**: 8 of 28 components tested (29%). No coverage tooling configured.
- **Untested**: 20 components, all composables, all utils, all pages, all layouts
- **Pattern**: `mountSuspended()` + `// @vitest-environment nuxt` + centralized mocks
- **No page-level tests** — pages verified visually via `pnpm run dev`

### Component Test Coverage

| Component | Tests | File |
|-----------|-------|------|
| metricsCard | 18 | `metricsCard.spec.ts` |
| performanceChartCard | 8 | `performanceChartCard.spec.ts` |
| academyTermCard | 8 | `academyTermCard.spec.ts` |
| statisticalSignificanceCard | 7 | `statisticalSignificanceCard.spec.ts` |
| dailyBetCard | 5 | `dailyBetCard.spec.ts` |
| betsTableCard | 4 | `betsTableCard.spec.ts` |
| blockMetricsPanel | 3 | `blockMetricsPanel.spec.ts` |
| resultsTablesGrid | 2 | `resultsTablesGrid.spec.ts` |
