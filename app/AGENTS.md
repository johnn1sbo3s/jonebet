# app/ — Nuxt Application Root

## Purpose

Main source directory for the DataPlay Bets Nuxt 4 application. Contains all frontend code: pages, components, composables, layouts, plugins, stores, and utilities.

## Ownership

- All `.vue`, `.js`, `.ts` files under `app/` are owned by this scope
- `app.config.ts` controls NuxtUI theme (teal primary, rounded-2xl cards)
- `app.vue` is the root component (UApp wrapper + loading indicator)

## Local Contracts

- **No TypeScript** in source files — all plain `<script setup>`
- **Nuxt auto-imports**: components and composables are auto-registered; no explicit imports needed
- **Flat components directory**: no subdirectories within `components/`
- **Language**: Portuguese (Brazilian) for all UI text; comments may be mixed PT/EN
- **Theme**: dark-only, teal primary, zinc surface hierarchy (950→900→800)
- **No shadows**: depth via surface contrast only

## Work Guidance

- Component names: camelCase for multi-word files (`betsTableCard.vue`, `pageHeader.vue`)
- Profit/loss coloring: teal-500 positive, red-500 negative
- Chart.js plugins must be registered client-only (see `plugins/chartjs.client.js`)
- API base URL: `https://api.jonebet.xyz` (via `runtimeConfig.public.API_URL`)
- Date handling: Luxon with `America/Sao_Paulo` timezone
- Chart.js plugins must be registered client-only (see `plugins/chartjs.client.js`)


## Verification

- User runs `pnpm run dev` and checks browser
- Unit tests: `pnpm test:unit`

## Child DOX Index

| Path | Scope |
|------|-------|
| `components/` | 23 Vue components: cards, charts, tables, modals, skeletons |
| `composables/` | API layer (`useModelApi.js`) and chart options (`useChartOptions.js`) |
| `pages/` | 4 pages: dashboard, fixtures, daily-bets, performance |
| `stores/` | Pinia store: `yesterdayModelsStore.js` |
| `utils/` | Helpers: lodash replacements, model name resolvers, date formatter |
| `layouts/` | Default layout with UHeader navigation |
| `plugins/` | Client-only Chart.js plugin registration |
| `assets/` | Tailwind v4 CSS with custom properties and animations |
