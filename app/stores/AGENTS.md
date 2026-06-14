# app/stores/ — Pinia Stores

## Purpose

Client-side state management via Pinia.

## Ownership

- `yesterdayModelsStore.js`: tracks which models played on a given date

## Local Contracts

- Pinia installed via `@pinia/nuxt` module
- Store uses `defineStore()` with composition API style
- State persisted only in-memory (no SSR hydration needed)

## Work Guidance

- `yesterdayModelsStore.js` stores a Set of model IDs that played yesterday
- Used by `performance/[[model]].vue` to show green dot indicator on models that played
- Updated when model list is fetched

## Verification

- Verified via browser devtools (Pinia tab) or component behavior
