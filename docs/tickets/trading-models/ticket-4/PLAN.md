# Ticket 4 — Frontend wire up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended), superpowers:executing-plans, or unlazy to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `useTradingModels` to the real API endpoints with PENDING support, full model names, skeleton loading, and visible errors.

**Architecture:** Injectable-`fetchFn` composable (repo precedent `useDailyReport`) doing two loads (daily per date, summary once); components consume via `vi.mock('~/composables/useTradingModels.js')` in specs; shared `tradingModelLabel` helper in `enums.js` for card + table labels.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, NuxtUI v4 (`USkeleton`), Vitest + `mountSuspended` + `// @vitest-environment nuxt`.

## Global Constraints

- No TypeScript in source — plain `<script setup>` JS only.
- No `ref`/`computed` imports from 'vue' — Nuxt auto-imports.
- `formatUnit` for PnL/subtotal/total, `formatNumber` for odds, never `toFixed(2)`.
- Profit coloring: `text-teal-500` positive, `text-red-500` negative (project convention; trading components currently use green-400/red-400 — keep existing classes, do not restyle).
- TDD: failing test first, every task. Frequent commits. No full-suite runs mid-plan (once at end).

---

### Task 1: enums — full model names, label helper, PENDING

**Files:**
- Modify: `app/utils/enums.js:31-44`
- Test: `tests/app/utils/trading-models-enums.spec.ts` (exists, asserts old keys — will be rewritten first)

**Interfaces:**
- Consumes: nothing new.
- Produces: `TRADING_MODEL_BADGE` keyed by `lay_0x1_scorpion|donkey|crash|pacman|luigi`; `TRADING_MODEL_RESULT.PENDING`; `tradingModelLabel(model: string, fallback?: string) => string` used by Tasks 5–6.

- [ ] **Step 1: Rewrite the spec to the new contract (fails)**
```js
import { describe, it, expect } from 'vitest'
import { TRADING_MODEL_BADGE, TRADING_MODEL_RESULT, tradingModelLabel } from '~/utils/enums'

describe('TRADING_MODEL_BADGE', () => {
  it('is keyed by full API model names', () => {
    expect(Object.keys(TRADING_MODEL_BADGE).sort()).toEqual([
      'lay_0x1_crash', 'lay_0x1_donkey', 'lay_0x1_luigi', 'lay_0x1_pacman', 'lay_0x1_scorpion',
    ])
  })

  it('donkey is blue', () => {
    expect(TRADING_MODEL_BADGE.lay_0x1_donkey).toContain('blue')
  })

  it('scorpion is amber', () => {
    expect(TRADING_MODEL_BADGE.lay_0x1_scorpion).toContain('amber')
  })
})

describe('TRADING_MODEL_RESULT', () => {
  it('maps PENDING to a zinc color', () => {
    expect(TRADING_MODEL_RESULT.PENDING).toContain('zinc')
  })
})

describe('tradingModelLabel', () => {
  it('capitalizes the lay_0x1_ suffix', () => {
    expect(tradingModelLabel('lay_0x1_scorpion', '0x1')).toBe('Scorpion')
  })

  it('returns the raw model when no fallback', () => {
    expect(tradingModelLabel('weird')).toBe('weird')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `.venv` n/a — frontend: `pnpm vitest run tests/app/utils/trading-models-enums.spec.ts`
Expected: FAIL (keys `donkey` etc. missing, `tradingModelLabel` not defined)

- [ ] **Step 3: Implement**
```js
// Trading model badge colors, keyed by full API model names (lay_0x1_*).
export const TRADING_MODEL_BADGE = Object.freeze({
  lay_0x1_donkey: 'bg-blue-500/20 text-blue-400',
  lay_0x1_luigi: 'bg-green-500/20 text-green-400',
  lay_0x1_crash: 'bg-red-500/20 text-red-400',
  lay_0x1_pacman: 'bg-purple-500/20 text-purple-400',
  lay_0x1_scorpion: 'bg-amber-500/20 text-amber-400',
})

export const TRADING_MODEL_RESULT = Object.freeze({
  GREEN: 'text-green-400',
  RED_LIGHT: 'text-amber-400',
  RED: 'text-red-400',
  PENDING: 'text-zinc-400',
})

// Display label: 'lay_0x1_scorpion' -> 'Scorpion'; unknown names use the API model_label.
export function tradingModelLabel(model, fallback) {
  if (typeof model === 'string' && model.startsWith('lay_0x1_')) {
    const suffix = model.slice('lay_0x1_'.length)
    if (suffix) return suffix.charAt(0).toUpperCase() + suffix.slice(1)
  }
  return fallback ?? model
}
```
Keep `TRADING_DAYS_PER_YEAR`, `MARKET_LABELS`, `RESULT` untouched.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/app/utils/trading-models-enums.spec.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add app/utils/enums.js tests/app/utils/trading-models-enums.spec.ts
git commit -m "feat: trading enums com nomes completos, label helper e PENDING"
```

---

### Task 2: schemas — split tradingDaily + tradingSummary

**Files:**
- Modify: `app/utils/schemas.js:59-62`
- Test: `tests/app/utils/schemas-trading-models.spec.ts` (exists, asserts old shape — rewritten first)

**Interfaces:**
- Consumes: existing `FlexObject`, `safeParse` in schemas.js (same file, unchanged).
- Produces: `endpointSchemas.tradingDaily` (fallback `{ date: null, daily: [] }`), `endpointSchemas.tradingSummary` (fallback `{ week: null, month: null }`); removes `tradingModelsList`. Used by Task 3.

- [ ] **Step 1: Rewrite the spec (fails)**
```js
import { describe, it, expect } from 'vitest'
import { endpointSchemas } from '~/utils/schemas'

describe('tradingDaily schema', () => {
  it('has tradingDaily entry and no monolithic entry', () => {
    expect(endpointSchemas.tradingDaily).toBeDefined()
    expect(endpointSchemas.tradingModelsList).toBeUndefined()
  })

  it('returns fallback on non-object input', () => {
    const result = endpointSchemas.tradingDaily.schema.safeParse(null)
    expect(result.success).toBe(false)
  })

  it('passthrough preserves the real daily shape', () => {
    const input = {
      date: '2026-09-05',
      daily: [{ model: 'lay_0x1_scorpion', model_label: '0x1', subtotal: -7.57, bets: [] }],
    }
    const result = endpointSchemas.tradingDaily.schema.parse(input)
    expect(result.daily).toEqual(input.daily)
  })
})

describe('tradingSummary schema', () => {
  it('passthrough preserves week/month rows', () => {
    const input = {
      week: { start_date: '2026-08-31', end_date: '2026-09-06', rows: [] },
      month: { year: 2026, month: 9, rows: [] },
    }
    const result = endpointSchemas.tradingSummary.schema.parse(input)
    expect(result.week.rows).toEqual([])
    expect(result.month.year).toBe(2026)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/app/utils/schemas-trading-models.spec.ts`
Expected: FAIL (`tradingDaily` undefined)

- [ ] **Step 3: Implement** — in `app/utils/schemas.js`, replace the `tradingModelsList` entry (lines 59-62):
```js
tradingDaily: {
  schema: FlexObject.default({ date: null, daily: [] }),
  fallback: { date: null, daily: [] },
},
tradingSummary: {
  schema: FlexObject.default({ week: null, month: null }),
  fallback: { week: null, month: null },
},
```
Delete `tradingModelsList`. Verify no other file references `tradingModelsList` (only `useTradingModels.js` uses it — rewritten in Task 3 — and the old spec).

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/app/utils/schemas-trading-models.spec.ts`
Expected: PASS. Note: `useTradingModels.js` still imports the deleted key — suite failures there are expected until Task 3.

- [ ] **Step 5: Commit**

```bash
git add app/utils/schemas.js tests/app/utils/schemas-trading-models.spec.ts
git commit -m "feat: split trading schema em daily + summary"
```

---

### Task 3: useTradingModels — dual fetch, no mock, real errors

**Files:**
- Modify: `app/composables/useTradingModels.js` (full rewrite, delete `MOCK_DATA` lines 22-158)
- Test: create `tests/app/composables/useTradingModels.spec.ts`

**Interfaces:**
- Consumes: `safeParse` from `~/utils/schemas`; `endpointSchemas.tradingDaily/tradingSummary` (Task 2).
- Produces: `useTradingModels({ date, fetchFn })` returning `{ daily, summary, dailyPending, summaryPending, pending, error, refresh }` used by Task 4. `fetchFn(url)` defaults to `$fetch`; tests inject `vi.fn()`.

- [ ] **Step 1: Write the failing test**
```js
// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useTradingModels } from '~/composables/useTradingModels'

const DAILY = { date: '2026-09-05', daily: [{ model: 'lay_0x1_scorpion', model_label: '0x1', subtotal: 1.5, bets: [] }] }
const SUMMARY = { week: { start_date: '2026-08-31', end_date: '2026-09-06', rows: [] }, month: { year: 2026, month: 9, rows: [] } }

function fetchFnFor(daily = DAILY, summary = SUMMARY) {
  return vi.fn(async (url) => (url.includes('/summary') ? summary : daily))
}

describe('useTradingModels', () => {
  it('fetches daily with date and summary without query', async () => {
    const fetchFn = fetchFnFor()
    const { daily, summary } = useTradingModels({ date: ref('2026-09-05'), fetchFn })
    await new Promise((r) => setTimeout(r, 0))
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('/trading-models/daily?date=2026-09-05'))
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('/trading-models/summary'))
    expect(daily.value.daily).toHaveLength(1)
    expect(summary.value.week.start_date).toBe('2026-08-31')
  })

  it('exposes fetch errors instead of mock data', async () => {
    const fetchFn = vi.fn(async () => { throw new Error('boom') })
    const { daily, error } = useTradingModels({ date: ref('2026-09-05'), fetchFn })
    await new Promise((r) => setTimeout(r, 0))
    expect(error.value).toBeInstanceOf(Error)
    expect(daily.value.daily).toEqual([])
  })

  it('date change reloads daily only, summary stays cached', async () => {
    const fetchFn = fetchFnFor()
    const date = ref('2026-09-05')
    useTradingModels({ date, fetchFn })
    await new Promise((r) => setTimeout(r, 0))
    date.value = '2026-09-04'
    await new Promise((r) => setTimeout(r, 0))
    expect(fetchFn.mock.calls.filter(([u]) => u.includes('/daily')).length).toBe(2)
    expect(fetchFn.mock.calls.filter(([u]) => u.includes('/summary')).length).toBe(1)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/app/composables/useTradingModels.spec.ts`
Expected: FAIL (module has no such signature; mock shape differs)

- [ ] **Step 3: Implement** — rewrite `app/composables/useTradingModels.js`:
```js
import { safeParse } from '~/utils/schemas'

const apiUrl = () => useRuntimeConfig().public.API_URL

const defaultFetch = (url) => $fetch(url)

export function useTradingModels({ date, fetchFn = defaultFetch } = {}) {
  const dateRef = isRef(date) ? date : ref(date)
  const daily = ref({ date: null, daily: [] })
  const summary = ref({ week: null, month: null })
  const dailyPending = ref(false)
  const summaryPending = ref(false)
  const error = ref(null)
  let summaryLoaded = false

  async function loadDaily() {
    if (!dateRef.value) return
    dailyPending.value = true
    try {
      const raw = await fetchFn(`${apiUrl()}/trading-models/daily?date=${dateRef.value}`)
      daily.value = safeParse('tradingDaily', raw)
    } catch (e) {
      error.value = e
      daily.value = { date: dateRef.value, daily: [] }
    } finally {
      dailyPending.value = false
    }
  }

  async function loadSummary() {
    if (summaryLoaded) return
    summaryLoaded = true
    summaryPending.value = true
    try {
      const raw = await fetchFn(`${apiUrl()}/trading-models/summary`)
      summary.value = safeParse('tradingSummary', raw)
    } catch (e) {
      error.value = e
    } finally {
      summaryPending.value = false
    }
  }

  function refresh() {
    error.value = null
    loadDaily()
    loadSummary()
  }

  watch(dateRef, loadDaily)
  refresh()

  const pending = computed(() => dailyPending.value || summaryPending.value)
  return { daily, summary, dailyPending, summaryPending, pending, error, refresh }
}
```
Keep the file's LRU helpers ONLY if reused — they are not (loads are explicit); delete `useCache/cacheGet/cacheSet/CACHE_CAP` and `MOCK_DATA`. No `ref`/`computed`/`watch` imports (auto-imported). `$fetch` is a Nuxt auto-import (same as `useFetch`/`useRuntimeConfig` usage today).

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/app/composables/useTradingModels.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add app/composables/useTradingModels.js tests/app/composables/useTradingModels.spec.ts
git commit -m "feat: useTradingModels com dual fetch real, sem mock"
```

---

### Task 4: skeleton + Content rewrite (week/month, error, empty)

**Files:**
- Create: `app/components/tradingModelsSkeleton.vue`
- Modify: `app/components/TradingModelsContent.vue` (full template + script rewire)
- Test: create `tests/app/components/TradingModelsContent.spec.ts`

**Interfaces:**
- Consumes: `useTradingModels` return shape (Task 3); `TradingModelDayCard`, `TradingModelAggTable` (Tasks 5–6, props unchanged except data source).
- Produces: page renders cards from `daily.daily`, tables from `summary.week/summary.month`; skeleton per section; `DataErrorCard` on error; empty-day message.

- [ ] **Step 1: Write the failing test**
```js
// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TradingModelsContent from '~/components/TradingModelsContent.vue'

vi.mock('~/composables/useTradingModels.js', () => ({ useTradingModels: vi.fn() }))

import { useTradingModels } from '~/composables/useTradingModels'

function mockReturn(overrides = {}) {
  useTradingModels.mockReturnValue({
    daily: ref({ date: '2026-09-05', daily: [] }),
    summary: ref({ week: null, month: null }),
    dailyPending: ref(false),
    summaryPending: ref(false),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
    ...overrides,
  })
}

describe('TradingModelsContent', () => {
  it('shows skeleton cards while daily is pending', async () => {
    mockReturn({ dailyPending: ref(true), pending: ref(true) })
    const wrapper = await mountSuspended(TradingModelsContent)
    expect(wrapper.findComponent({ name: 'TradingModelsSkeleton' }).exists()).toBe(true)
  })

  it('shows error card on fetch failure', async () => {
    mockReturn({ error: ref(new Error('boom')) })
    const wrapper = await mountSuspended(TradingModelsContent)
    expect(wrapper.text()).toContain('Não foi possível carregar')
  })

  it('shows empty-day message when daily has no models', async () => {
    mockReturn({})
    const wrapper = await mountSuspended(TradingModelsContent)
    expect(wrapper.text()).toContain('Sem apostas neste dia')
  })

  it('renders week table from summary.week', async () => {
    mockReturn({
      summary: ref({
        week: { start_date: '2026-08-31', end_date: '2026-09-06', rows: [] },
        month: null,
      }),
    })
    const wrapper = await mountSuspended(TradingModelsContent)
    expect(wrapper.text()).toContain('31/08')
  })
})
```
Week title format: `Semana (31/08 a 06/09)` — use `formatDate` short style from `~/utils/timezone` (check its export name in the file before implementing; ticket-2 SPEC says `formatDate` exists there).

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/app/components/TradingModelsContent.spec.ts`
Expected: FAIL (`TradingModelsSkeleton` missing; week/month keys unread)

- [ ] **Step 3: Implement skeleton** — `app/components/tradingModelsSkeleton.vue`, mirroring `performancePageSkeleton.vue` (5 card-height `h-32` blocks for the day section + 2 table-height `h-64` blocks for week/month):
```vue
<template>
  <div class="grid grid-cols-1 gap-3">
    <USkeleton v-for="i in 5" :key="`day-${i}`" class="h-32 w-full rounded-2xl" />
    <USkeleton v-for="i in 2" :key="`agg-${i}`" class="h-64 w-full rounded-2xl" />
  </div>
</template>
```

- [ ] **Step 4: Implement Content** — rewrite `TradingModelsContent.vue`:
  - `const { daily, summary, dailyPending, summaryPending, error } = useTradingModels({ date: selectedDate })`
  - `weeklyTitle` from `summary.value?.week?.start_date/end_date` (`Semana (31/08 a 06/09)`); `monthlyTitle` from `summary.value?.month` (`Set 2026`).
  - Template: header (stake line + DatePicker, unchanged) → `<TradingModelsSkeleton v-if="dailyPending" />` for cards section → `DataErrorCard v-else-if="error"` (default message) → day cards `v-for="model in daily?.daily ?? []"` → empty-day `DataErrorCard v-if="!dailyPending && !error && !(daily?.daily?.length)"` message "Sem apostas neste dia" icon `i-lucide-calendar-x` → `<TradingModelsSkeleton v-if="summaryPending" />` → agg tables `v-if="summary?.week"` / `v-if="summary?.month"`.
- [ ] **Step 5: Run to verify it passes**

Run: `pnpm vitest run tests/app/components/TradingModelsContent.spec.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**
```bash
git add app/components/tradingModelsSkeleton.vue app/components/TradingModelsContent.vue tests/app/components/TradingModelsContent.spec.ts
git commit -m "feat: trading content com skeleton, week/month e empty state"
```

---

### Task 5: DayCard — PENDING guards, goals, label helper

**Files:**
- Modify: `app/components/tradingModelDayCard.vue:9,20-22,59-71`
- Test: extend `tests/app/components/tradingModelDayCard.spec.ts` (exists, 83 lines — keep all existing tests green)

**Interfaces:**
- Consumes: `tradingModelLabel` (Task 1); bet shape `{ fixture_id, home, away, time, odd, ht_score|null, minute_70_score|null, ft_score|null, goals_home|null, goals_away|null, result, profit }`.

- [ ] **Step 1: Append failing tests** (keep existing `mockModel`; update its `model: 'donkey'` → `'lay_0x1_donkey'` and `model_label: 'Donkey'` stays as fallback; existing badge test expects `'Donkey'` — still passes via helper):
```js
it('derives badge label from full model name', async () => {
  const wrapper = await mountSuspended(TradingModelDayCard, {
    props: { model: { ...mockModel, model: 'lay_0x1_scorpion', model_label: '0x1' } },
  })
  expect(wrapper.text()).toContain('Scorpion')
})

it('renders dashes for PENDING bet without crashing', async () => {
  const pendingModel = {
    ...mockModel,
    model: 'lay_0x1_scorpion',
    bets: [{
      fixture_id: 'p1', home: 'Flu', away: 'Fla', time: '18:00', odd: 4.2,
      ht_score: null, minute_70_score: null, ft_score: null,
      goals_home: null, goals_away: null, result: 'PENDING', profit: 0,
    }],
  }
  const wrapper = await mountSuspended(TradingModelDayCard, { props: { model: pendingModel } })
  expect(wrapper.text()).toContain('PENDING')
  expect(wrapper.text()).toContain('—')
})

it('renders goal minutes literally', async () => {
  const wrapper = await mountSuspended(TradingModelDayCard, {
    props: { model: { ...mockModel, bets: [{ ...mockModel.bets[0], goals_home: [], goals_away: ['53', '90+10'] }] } },
  })
  expect(wrapper.text()).toContain("53'")
  expect(wrapper.text()).toContain("90+10'")
})
```
Before appending: rename the existing `mockModel` fields `goals_home_minutes` → `goals_home` and `goals_away_minutes` → `goals_away` (spec lines 20-21, API names per Ticket 3 SPEC), then run the suite — old tests must still pass with the new field names, proving the rename isn't vacuous (no existing assertion reads those fields).

- [ ] **Step 2: Run to verify new tests fail**

Run: `pnpm vitest run tests/app/components/tradingModelDayCard.spec.ts`
Expected: FAIL (TypeError on null scores; goals not rendered; label 'Scorpion' missing)

- [ ] **Step 3: Implement**
  - Script: import `tradingModelLabel`; `badgeClass` uses full name (unchanged lookup, keys now match); add `modelLabel = computed(() => tradingModelLabel(props.model.model, props.model.model_label))`; add `scoreText = (s) => (s ? `${s[0]}x${s[1]}` : '—')`.
  - Template: badge shows `{{ modelLabel }}`; HT/70'/FT cells use `{{ scoreText(bet.ht_score) }}` etc.; result span class `TRADING_MODEL_RESULT[bet.result] ?? 'text-zinc-400'`; add `Gols` column after FT: `<td>{{ goalsText(bet.goals_home, bet.goals_away) }}</td>` with `goalsText = (h, a) => [h ?? [], a ?? []].flat().map((m) => `${m}'`).join(' ') || '—'`. Keep table header order: Jogo, Hora, Odd, HT, 70', FT, Gols, Resultado, PnL.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/app/components/tradingModelDayCard.spec.ts`
Expected: PASS (all old + 3 new)

- [ ] **Step 5: Commit**

```bash
git add app/components/tradingModelDayCard.vue tests/app/components/tradingModelDayCard.spec.ts
git commit -m "feat: day card com PENDING, gols literais e label derivado"
```

---

### Task 6: AggTable — shared label + computed total

**Files:**
- Modify: `app/components/tradingModelAggTable.vue:35,50-55`
- Test: extend `tests/app/components/tradingModelAggTable.spec.ts` (exists — keep green)

**Interfaces:**
- Consumes: `tradingModelLabel` (Task 1); `agg.rows[]` with `{ model, model_label, games, green, red_light, red, total }`. No `agg.total` from API.

- [ ] **Step 1: Append failing tests**
```js
it('shows derived label instead of raw model name', async () => {
  // mount with rows: [{ model: 'lay_0x1_pacman', model_label: '0x1', games: 2, green: 2, red_light: 0, red: 0, total: 20 }]
  expect(wrapper.text()).toContain('Pacman')
  expect(wrapper.text()).not.toContain('lay_0x1_pacman')
})

it('computes TOTAL from rows when agg.total is absent', async () => {
  // rows totals 20 and -3.5 → TOTAL shows formatUnit(16.5)
  expect(wrapper.find('[data-testid="agg-total"]').text()).toContain('16.50')
})
```
(Write full mount code in the spec following the file's existing pattern — read the top of the spec for its mock agg shape before writing.)

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/app/components/tradingModelAggTable.spec.ts`
Expected: FAIL (raw name shown; TOTAL empty without `agg.total`)

- [ ] **Step 3: Implement**
  - Script: import `tradingModelLabel`; `rowLabel = (row) => tradingModelLabel(row.model, row.model_label)`; `grandTotal = computed(() => props.agg.rows.reduce((s, r) => s + (r.total ?? 0), 0))`.
  - Template line 35: `{{ rowLabel(row) }}` and REMOVE the `capitalize` class (labels from `tradingModelLabel` are already capitalized; the class is dead weight).
  - TOTAL row: `cellClass(grandTotal)` + `{{ formatUnit(grandTotal) }}` — no sign prefix (approved Ticket-2 layout shows TOTAL without sign; DayCard subtotal keeps its sign).

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/app/components/tradingModelAggTable.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/components/tradingModelAggTable.vue tests/app/components/tradingModelAggTable.spec.ts
git commit -m "feat: agg table com label derivado e total somado"
```

---

### Task 7: full suite + visual check against production

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `pnpm test:unit`
Expected: all green (currently 269 tests + new ones from Tasks 1–6)

- [ ] **Step 2: Visual check** — `pnpm run dev`, open `/performance/trading-models`, confirm: cards with real submodel names (Scorpion…), PENDING rows with "—" if any, week/month tables with totals, skeleton flash on date change. Dismiss the 18+ modal first.

- [ ] **Step 3: Commit** — nothing to commit (verification task); record result in the task tracker.

---

## Self-Review

- Spec coverage: dual fetch ✓ (T3), mock deleted ✓ (T3), PENDING ✓ (T5), full names + labels ✓ (T1/T5/T6), error + empty ✓ (T4), skeleton ✓ (T4), schema split ✓ (T2), agg gaps (sum + label, user-approved) ✓ (T6).
- No placeholders: all steps carry exact code/commands.
- Type consistency: `tradingModelLabel(model, fallback)` signature identical in T1/T5/T6; composable return keys identical in T3/T4; schema names `tradingDaily/tradingSummary` identical in T2/T3.
