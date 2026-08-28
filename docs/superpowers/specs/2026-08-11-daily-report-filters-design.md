# Daily Report — Client-Side Filters (Search + Strategy Multiselect)

**Date:** 2026-08-11
**Status:** Approved by user (design review, visual companion)

## Context

The daily report screen (`/daily-report`) fetches the whole day's pre-match AI analysis in one request (`GET /report?date=…`) and renders all games grouped by league or by hour. With ~31 games on a typical day, the user wants to narrow the list client-side:

1. A **search field** — match team names or league.
2. A **strategy multiselect** — show only games whose AI analysis includes the selected model(s), plus a "Com recomendação" option for "any game with at least one strategy".

Both filters are pure client-side (data is already all in memory); no API changes.

## Current State (grounded 2026-08-11)

- Page: `app/pages/daily-report.vue` — `SegmentedControl` (Por liga / Por horário, persisted), a fixed **favorites section** (immune to view mode by design), then grouped game sections.
- Game shape: `{ jogo_id, league, time, home, away, odds, leitura_geral, estrategias: [{ estrategia, recomendacao, confianca, analise }] }`.
- Real payload today: 31 games, 10 leagues, **4 distinct strategies** (`gol_1t`, `lay_0x1`, `lay_1x0`, `lay_zebra`), **8 games with empty `estrategias`** (no analysis). Strategy list is dynamic — never hardcode.
- Card: `app/components/reportGameCard.vue` — unchanged by this feature.
- Nuxt UI 4.10.0: `USelectMenu` supports `multiple`, internal search (`searchInput`), and `clear` (trailing X when a selection exists). Verified in `node_modules/@nuxt/ui/dist/runtime/components/SelectMenu.vue`.

## Layout (approved via visual companion)

Toolbar sits between the page title and the favorites section. Favorites stay **fixed and immune** to both filters (user decision; consistent with the section already ignoring view mode).

### Desktop (option A — "um de cada lado")
Single row, `justify-between`:
- **Left:** existing `SegmentedControl` (Por liga / Por horário), content width.
- **Right:** filter group `[ UInput search ] [ USelectMenu strategies ]`, gap 12px, grouped together.

### Mobile ≤ md (option 3 — "seletor 50/50")
Stacked column, each control full width:
1. `SegmentedControl` full-width 50/50 toggle (large tap targets).
2. `UInput` search, full width.
3. `USelectMenu` strategies, full width (popover opens above content, fits viewport).

**Component change:** `SegmentedControl.vue` gains a boolean prop (e.g. `fullWidth`) that applies `w-full md:w-auto` on the root and `flex-1 md:flex-none` on the buttons. Only `daily-report.vue` passes it. `fixturesList.vue` (the other consumer) is untouched.

## Search

- `UInput` with leading search icon, `v-model` on a local `query` ref.
- Matches `home`, `away`, and `league`; **case-insensitive and accent-insensitive** (`sao paulo` → `São Paulo`, `atletico` → `Atlético`).
- No debounce needed — filtering is a synchronous computed over ≤ ~50 items.

## Strategy Multiselect

- `USelectMenu` with `multiple`, searchable (internal), `clear` (built-in X).
- Options derived from the day's response: distinct `estrategias[].estrategia`, each `{ value, label }` with label = `modelNameToNaturalName(estrategia)`, sorted alphabetically by label. Prepend `{ value: '__any__', label: 'Com recomendação' }`.
- `v-model`: array of strategy keys.
- Semantics:
  - empty selection → no strategy filter (all games).
  - 1 selected → games whose `estrategias` contain that key.
  - N selected → union (OR) — game matches if it has **any** selected key.
  - `__any__` selected → games with at least 1 strategy (`estrategias.length > 0`). Note: `__any__` is the union of all options, so combining it with specific keys is redundant but harmless (result identical — acceptable).
  - Games with empty `estrategias` only appear when no strategy is selected (or via search).
- **Custom trigger slot** (mobile-proof): 0 selected → muted placeholder "Estratégias"; 1 → its label; 2+ → "N estratégias". Prevents the default comma-joined label from overflowing at 375px.

## Filter Pipeline

Pure util in `app/utils/filterReportGames.js` (unit-testable, keeps the page lean):

```js
export function filterReportGames(jogos, { query = '', selected = [] } = {})
```

1. Normalize `query`: lowercase + `normalize('NFD').replace(/[\u0300-\u036f]/g, '')`.
2. Query match: `home`, `away`, or `league` contains the normalized query.
3. Strategy match per semantics above.
4. Returns filtered games.

In the page, `filteredJogos` computed feeds both `byLeague` and `byHour` (filter runs **before** grouping, so both views respect the filters). `favoriteGames` keeps using the unfiltered list.

## Counts, Empty States, Clear, Persistence

- Group header counters reflect the filtered list; groups that empty out disappear entirely.
- If the filtered list is empty: replace the groups area with "Nenhum jogo corresponde ao filtro" (favorites section, if non-empty, still renders above).
- No "Limpar" button (removed after user review: it appeared/disappeared on filter toggle and shifted the layout). Strategies are cleared via the select's built-in `clear` (X); the search input clears by editing its text.
- Header total ("31 jogos analisados") stays the day's total, unfiltered.
- **No persistence** for filters (transient exploration state). `viewMode` keeps persisting as today.
- Search text and selection reset naturally on page re-mount.

## Files Touched

| File | Change |
|---|---|
| `app/pages/daily-report.vue` | Toolbar (search + multiselect), `filteredJogos` computed, empty-filter state, passes `fullWidth` to SegmentedControl |
| `app/components/SegmentedControl.vue` | New `fullWidth` prop (responsive full-width below md) |
| `app/utils/filterReportGames.js` | New pure filter util |
| `tests/app/utils/filterReportGames.spec.ts` | New unit tests |

No changes to `reportGameCard.vue`, `useDailyReport.js`, `useFavorites.js`, or the API.

## Testing

- `filterReportGames`: query matching (home/away/league, accent + case insensitivity), strategy OR union, `__any__` semantics (superset, games with no strategies), empty-selection passthrough, combined query+strategy.
- Component-level (page has no tests by convention; skip page tests — verify visually via `pnpm run dev` at desktop and 375px).
- SegmentedControl `fullWidth` prop: assert root/button classes toggle (`md:` variants present/absent) — component currently untested; a small spec is welcome but optional.

## Out of Scope

- No "Sem análise" badge/toggle (games without strategies are reachable by clearing the strategy filter — deliberate).
- No persistence of filters.
- No changes to the favorites section behavior or the scanner screen.
- No API/backend changes.
