# tests/ — Vitest Unit Tests

## Purpose

Unit tests for Vue components using Vitest + @nuxt/test-utils.

## Ownership

- `tests/app/components/` — component test files

## Local Contracts

- **Framework**: Vitest 4.1.8 with happy-dom environment
- **Test runner**: `pnpm test:unit`
- **Setup file**: `app/test.setup.ts` (stubs chart.js, composables, Nuxt auto-imports)
- **Test files**: `*.spec.ts` naming convention
- **Mounting**: `mountSuspended()` from `@nuxt/test-utils`

## Work Guidance

- Test directory mirrors `app/` structure
- 8 component tests exist (added metricsCard.spec.ts in this revision)
- Tests use `describe/it/expect` from Vitest
- Components mounted with `mountSuspended()` for Nuxt integration

## Existing Tests
| `betsTableCard.spec.ts` | Renders count, pagination button states, page emit |
| `blockMetricsPanel.spec.ts` | Renders header, history sub-header, passes props |
| `dailyBetCard.spec.ts` | Renders date badge, header, match split, 3 odds, container classes |
| `metricsCard.spec.ts` | Renders title, formats PLB/ROI/WR/odds/EV/DD/entradas, profit/roi colour classes, lucroEfetivo (incl. medLoss=0 guard), val-vs-real comparison indicators |
| `performanceChartCard.spec.ts` | Renders header, switch, metric labels, modals, zoom reset, emit |


| `academyTermCard.spec.ts` | Renders term card with title, definition, example, category badge |
| `resultsTablesGrid.spec.ts` | Renders monthly and daily results tables with correct columns |
| `statisticalSignificanceCard.spec.ts` | Renders 8 metrics, colours by significance (p-value, Kelly, edge prob), dashes when stats null |

## Verification

- Run `pnpm test:unit` to execute all tests
