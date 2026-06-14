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
| `index.vue` | `/` | Dashboard: bankroll chart, monthly/daily results, monthly metrics |
| `fixtures.vue` | `/fixtures` | Daily games with date picker + source toggle (Exchange/Bookie) |
| `daily-bets.vue` | `/daily-bets` | Historical bet table with date/model filter + Excel export |
| `batch-monitoring.vue` | `/batch-monitoring` | All models overview: cards, search, sort, chart, blocks table |
| `performance/[[model]].vue` | `/performance` or `/performance/:model` | Model performance: chart, metrics, blocks, bets, results |

## Work Guidance

- `index.vue`: uses `GET /dashboard` and `GET /daily-results/{date}`
- `fixtures.vue`: uses `GET /fixtures/daily`
- `daily-bets.vue`: uses `GET /daily-bets`, ExcelJS for export
- `batch-monitoring.vue`: iterates all models, fetches each via `useModelById`
- `performance/[[model]].vue`: catch-all route, uses all model-specific composables

## Verification

- User runs `pnpm run dev` and navigates between pages
- No page-level unit tests yet
