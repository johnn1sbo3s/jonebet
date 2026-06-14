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
- Only 4 component tests exist currently
- Tests use `describe/it/expect` from Vitest
- Components mounted with `mountSuspended()` for Nuxt integration

## Existing Tests

| File | Tests |
|------|-------|
| `betsTableCard.spec.ts` | Renders count, pagination button states, page emit |
| `blockMetricsPanel.spec.ts` | Renders header, history sub-header, passes props |
| `performanceChartCard.spec.ts` | Renders header, switch, metric labels, modals, zoom reset, emit |
| `resultsTablesGrid.spec.ts` | Renders both headers, row counts |

## Verification

- Run `pnpm test:unit` to execute all tests
