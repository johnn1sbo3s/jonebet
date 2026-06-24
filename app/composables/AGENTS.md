# app/composables/ — API Layer & Chart Options

## Purpose

Shared composable functions for API data fetching and Chart.js configuration.

## Ownership

- `useModelApi.js`: All API composables with shared cache
- `useChartOptions.js`: Chart.js options factory

## Local Contracts

- **No TypeScript** — plain JavaScript files
- API base URL via `useRuntimeConfig().public.API_URL` (`https://api.jonebet.xyz`)
- Cache stored in `useState('model-api-cache')` — shared across components, in-memory only, cleared on hard reload
- Bounded LRU at 200 entries; reads bump recency, writes evict the oldest when full. The cap is intentional — `useModelBets` keys include page+size+sort+order, so unbounded growth is the default.
- On `onResponseError`, the existing data is kept in cache and returned via `getCachedData`; the composable's `error` ref is set by Nuxt and pages should render `<DataErrorCard>` from it.
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
| `useDailyBets({date, model})` | `GET /daily-bets?date=&model=` | Effective-date list: returns `{date, bets, total}`. When `date` is null, the API resolves it (tomorrow, fallback today, America/Sao_Paulo). |
| `useDailyBetsDates()` | `GET /daily-bets/available-dates` | ISO dates that have bets |

- Also used by `index.vue` for dashboard and daily-results endpoints
- Cache key pattern: `${endpoint}:${params}`

### useChartOptions.js

Three pure factory functions, no Vue reactivity inside:

- `useStaticLineOptions()` — used by the drawdown sub-chart (no zoom, no legend, no tooltips, no axes)
- `useBankrollChartOptions()` — used by `BankrollEvolution` (zoom + pan + static annotation)
- `usePerformanceChartOptions({ annotationIndex })` — used by `performanceChartCard` (zoom + pan + dynamic annotation line)

The Chart.js plugins (zoom, annotation, registerables) are registered ONCE in `plugins/chartjs.client.js`. Do NOT re-register in components. The factory only assembles the options object; Chart.js plugin code lives in the plugin.

## Verification

- API calls verified via browser Network tab or `pnpm backend` (json-server mock on port 5000)
- Chart options verified visually in browser
