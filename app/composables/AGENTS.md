# app/composables/ — API Layer & Chart Options

## Purpose

Shared composable functions for API data fetching and Chart.js configuration.

## Ownership

- `useModelApi.js`: All API composables with shared cache
- `useChartOptions.js`: Chart.js options factory

## Local Contracts

- **No TypeScript** — plain JavaScript files
- API base URL via `useRuntimeConfig().public.API_URL` (`https://api.jonebet.xyz`)
- Cache stored in `useState('model-api-cache')` — shared across components
- All API calls are GET-only, no authentication

## Work Guidance

### useModelApi.js

| Composable | Endpoint | Purpose |
|------------|----------|---------|
| `useModelsList()` | `GET /models` | List all available models |
| `useModelById(id)` | `GET /models/{id}` | Single model details |
| `useModelChart(id)` | `GET /models/{id}/chart` | Capital accumulation chart data |
| `useModelTrend(id)` | `GET /models/{id}/chart/trend` | Trend line data |
| `useModelResults(id)` | `GET /models/{id}/results` | Monthly/daily results |
| `useModelBets(id)` | `GET /models/{id}/bets` | Paginated bet history |

- Also used by `index.vue` for dashboard and daily-results endpoints
- Cache key pattern: `${endpoint}:${params}`

### useChartOptions.js

- Factory function returning Chart.js options object
- Supports zoom (drag-to-zoom), annotation lines, responsive resizing
- Shared across bankroll chart and performance chart

## Verification

- API calls verified via browser Network tab or `pnpm backend` (json-server mock on port 5000)
- Chart options verified visually in browser
