# app/data/ — Static Data Files

## Purpose

Static JSON data consumed by composables at build time (Vite static import). No API calls for this data.

## Ownership

- `academia/glossario.json` — 11 glossary terms for the `/academy` page
- `academia/glossario.schema.json` — JSON Schema draft-07 for term validation

## Local Contracts

- JSON files are imported directly by composables (no fetch, no API)
- Schema validates at runtime in the composable, not at build time
- Adding a new term: add to `glossario.json`, ensure it passes schema (name unique, required fields, maxLength respected)
- Categories: `Conceito`, `Estratégia`, `Modelo` (enum in schema)

## Work Guidance

- Edit `glossario.json` to add/remove terms — the composable validates on load
- Schema changes require updating the composable validator to match

## Verification

- Add a term with a missing field → `console.error` + term skipped in UI
- Add a term with a duplicate name → `console.error` + second term skipped
