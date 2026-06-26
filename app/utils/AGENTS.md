# app/utils/ — Utility Helpers

## Purpose

Shared utility functions used across components and composables.

## Ownership

- `lodashHelpers.js`: Native lodash replacements with `_` prefix
- `modelsGroup.js`: Model name constants
- `resolveModelName.js`: Model name converters
- `formatDate.js`: Luxon-backed ISO → Brazilian date formatter (`dd/MM/yyyy` or `dd/MM/yy`)
- `formatNumber.js`: Number/percent formatters with dot decimal, no thousands separator
- `enums.js`: Frozen enum tables (`SOURCE`, `RESULT`, `GROUP_BY`, `PERIOD`, `TRADING_DAYS_PER_YEAR`) — use instead of magic strings
- `timezone.js`: `SP_TZ` constant + `yesterdayIso(tz?)` helper
- `schemas.js`: zod schemas per API endpoint + `safeParse(endpoint, data)` helper

## Local Contracts

- No lodash dependency — all helpers are native JS implementations
- Functions use `_` prefix for backward compatibility with lodash usage patterns
- All utils are auto-imported by Nuxt
- **Number formatting convention**: dot as decimal separator, no thousands separator. Use `formatNumber` / `formatPercent` for monetary values, odds, and percent fields. R² and other statistical scalars may keep raw `toFixed` since they are not currency/odds.

## Work Guidance

### lodashHelpers.js
- `_isEmpty`, `_filter`, `_map`, `_forEach`, `_groupBy`, `_sum`, `_sortBy`, `_uniqWith`, `_orderBy`
- Drop-in replacements; same signatures as lodash equivalents

### modelsGroup.js
- `FAVORITE_MODELS`: list of featured model IDs
- `CHOSEN_MODELS`: list of selected model IDs

### resolveModelName.js
- `modelNameToNaturalName(id)`: converts snake_case to Title Case
- `modelNameToIdName(name)`: converts Title Case to snake_case

### formatDate.js
- `formatDate(iso, { style })` — Luxon-backed ISO → Brazilian date formatter.
- `style: 'long'` (default) → `dd/MM/yyyy`; `style: 'short'` → `dd/MM/yy`.
- Empty/falsy `iso` returns `''`; an unparseable ISO string is returned as-is (no throw).
- The function is auto-imported across `app/`. Do not duplicate it per-component — delete any local `function formatDate` re-implementations and import this one instead.

### formatNumber.js
- `formatNumber(n, decimals = 2)` and `formatPercent(n, decimals = 2)`. Both auto-imported across `app/`.
- Do not duplicate per-component — replace any local `function formatNumber`, `toLocaleString('pt-BR', ...)`, or `toFixed(2)` callsites for monetary / odds / percent values with this helper.
- `null`/`undefined` coerce to `0`; non-finite inputs render as the string `"NaN"` (same as `Number.prototype.toFixed`).

### enums.js
- Import named exports. Use the frozen tables for category enums: `SOURCE.EXCHANGE`, `PERIOD.DAILY`, `GROUP_BY.DAY`, `RESULT.GREEN`. Never inline the string literal.
- `TRADING_DAYS_PER_YEAR = 252` is the annualization factor for Sharpe ratio of daily strategies. Use it instead of hardcoding `252` in any Sharpe formula.
- All tables are `Object.freeze`'d — mutation is a no-op in sloppy mode, throws in strict mode.

### timezone.js
- Import `SP_TZ` and `yesterdayIso` from anywhere that needs the SP zone or "yesterday" date. Do not duplicate the literal `'America/Sao_Paulo'`.

### schemas.js
- One zod schema per API endpoint in `endpointSchemas`. Each entry: `{ schema, fallback }`. The fallback MUST match the `default: () => ...` of the composable that reads it.
- Use `.passthrough()` on object schemas so unknown backend fields don't fail parsing.
- `safeParse` logs ONE warn line on mismatch and returns the fallback. Never throw.

## Verification

- Unit testable but no existing tests for utils
