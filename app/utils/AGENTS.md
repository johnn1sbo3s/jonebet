# app/utils/ — Utility Helpers

## Purpose

Shared utility functions used across components and composables.

## Ownership

- `lodashHelpers.js`: Native lodash replacements with `_` prefix
- `modelsGroup.js`: Model name constants
- `resolveModelName.js`: Model name converters
- `formatDate.js`: Date formatting

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

## Verification

- Unit testable but no existing tests for utils
