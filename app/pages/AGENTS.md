# app/pages/ — Application Pages

## Purpose

Nuxt file-based routing pages. 5 routes total.

## Ownership

- Each `.vue` file is a page component rendered by `NuxtPage`
- Layout applied from `layouts/default.vue`

## Local Contracts

- All pages use `<script setup>` (no TypeScript)
- Pages consume composables from `composables/useModelApi.js`
- Pages consume components from `components/` (auto-imported)
- Portuguese (Brazilian) for all UI text

## Routes

| File | Route | Description |
|------|-------|-------------|
| `index.vue` | `/` | Dashboard: bankroll chart, monthly/daily results, monthly metrics. The "Resultados do mês" section falls back to a `DataErrorCard` with `i-lucide-info` icon and message "Nenhum resultado disponível para <Mês/aa> ainda" when the current month has no results yet (e.g. day 1 of a new month); a fetch error keeps the original warning icon and "Não foi possível carregar..." copy. |
| `fixtures.vue` | `/fixtures` | Daily games with date picker + source toggle (default: Bookie) |
| `daily-bets.vue` | `/daily-bets` | Effective-date bet list (cards) with model filter. Uses `useDailyBets` + `useDailyBetsDates`. The model `USelectMenu` (searchable) options are the unique `Modelo` values from the current bet list. On first load, `date` is synced from the API's resolved effective date (tomorrow, fallback today); `DatePicker` lets the user navigate. `<DailyBetCard>` per bet. |
| `performance/[[model]].vue` | `/performance` or `/performance/:model` | Model performance: chart, metrics, blocks, bets, results |
| `academy.vue` | `/academy` | Glossário de termos da plataforma: busca ao vivo, agrupado por categoria, cards expansíveis. Usa `useAcademiaGlossario` + `glossario.json`. |

## Work Guidance

- `index.vue`: uses `GET /dashboard` and `GET /daily-results/{date}`
- `fixtures.vue`: uses `GET /fixtures/daily`
- `daily-bets.vue`: uses `GET /daily-bets?date=&model=`, `GET /daily-bets/available-dates`. The model select is sourced from the bet list response (unique `Modelo` values), not from `/models`. Renders a vertical list of `<DailyBetCard>` (no UTable).
- `useFetch` query string params go in the `query` option, not `params`. `params` are interpolated into the URL path template and silently dropped for non-template URLs.
- `performance/[[model]].vue`: catch-all route, uses all model-specific composables

## Verification

- User runs `pnpm run dev` and navigates between pages
- No page-level unit tests yet
