# Scanner "Só com pré-live" Filter — Design

**Date:** 2026-08-23
**Status:** Approved (design), pending implementation plan

## Goal

Add a `USwitch` to the Scanner ao vivo filters that, when on, shows **only** games
in the main grid that have at least one pre-live **model** bet. Mirrors the existing
"Só notificados" toggle exactly.

## Context

The pre-live bet indicator feature is already shipped (badges + modal per card). The
scanner page already computes `preLiveBetsByGame` — a `game.id → bets[]` map derived
from the `useDailyBets` fetch and `filterBetsForGame`. The scanner filters run through a
single pure function `filterScannerGames(games, { query, onlyNotified, oddsPreset, now })`
that filters only the **main grid** (`otherGames`); favorites stay pinned on top, ignoring
every filter.

This feature adds a third boolean conjunct to that function, reusing the existing
`preLiveBetsByGame` data — no backend change, no new fetch.

## Behavior

- New `USwitch` `onlyPreLive` (default `false`).
- When on: main grid hides any game whose id is not in the set of games that have ≥1
  pre-live bet.
- Favorites section is **not** affected (follows the "Só notificados" convention):
  favorited games stay on top even without pre-live bets.
- `filtersActive` gains `|| onlyPreLive` so the empty-state ("Nenhum jogo corresponde
  ao filtro") appears correctly when the grid is emptied by the toggle.
- Combines with query / odds preset / only-notified as an intersection (AND).

## Files

| File | Change |
|------|--------|
| `app/utils/filterScannerGames.js` | Add `onlyPreLive = false` and `preLiveGameIds` (Set) options; new conjunct in the filter. |
| `app/pages/scanner.vue` | `onlyPreLive` ref; `preLiveGameIds` computed; wire into `otherGames` + `filtersActive`; add the `USwitch` UI. |
| `tests/app/utils/filterScannerGames.spec.ts` | Tests for `onlyPreLive` + `preLiveGameIds`. |

## Filter logic (filterScannerGames.js)

```js
export function filterScannerGames(
  games = [],
  { query = '', onlyNotified = false, oddsPreset = 'todos', onlyPreLive = false, preLiveGameIds = null, now } = {},
) {
  const q = normalizeSearchText(query)
  return games.filter((game) => {
    if (q) {
      const haystack = [game.home, game.away, game.league]
      if (!haystack.some((field) => normalizeSearchText(field).includes(q))) return false
    }
    if (onlyNotified && !isRecentNotification(game.notifications, now)) return false
    if (oddsPreset !== 'todos' && !matchesOddsPreset(oddsPreset, game.odds?.prematch)) return false
    if (onlyPreLive && !(preLiveGameIds && preLiveGameIds.has(game.id))) return false
    return true
  })
}
```

## Scanner page wiring (scanner.vue)

- `const onlyPreLive = ref(false)`
- `const preLiveGameIds = computed(() => new Set(Object.keys(preLiveBetsByGame.value).filter((id) => preLiveBetsByGame.value[id].length > 0)))`
- `filtersActive` → `onlyNotified.value || oddsPreset.value !== 'todos' || normalizeSearchText(query.value) !== '' || onlyPreLive.value`
- `otherGames` passes `..., onlyPreLive: onlyPreLive.value, preLiveGameIds: preLiveGameIds.value }`
- UI: group both switches at the right end:
  ```vue
  <div class="flex flex-wrap items-center justify-end gap-4 md:ml-auto">
    <div class="flex items-center gap-2">
      <USwitch v-model="onlyNotified" ... aria-labelledby="only-notified-label" ... />
      <span id="only-notified-label" ...>Só notificados</span>
    </div>
    <div class="flex items-center gap-2">
      <USwitch
        v-model="onlyPreLive"
        size="md"
        checked-icon="i-lucide-check"
        unchecked-icon="i-lucide-x"
        aria-labelledby="only-pre-live-label"
        title="jogos com aposta de modelo pré-live"
      />
      <span id="only-pre-live-label" class="text-xs font-medium whitespace-nowrap text-zinc-400">só com pré-live</span>
    </div>
  </div>
  ```

## Known limitation

`preLiveBetsByGame` depends on the `useDailyBets` fetch. While that fetch is pending
(or if it fails), the map is empty, so with the toggle on every game is hidden until/unless
data resolves — identical to how the badges currently behave. No extra loading state added.

## Testing

- Unit: `filterScannerGames.spec.ts` — `onlyPreLive` keeps only ids in the Set;
  combines with `query`; default `false` keeps all. Pass a `Set` via `preLiveGameIds`.
- Visual (`pnpm run dev`): toggle hides non-pre-live games in the main grid; favorites
  remain; empty-state shows when nothing matches; combines with other filters.
</content>
</invoke>
