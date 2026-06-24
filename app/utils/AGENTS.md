# app/utils/ — Utility Helpers

## Purpose

Shared utility functions used across components and composables.

## Ownership

- `lodashHelpers.js`: Native lodash replacements with `_` prefix
- `modelsGroup.js`: Model name constants
- `resolveModelName.js`: Model name converters
- `formatDate.js`: Luxon-backed ISO → Brazilian date formatter (`dd/MM/yyyy` or `dd/MM/yy`)
- `enums.js`: Frozen enum tables (`SOURCE`, `RESULT`, `GROUP_BY`, `PERIOD`, `TRADING_DAYS_PER_YEAR`) — use instead of magic strings
- `timezone.js`: `SP_TZ` constant + `yesterdayIso(tz?)` helper

## Local Contracts

- No lodash dependency — all helpers are native JS implementations
- Functions use `_` prefix for backward compatibility with lodash usage patterns
- All utils are auto-imported by Nuxt

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
- `formatDate(isoString)`: converts ISO date to dd/mm/yyyy (Brazilian format)

### enums.js
- Import named exports (`SOURCE.EXCHANGE`, `PERIOD.DAILY`, etc.). Never inline the string literal.

### timezone.js
- Import `SP_TZ` and `yesterdayIso` from anywhere that needs the SP zone or "yesterday" date. Do not duplicate the literal `'America/Sao_Paulo'`.

## Verification

- Unit testable but no existing tests for utils
