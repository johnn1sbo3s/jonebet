# app/stores/ — Pinia Stores

## Purpose

Client-side state management via Pinia. Currently empty — `yesterdayModelsStore` was removed (dead code, never read by `performance/[[model]].vue` which builds its `playedOnSet` locally).

## Ownership

(none)

## Local Contracts

- Pinia is installed via `@pinia/nuxt` and ready for new stores. Use composition-API style with `defineStore()`.
- State persists only in-memory (no SSR hydration needed).

## Work Guidance

- Before adding a new store, confirm the state is genuinely cross-page. If it's page-local, keep it in the page's `<script setup>`.

## Verification

- No stores to verify yet. Add a section here when one lands.
