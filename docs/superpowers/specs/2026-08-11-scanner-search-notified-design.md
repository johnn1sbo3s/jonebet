# Scanner — Search + "Only notified" toggle

**Date:** 2026-08-11
**Status:** Approved by user (design review)

## Context

The scanner screen (`/scanner`) polls `scanner.jonebet.xyz/live.json` every 40s and renders live game cards (momentum chart, stats, odds, notification history on the flip side). With up to ~30 games in a cycle, the user wants to narrow the list client-side:

1. A **search field** — match team names or league.
2. A **toggle** — show only games with an active notification *right now*.

Both filters are pure client-side (the full list is already in memory); no backend/API changes.

## Current State (grounded 2026-08-11)

- Page: `app/pages/scanner.vue` — `PageHeader` with total live count, a fixed **favorites section** (always complete), then the main grid of `otherGames`. Computeds: `games`, `favoriteGames`, `otherGames` (favorites split: live favorites on top, everything else below).
- Game shape from the snapshot: `{ id, flashscore_url, league, home, away, score{home,away}, minute, status, momentum[], stats{…}, odds{prematch}, notifications[{rule,label,minute,at}], finished, finished_at, goals }`. `notifications` is most-recent-first, max 10; `at` is ISO 8601 with offset (server clock).
- Card: `app/components/scannerCard.vue` — amber "Alerta" glow via `isRecent` computed → `isRecentNotification(props.game.notifications)` from `app/utils/scanner.js` (window = **5 min**).
- Nuxt UI 4.10.0: `UInput` (leading search icon) and `USwitch` (checked/unchecked icons) are already used elsewhere (`performanceChartCard.vue`); central styles exist in `app.config.ts`.
- Existing search normalization: `normalizeSearchText` in `app/utils/filterReportGames.js` (lowercase + NFD accent strip). Reused, not duplicated.
- Precedent (2026-08-11): daily-report filters — toolbar row, "Nenhum jogo corresponde ao filtro" empty state, no "Limpar" button, no persistence.

## Decisions (user-confirmed)

1. **"Notificação ativa no momento"** = the game's most recent notification is within the **last 5 minutes** — the *same* window as the amber "Alerta" state on the card. One source of truth (`isRecentNotification`).
2. **Favorites stay immune** to both filters — the section always renders every live favorite, matching the daily-report precedent. Filters apply only to the main grid.

## Layout

Toolbar row between the `PageHeader` and the grid (only rendered when there are live games — nothing to filter otherwise):

- **Left/flex:** `UInput` search — leading search icon, placeholder "Buscar time ou liga…", `w-full md:w-72` (same pattern as daily-report).
- **Right:** `USwitch` "Só notificados" — checked/unchecked icons (check/x), label text next to it, `title` tooltip "jogos com notificação nos últimos 5 min".

Mobile ≤ md: stacked column — search full width on top; below it the switch row, right-aligned.

No "Limpar" button: the search input clears by editing its text; the switch clears by clicking it (no variable-width element appearing/disappearing → no layout shift; lesson from the daily-report review).

## Search

- `UInput` with `v-model` on a local `query` ref.
- Matches `home`, `away`, and `league`; **case-insensitive and accent-insensitive** (`sao paulo` → `São Paulo`, `atletico` → `Atlético`).
- No debounce — synchronous computed over ≤ ~30 items.

## Only-notified toggle

- `USwitch` with `v-model` on a local `onlyNotified` ref.
- Keeps games where `isRecentNotification(game.notifications)` is true (5-min window, server timestamps from the snapshot).
- Applies to finished cards too (a card that notified ≤5 min ago keeps its amber glow — the filter matches the card's own state).

## Filter Pipeline

Pure util in `app/utils/filterScannerGames.js` (unit-testable, keeps the page lean):

```js
export function filterScannerGames(games, { query = '', onlyNotified = false } = {})
```

1. Normalize `query` via `normalizeSearchText` (imported from `filterReportGames.js`).
2. Query match: `home`, `away`, or `league` contains the normalized query.
3. `onlyNotified`: `isRecentNotification(game.notifications)` (imported from `scanner.js`).
4. Query and toggle combine with AND.
5. Returns the filtered games (empty query + toggle off = passthrough).

In the page, `otherGames` becomes a computed over `filterScannerGames(games, { query, onlyNotified })` still excluding favorites as today. `favoriteGames` keeps the unfiltered list.

## Counts, Empty States, Persistence

- Header total ("N jogos") stays the **total** live count, unfiltered.
- Favorites section unchanged: always renders when there are live favorites.
- If `otherGames` is empty **and** a filter is active (query non-empty or toggle on): show "Nenhum jogo corresponde ao filtro." in the main area (favorites section, if non-empty, still renders above).
- No filters active and no games at all → existing "Nenhum jogo ao vivo agora".
- **No persistence** (transient exploration state, like daily-report filters). Search text and toggle reset on page re-mount.

## Files Touched

| File | Change |
|---|---|
| `app/pages/scanner.vue` | Toolbar (UInput + USwitch), filtered `otherGames` computed, empty-filter state |
| `app/utils/filterScannerGames.js` | New pure filter util (imports `normalizeSearchText` and `isRecentNotification`) |
| `tests/app/utils/filterScannerGames.spec.ts` | New unit tests |

No changes to `scannerCard.vue`, `app/utils/scanner.js`, `useFavorites.js`, `filterReportGames.js`, the momentum-scanner backend, or the snapshot API.

## Testing

- `filterScannerGames`: query match (home/away/league, accent + case insensitivity), `onlyNotified` window (recent vs old notification, empty notifications, exact 5-min boundary via injected `now`), combined query+toggle (AND), passthrough with no filters.
- Page has no tests by convention — verify visually via `pnpm run dev` (desktop + mobile width), including the empty-filter state and favorites immunity.

## Out of Scope

- No backend/snapshot changes (the ≤5-min window uses timestamps already published).
- No persistence of the toggle or search.
- No changes to the favorites section behavior.
- No changes to the card (glow, badge, flip) — the toggle reuses the existing "Alerta" state.
