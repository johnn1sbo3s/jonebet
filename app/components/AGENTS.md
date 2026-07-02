# app/components/ — Vue Components

## Purpose

All 24 Vue components for the DataPlay Bets dashboard. Flat directory structure — no subdirectories.

## Ownership

- Every `.vue` file in this directory is a self-contained component
- Components are auto-imported by Nuxt; no manual registration needed

## Local Contracts

- All components use `<script setup>` (no TypeScript)
- Multi-word filenames in camelCase
- Props passed via `defineProps()`, emits via `defineEmits()`
- No lodash — use `_isEmpty`, `_filter`, etc. from auto-imported utils
- Profit coloring: `text-teal-500` positive, `text-red-500` negative
- No shadows — depth via zinc surface contrast (950→900→800)

## Work Guidance

| Component | Purpose | Key Notes |
|-----------|---------|-----------|
| `academyTermCard.vue` | Card expansível de termo do glossário pra `/academy` | Barra lateral colorida por categoria (teal/violet/amber), click alterna estado expandido, mostra short/long/example |
| `bankrollEvolution.vue` | Line chart: bankroll growth over months | Uses `LineChart` from vue-chart-3, options from `useBankrollChartOptions` |
| `betsTableCard.vue` | Paginated table of model bets | UTable + UPagination, page emit |
| `blockMetricsCard.vue` | Statistical metrics: mean P/L, std dev, confidence interval | |
| `blockMetricsPanel.vue` | Panel combining block metrics + history | Layout orchestrator |
| `blocksHistoryList.vue` | Scrollable list of 100-game blocks with profit/ROI | |
| `currentBlockMetricsCard.vue` | Current block: profit, std dev, game count | |
| `dailyBetCard.vue` | Single bet card: date badge + header line + split match + 3 odds | Receives `bet` prop; used by `daily-bets.vue` list |
| `dataErrorCard.vue` | Error/empty state card with icon + message. Props: `message` (String), `icon` (String, default `i-lucide-triangle-alert` — override with `i-lucide-info` for info-state empties) |
| `DatePicker.vue` | Date navigation: prev/next + calendar popover | UCalendar |
| `fixtureCard.vue` | Individual fixture card with odds + model count | |
| `fixtureDetailsCard.vue` | Fixture detail: odds, O/U, BTTS, allowed models | |
| `fixturesList.vue` | Fixtures list with source toggle (Exchange/Bookie); Bookie is the default tab | Mobile: UDrawer; resize listener cleaned up in `onUnmounted`; `chosenGame` and mobile modal are cleared on tab change and on fixtures refetch (covers tab and date change) |
| `fixturesListSkeleton.vue` | Loading skeleton for fixtures list | |
| `metricsCard.vue` | Model metrics: PLB, ROI, WR, odds, EV, drawdown, entries | |
| `monthlyResultsList.vue` | Scrollable monthly results with border accent | |
| `pageHeader.vue` | Reusable page header (title + description + right slot) | |
| `performanceChartCard.vue` | Performance chart: accumulation, trend, drawdown, Sharpe, streak | Options from `usePerformanceChartOptions({ annotationIndex })`; `useStaticLineOptions` for the drawdown sub-chart |
| `performancePageSkeleton.vue` | Loading skeleton for performance page | |
| `rankingModels.vue` | Top N models ranking with shimmer + "see all" modal | |
| `resultsTablesGrid.vue` | 2-column grid: monthly + daily results tables | |
| `SegmentedControl.vue` | Custom segmented control (Exchange/Bookie toggle) | |
| `yesterdayDetailsCard.vue` | Details: bets count, models count, positive models | |
| `yesterdayMetricsCard.vue` | Metric display: profit, invested, ROI | |

## Verification

- User runs `pnpm run dev` and checks component rendering in browser
- Existing tests: `pnpm test:unit` (tests for betsTableCard, blockMetricsPanel, dailyBetCard, metricsCard, performanceChartCard, resultsTablesGrid)
