# Pre-Live Bet Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a visual indicator showing how many models have pre-live bets for each game, with detailed modal (scanner) and tooltip (report).

**Architecture:** Fetch daily-bets at the page level (scanner.vue and daily-report.vue), cross-match with games by Home/Away, pass relevant bets as props to cards. Scanner gets a clickable badge that opens an internal modal; report gets a badge with hover/touch tooltip.

**Tech Stack:** Vue 3 (Nuxt 4), NuxtUI v4, Tailwind CSS v4, plain JS (`<script setup>`)

## Global Constraints

- No TypeScript in source files — plain `<script setup>` JS only
- Prettier: no semicolons, single quotes, trailing commas, 120 char width
- Tailwind v4: use `text-2xs` instead of `text-[10px]`
- Number formatting: `formatNumber(n, 2)` for odds (2 decimal places, dot separator)
- Model names: `modelNameToNaturalName()` from `~/utils/resolveModelName`
- Dark-only theme: teal primary, zinc surface hierarchy (950→900→800)
- No shadows — depth via surface contrast only
- Components auto-imported by Nuxt — no explicit imports needed
- API bets have `Market` (string) and `Odd` (number) fields resolved by backend

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `app/utils/preLiveBets.js` | **Create** | Pure helper: match bets to a game by Home/Away |
| `app/pages/scanner.vue` | **Modify** | Fetch daily-bets, compute per-game bets, pass as props |
| `app/components/scannerCard.vue` | **Modify** | Badge + internal modal showing models with odds |
| `app/pages/daily-report.vue` | **Modify** | Fetch daily-bets, compute per-game bets, pass as props |
| `app/components/reportGameCard.vue` | **Modify** | Badge + tooltip showing models with odds |

---

### Task 1: Create pure helper for matching bets to games

**Files:**
- Create: `app/utils/preLiveBets.js`
- Test: `tests/app/utils/preLiveBets.spec.ts`

**Interfaces:**
- Consumes: Array of bet objects (from daily-bets API), game object with `Home`/`Away`
- Produces: `filterBetsForGame(bets, game)` → Array of matching bet objects

- [ ] **Step 1: Write the failing test**

```typescript
// tests/app/utils/preLiveBets.spec.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { filterBetsForGame } from '~/utils/preLiveBets'

describe('filterBetsForGame', () => {
  const bets = [
    { Home: 'Flamengo', Away: 'Palmeiras', Modelo: 'lay_away_v1', Odd: 3.5 },
    { Home: 'Flamengo', Away: 'Palmeiras', Modelo: 'back_home_v2', Odd: 1.8 },
    { Home: 'Santos', Away: 'Corinthians', Modelo: 'ltd_v1', Odd: 4.2 },
  ]

  it('returns bets matching Home and Away', () => {
    const game = { Home: 'Flamengo', Away: 'Palmeiras' }
    const result = filterBetsForGame(bets, game)
    expect(result).toHaveLength(2)
    expect(result[0].Modelo).toBe('lay_away_v1')
    expect(result[1].Modelo).toBe('back_home_v2')
  })

  it('returns empty array when no match', () => {
    const game = { Home: 'Botafogo', Away: 'Vasco' }
    const result = filterBetsForGame(bets, game)
    expect(result).toHaveLength(0)
  })

  it('returns empty array for empty bets', () => {
    const game = { Home: 'Flamengo', Away: 'Palmeiras' }
    expect(filterBetsForGame([], game)).toHaveLength(0)
  })

  it('returns empty array when bets is null/undefined', () => {
    const game = { Home: 'Flamengo', Away: 'Palmeiras' }
    expect(filterBetsForGame(null, game)).toHaveLength(0)
    expect(filterBetsForGame(undefined, game)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd jonebet-frontend && pnpm test:unit tests/app/utils/preLiveBets.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```javascript
// app/utils/preLiveBets.js

/**
 * Filter daily-bets that match a specific game by Home/Away.
 * @param {Array|null|undefined} bets  daily-bets array from the API
 * @param {{ Home: string, Away: string }} game  game object
 * @returns {Array} matching bets
 */
export function filterBetsForGame(bets, game) {
  if (!bets || !game?.Home || !game?.Away) return []
  return bets.filter(
    (bet) =>
      bet.Home === game.Home && bet.Away === game.Away
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd jonebet-frontend && pnpm test:unit tests/app/utils/preLiveBets.spec.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd jonebet-frontend
git add app/utils/preLiveBets.js tests/app/utils/preLiveBets.spec.ts
git commit -m "feat: add pure helper to match daily-bets to games"
```

---

### Task 2: Scanner page — fetch daily-bets and pass to cards

**Files:**
- Modify: `app/pages/scanner.vue`

**Interfaces:**
- Consumes: `useDailyBets` composable from `~/composables/useModelApi`
- Produces: `preLiveBetsByGame` computed (Map of game id → bet array), passed as `preLiveBets` prop to `ScannerCard`

- [ ] **Step 1: Add daily-bets fetch and computed mapping in scanner.vue**

In `<script setup>`, after the existing `const { isFavorite } = useFavorites()` line (around line 218), add:

```javascript
import { filterBetsForGame } from '~/utils/preLiveBets'

// Daily-bets para indicador pré-live: fetch único, cruza com jogos do snapshot
const { data: dailyBetsData } = useDailyBets()
const allBets = computed(() => dailyBetsData.value?.bets || [])

// Map: game.id → bets relevantes para aquele jogo
const preLiveBetsByGame = computed(() => {
  const map = {}
  for (const game of games.value) {
    map[game.id] = filterBetsForGame(allBets.value, game)
  }
  return map
})
```

- [ ] **Step 2: Pass preLiveBets prop to ScannerCard in favoriteGames section**

Find the first `<ScannerCard` inside the favorites section (around line 97-103) and add `:pre-live-bets="preLiveBetsByGame[game.id] || []"`:

```vue
<ScannerCard
  v-for="game in favoriteGames"
  :id="`game-${game.id}`"
  :key="game.id"
  :game="game"
  :highlighted="game.id === activeHighlight"
  :pre-live-bets="preLiveBetsByGame[game.id] || []"
/>
```

- [ ] **Step 3: Pass preLiveBets prop to ScannerCard in otherGames section**

Find the second `<ScannerCard` in the main grid (around line 138-144) and add the same prop:

```vue
<ScannerCard
  v-for="game in otherGames"
  :id="`game-${game.id}`"
  :key="game.id"
  :game="game"
  :highlighted="game.id === activeHighlight"
  :pre-live-bets="preLiveBetsByGame[game.id] || []"
/>
```

- [ ] **Step 4: Visual check**

Run `pnpm run dev` and verify the scanner page loads without errors. The badge won't be visible yet (Task 3 adds it), but the page should work normally.

- [ ] **Step 5: Commit**

```bash
cd jonebet-frontend
git add app/pages/scanner.vue
git commit -m "feat(scanner): fetch daily-bets and pass to ScannerCard"
```

---

### Task 3: Scanner card — badge and internal modal

**Files:**
- Modify: `app/components/scannerCard.vue`

**Interfaces:**
- Consumes: `preLiveBets` prop (Array, default `[]`), `filterBetsForGame` already applied by parent
- Produces: Badge UI + modal overlay

- [ ] **Step 1: Add preLiveBets prop and state**

In the `<script setup>` section, add to the `defineProps` (around line 378):

```javascript
const props = defineProps({
  game: { type: Object, required: true },
  highlighted: { type: Boolean, default: false },
  preLiveBets: { type: Array, default: () => [] },
})
```

Add state for the modal (after the existing `aiOpen` ref, around line 387):

```javascript
const preLiveOpen = ref(false)
```

- [ ] **Step 2: Add badge in the top bar (next to notifications badge)**

Inside the `<div class="print-hide flex items-center gap-1.5">` (line 19), after the notifications UBadge block (around line 30), add:

```vue
<UBadge
  v-if="preLiveBets.length > 0"
  color="primary"
  variant="outline"
  size="md"
  class="gap-1 px-2.5 cursor-pointer"
  title="Modelos com apostas pré-live"
  @click.stop="preLiveOpen = true"
>
  <UIcon name="i-lucide-target" class="h-3.5 w-3.5" />
  {{ preLiveBets.length }} {{ preLiveBets.length === 1 ? 'modelo' : 'modelos' }}
</UBadge>
```

- [ ] **Step 3: Add the pre-live modal overlay**

After the existing pre-game modal overlay (the `v-if="preGameOpen"` div that ends around line 363), add a new overlay block:

```vue
<div
  v-if="preLiveOpen"
  class="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/70 p-3"
  @click.stop
>
  <div class="max-h-full w-full overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 p-3">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-2xs font-bold tracking-wide text-teal-400 uppercase">
        Modelos com apostas pré-live
      </span>

      <button
        class="flex h-5 w-5 items-center justify-center rounded border border-zinc-700 text-xs text-zinc-400 hover:border-teal-400 hover:text-teal-400"
        @click.stop="preLiveOpen = false"
      >
        ✕
      </button>
    </div>

    <div v-if="preLiveBets.length" class="flex flex-col gap-1.5">
      <div
        v-for="(bet, i) in preLiveBets"
        :key="i"
        class="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5"
      >
        <span class="text-xs font-bold text-zinc-100">{{ modelNameToNaturalName(bet.Modelo) }}</span>

        <span class="text-xs font-semibold text-teal-400">
          {{ bet.Market }} · {{ formatNumber(bet.Odd, 2) }}
        </span>
      </div>
    </div>

    <p v-else class="text-center text-xs text-zinc-500">Nenhuma aposta pré-live para este jogo.</p>
  </div>
</div>
```

- [ ] **Step 4: Add imports for formatNumber and modelNameToNaturalName**

In the `<script setup>` imports section (around line 370), add:

```javascript
import { formatNumber } from '~/utils/formatNumber'
```

(`modelNameToNaturalName` is already imported at line 370.)

- [ ] **Step 5: Visual check**

Run `pnpm run dev`, navigate to scanner, find a game with bets. Verify:
- Badge shows "X modelos" in the top bar
- Clicking the badge opens the modal overlay
- Modal lists model names with market + odds (2 decimal places)
- Clicking ✕ or outside the modal closes it

- [ ] **Step 6: Commit**

```bash
cd jonebet-frontend
git add app/components/scannerCard.vue
git commit -m "feat(scannerCard): add pre-live bets badge and modal"
```

---

### Task 4: Report page — fetch daily-bets and pass to cards

**Files:**
- Modify: `app/pages/daily-report.vue`

**Interfaces:**
- Consumes: `useDailyBets` composable, `selectedDate` ref
- Produces: `preLiveBetsByGame` computed, passed as `preLiveBets` prop to `ReportGameCard`

- [ ] **Step 1: Add import and daily-bets fetch**

Add the import at the top of `<script setup>` (with the other imports, around line 167):

```javascript
import { filterBetsForGame } from '~/utils/preLiveBets'
```

Then, right after the `selectedDate` ref definition (around line 194), add:

```javascript
// Daily-bets para indicador pré-live (refetch automático ao mudar data)
const { data: dailyBetsData } = useDailyBets({ date: selectedDate })
const allBets = computed(() => dailyBetsData.value?.bets || [])

const preLiveBetsByGame = computed(() => {
  const map = {}
  for (const jogo of state.response?.jogos || []) {
    map[jogo.jogo_id] = filterBetsForGame(allBets.value, jogo)
  }
  return map
})
```

The `useDailyBets` composable watches the `selectedDate` ref, so changing the datepicker triggers a refetch automatically.

- [ ] **Step 2: Pass preLiveBets prop to ReportGameCard in favorites section**

Find the `<ReportGameCard` inside the favorites TransitionGroup (around line 101) and add the prop:

```vue
<ReportGameCard
  v-for="j in favoriteGames"
  :key="j.jogo_id"
  :game="j"
  :report-date="selectedDate"
  :pre-live-bets="preLiveBetsByGame[j.jogo_id] || []"
/>
```

- [ ] **Step 3: Pass preLiveBets prop to ReportGameCard in the main grid**

Find the `<ReportGameCard` in the main sections loop (around line 158) and add the same prop:

```vue
<ReportGameCard
  v-for="j in group.jogos"
  :key="j.jogo_id"
  :game="j"
  :report-date="selectedDate"
  :pre-live-bets="preLiveBetsByGame[j.jogo_id] || []"
/>
```

- [ ] **Step 4: Visual check**

Run `pnpm run dev`, navigate to daily-report. Verify the page loads without errors. Badge won't be visible yet (Task 5 adds it).

- [ ] **Step 5: Commit**

```bash
cd jonebet-frontend
git add app/pages/daily-report.vue
git commit -m "feat(daily-report): fetch daily-bets and pass to ReportGameCard"
```

---

### Task 5: Report card — badge with tooltip

**Files:**
- Modify: `app/components/reportGameCard.vue`

**Interfaces:**
- Consumes: `preLiveBets` prop (Array, default `[]`)
- Produces: Badge next to Flashscore link + UPopover tooltip with model names and odds

- [ ] **Step 1: Add preLiveBets prop**

In `<script setup>`, add to `defineProps` (around line 83):

```javascript
defineProps({
  game: { type: Object, required: true },
  reportDate: { type: String, default: '' },
  preLiveBets: { type: Array, default: () => [] },
})
```

- [ ] **Step 2: Add imports for formatNumber**

In `<script setup>`, add import (around line 79):

```javascript
import { formatNumber } from '~/utils/formatNumber'
```

- [ ] **Step 3: Add badge with UPopover next to Flashscore link**

In the template, inside the `<span class="flex items-center gap-1.5">` block (line 12), after the Flashscore `<a>` link (around line 38), add:

```vue
<UPopover v-if="preLiveBets.length > 0" :ui="{ content: 'bg-zinc-900 border-zinc-700 p-2' }">
  <button
    type="button"
    class="flex h-7 items-center gap-1 rounded-lg border border-zinc-800 px-2 text-zinc-400 transition-colors hover:border-teal-400 hover:text-teal-400"
    title="Modelos com apostas pré-live"
  >
    <UIcon name="i-lucide-target" class="h-3.5 w-3.5" />
    <span class="text-2xs font-semibold">{{ preLiveBets.length }} modelos</span>
  </button>

  <template #content>
    <div class="flex flex-col gap-1 min-w-40">
      <div
        v-for="(bet, i) in preLiveBets"
        :key="i"
        class="flex items-center justify-between gap-3 text-xs"
      >
        <span class="font-semibold text-zinc-100">{{ modelNameToNaturalName(bet.Modelo) }}</span>

        <span class="font-semibold text-teal-400 whitespace-nowrap">
          {{ bet.Market }} · {{ formatNumber(bet.Odd, 2) }}
        </span>
      </div>
    </div>
  </template>
</UPopover>
```

- [ ] **Step 4: Visual check**

Run `pnpm run dev`, navigate to daily-report with a date that has bets. Verify:
- Badge shows "X modelos" next to the Flashscore link
- Hover on desktop shows tooltip with model names + market + odds (2 decimal places)
- On mobile (or touch), tapping shows the tooltip
- Games without bets show no badge

- [ ] **Step 5: Commit**

```bash
cd jonebet-frontend
git add app/components/reportGameCard.vue
git commit -m "feat(reportGameCard): add pre-live bets badge with tooltip"
```

---

### Task 6: Run full test suite and verify

- [ ] **Step 1: Run all unit tests**

Run: `cd jonebet-frontend && pnpm test:unit`
Expected: All tests pass including the new `preLiveBets.spec.ts`

- [ ] **Step 2: Visual smoke test**

Run `pnpm run dev` and verify:
1. Scanner page: badges appear on games with bets, modal opens/closes correctly
2. Daily-report page: badges appear, tooltip shows on hover
3. Changing date in datepicker refetches bets and updates badges
4. No console errors

- [ ] **Step 3: Commit any final fixes**

```bash
cd jonebet-frontend
git add -A
git commit -m "fix: pre-live indicator polish and test fixes"
```
