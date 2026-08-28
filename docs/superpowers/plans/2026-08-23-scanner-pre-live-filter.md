# Scanner "Só com pré-live" Filter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "só com pré-live" switch to the Scanner ao vivo filters that shows only main-grid games having ≥1 pre-live model bet.

**Architecture:** Mirror the existing "Só notificados" toggle. Extend the pure `filterScannerGames` with an `onlyPreLive` + `preLiveGameIds` (Set) conjunct; wire it in `scanner.vue` reusing the already-computed `preLiveBetsByGame`. No backend change, no new fetch.

**Tech Stack:** Vue 3 (Nuxt 4), NuxtUI v4, Tailwind CSS v4, plain JS (`<script setup>`), Vitest.

## Global Constraints

- No TypeScript in source files — plain `<script setup>` JS only
- Prettier: no semicolons, single quotes, trailing commas, 120 char width
- Tailwind v4: use `text-2xs` instead of `text-[10px]`
- Dark-only theme: teal primary, zinc surface hierarchy (950→900→800)
- No shadows — depth via surface contrast only
- Components auto-imported by Nuxt — no explicit imports needed
- Favorites section is NOT filtered (follows "Só notificados" convention)
- `preLiveBetsByGame` already exists in `scanner.vue` (game.id → bets[] map from `useDailyBets`)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `app/utils/filterScannerGames.js` | **Modify** | Add `onlyPreLive` + `preLiveGameIds` options; new conjunct |
| `app/pages/scanner.vue` | **Modify** | `onlyPreLive` ref, `preLiveGameIds` computed, wire into `otherGames` + `filtersActive`, add the `USwitch` UI |
| `tests/app/utils/filterScannerGames.spec.ts` | **Modify** | Tests for `onlyPreLive` + `preLiveGameIds` |

---

### Task 1: Extend `filterScannerGames` with the pre-live conjunct

**Files:**
- Modify: `app/utils/filterScannerGames.js`
- Test: `tests/app/utils/filterScannerGames.spec.ts`

**Interfaces:**
- Consumes: existing imports (`normalizeSearchText`, `isRecentNotification`, `matchesOddsPreset`) — unchanged
- Produces: `filterScannerGames(games, { query, onlyNotified, oddsPreset, onlyPreLive = false, preLiveGameIds = null, now })` — new optional options; `preLiveGameIds` is a `Set<string>`

- [ ] **Step 1: Write the failing tests**

Append to `tests/app/utils/filterScannerGames.spec.ts` (after the existing `describe('filterScannerGames — preset de odds', ...)` block):

```js
describe('filterScannerGames — só com pré-live', () => {
  const baseGames = [
    { id: 'g1', home: 'São Paulo', away: 'Corinthians', league: 'Brasileirão', notifications: [] },
    { id: 'g2', home: 'Avaí', away: 'CRB', league: 'Série B', notifications: [] },
    { id: 'g3', home: 'Real Madrid', away: 'Betis', league: 'La Liga', notifications: [] },
  ]
  const setOf = (...ids) => new Set(ids)

  it('default (false) mantém todos os jogos', () => {
    expect(filterScannerGames(baseGames, { preLiveGameIds: setOf('g1') })).toHaveLength(3)
  })

  it('onlyPreLive mantém só os ids do Set', () => {
    const ids = filterScannerGames(baseGames, { onlyPreLive: true, preLiveGameIds: setOf('g1', 'g3') }).map(
      (g) => g.id,
    )
    expect(ids).toEqual(['g1', 'g3'])
  })

  it('onlyPreLive sem Set (ou vazio) esconde tudo', () => {
    expect(filterScannerGames(baseGames, { onlyPreLive: true })).toHaveLength(0)
    expect(filterScannerGames(baseGames, { onlyPreLive: true, preLiveGameIds: new Set() })).toHaveLength(0)
  })

  it('combina com busca (interseção)', () => {
    expect(
      filterScannerGames(baseGames, { query: 'avai', onlyPreLive: true, preLiveGameIds: setOf('g1', 'g2') }).map(
        (g) => g.id,
      ),
    ).toEqual(['g2'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/jone/Projetos/jonebet-frontend && pnpm test:unit tests/app/utils/filterScannerGames.spec.ts`
Expected: the 4 new tests FAIL (filter still passes `g2`/`g3` etc., because `onlyPreLive` is not yet implemented)

- [ ] **Step 3: Write minimal implementation**

Replace the `filterScannerGames` export in `app/utils/filterScannerGames.js` with:

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
    // prematch já tem as chaves home/away; undefined (sem odds) → não passa.
    if (oddsPreset !== 'todos' && !matchesOddsPreset(oddsPreset, game.odds?.prematch)) return false
    if (onlyPreLive && !(preLiveGameIds && preLiveGameIds.has(game.id))) return false
    return true
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/jone/Projetos/jonebet-frontend && pnpm test:unit tests/app/utils/filterScannerGames.spec.ts`
Expected: ALL tests pass (existing + 4 new)

- [ ] **Step 5: Commit**

```bash
cd /Users/jone/Projetos/jonebet-frontend
git add app/utils/filterScannerGames.js tests/app/utils/filterScannerGames.spec.ts
git commit -m "feat(scanner): filtro 'só com pré-live' na função pura"
```

---

### Task 2: Wire the switch into the Scanner page

**Files:**
- Modify: `app/pages/scanner.vue`

**Interfaces:**
- Consumes: `preLiveBetsByGame` computed (already defined in the page, game.id → bets[]), `filterScannerGames` (now accepts `onlyPreLive` + `preLiveGameIds`)
- Produces: new `onlyPreLive` ref, `preLiveGameIds` computed; UI switch with label `só com pré-live`

- [ ] **Step 1: Add the `onlyPreLive` ref and update `filtersActive`**

In `<script setup>`, near the other filter refs (after `const oddsPresetOptions = ODDS_PRESET_OPTIONS`, around line 186), add the new ref:

```js
const onlyPreLive = ref(false)
```

Update the `filtersActive` computed (around line 187) to include it:

```js
const filtersActive = computed(
  () =>
    onlyNotified.value ||
    oddsPreset.value !== 'todos' ||
    normalizeSearchText(query.value) !== '' ||
    onlyPreLive.value,
)
```

- [ ] **Step 2: Add the `preLiveGameIds` computed**

After the existing `preLiveBetsByGame` computed (around line 240, which ends with `return map` and `}`), add:

```js
// Set de ids de jogos que têm ≥1 aposta pré-live — usado pelo filtro "só com pré-live".
const preLiveGameIds = computed(
  () => new Set(Object.keys(preLiveBetsByGame.value).filter((id) => preLiveBetsByGame.value[id].length > 0)),
)
```

- [ ] **Step 3: Pass the new options into `otherGames`**

Update the `otherGames` computed (around line 243) to forward the new options:

```js
const otherGames = computed(() =>
  filterScannerGames(
    games.value.filter((g) => !(!g.finished && isFavorite(g.id))),
    {
      query: query.value,
      onlyNotified: onlyNotified.value,
      oddsPreset: oddsPreset.value,
      onlyPreLive: onlyPreLive.value,
      preLiveGameIds: preLiveGameIds.value,
    },
  ),
)
```

- [ ] **Step 4: Add the switch UI grouped with "Só notificados"**

In the template, replace the single switch `<div class="flex items-center justify-end gap-2">` block (around lines 121-134) with a wrapper holding both switches:

```vue
          <div class="flex flex-wrap items-center justify-end gap-4 md:ml-auto">
            <div class="flex items-center gap-2">
              <USwitch
                v-model="onlyNotified"
                size="md"
                checked-icon="i-lucide-check"
                unchecked-icon="i-lucide-x"
                aria-labelledby="only-notified-label"
                title="jogos com notificação nos últimos 5 min"
              />

              <span id="only-notified-label" class="text-xs font-medium whitespace-nowrap text-zinc-400"
                >Só notificados</span
              >
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

              <span id="only-pre-live-label" class="text-xs font-medium whitespace-nowrap text-zinc-400"
                >só com pré-live</span
              >
            </div>
          </div>
```

- [ ] **Step 5: Visual check**

Run `pnpm run dev`, open Scanner ao vivo. Verify:
- New "só com pré-live" switch appears grouped at the right end of the filters row (wraps below on narrow screens).
- Toggling it hides main-grid games without a pre-live bet badge; games with the badge remain.
- Favorited games stay on top regardless of the toggle.
- Empty-state "Nenhum jogo corresponde ao filtro." shows when the toggle hides everything in the grid.
- Combines correctly with search / odds preset / "Só notificados" (AND).

- [ ] **Step 6: Commit**

```bash
cd /Users/jone/Projetos/jonebet-frontend
git add app/pages/scanner.vue
git commit -m "feat(scanner): switch 'só com pré-live' nos filtros"
```

---

### Task 3: Run full suite and verify

- [ ] **Step 1: Run all unit tests**

Run: `cd /Users/jone/Projetos/jonebet-frontend && pnpm test:unit`
Expected: all tests pass, including the 4 new `filterScannerGames` tests

- [ ] **Step 2: Commit any final fixes**

```bash
cd /Users/jone/Projetos/jonebet-frontend
git add -A
git commit -m "fix: ajustes do filtro 'só com pré-live'"
```
