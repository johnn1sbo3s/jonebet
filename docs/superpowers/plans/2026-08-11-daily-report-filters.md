# Daily Report Client-Side Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-side toolbar to `/daily-report` — a search field (teams/league, accent-insensitive) and a searchable strategy multiselect ("Com recomendação" + the day's models, OR semantics) — filtering the grouped games while keeping the favorites section fixed and immune.

**Architecture:** Pure filter util (`app/utils/filterReportGames.js`) consumed by a `filteredJogos` computed in the page; both existing groupers (`byLeague`/`byHour`) read from it so both views respect the filters. Layout: desktop = segmented control left, filter group right (`justify-between`); mobile ≤md = stacked full-width, with `SegmentedControl` gaining a `fullWidth` prop for a 50/50 toggle.

**Tech Stack:** Nuxt 4.4.7, Nuxt UI v4.10.0 (`USelectMenu` with `multiple`/`clear`; internal search is on by default via `searchInput` default `true`), Tailwind v4, Vitest 4 + @nuxt/test-utils, plain `<script setup>` JS.

## Global Constraints

- Nuxt UI v4.10.0 `USelectMenu` (verified in `node_modules/@nuxt/ui/dist/runtime/components/SelectMenu.vue`): `multiple`, `clear`; **`valueKey` has NO default — items are `{value, label}` objects, so `value-key="value"` is REQUIRED** (without it, `:value` on ComboboxItem is the whole item object and the v-model holds objects, breaking string comparisons); `labelKey` defaults to `'label'`; value comparison falls back to `by ?? valueKey`; the **default slot** (used as trigger content) receives `{ modelValue, open, ui }`; the trailing chevron/clear renders outside the default slot, so overriding `#default` keeps it.
- Plain `<script setup>` JS only — no TypeScript in source files.
- Prettier: no semicolons, single quotes, 120 char width, 2-space indent; Tailwind v4 classes sorted by `prettier-plugin-tailwindcss` (auto-run via lint-staged on commit).
- No Tailwind arbitrary pixel values (`text-[10px]` barred by `scripts/check-arbitrary-values.cjs`); use scale classes (`w-72`, `text-2xs`).
- Model display names come from `modelNameToNaturalName` (`~/utils/resolveModelName.js`); strategy filter sentinel is `ANY_STRATEGY = '__any__'` exported from the new util.
- Favorites section is immune to filters (user decision). Filters do **not** persist between visits; `viewMode` keeps persisting as today.
- Do **not** run `npx eslint`, `npx prettier --check`, or `pnpm build` per edit — husky runs lint-staged on commit. Run `pnpm test:unit` for the suite.
- The dev server on port 3000 belongs to the user — never kill it.

---

### Task 1: SegmentedControl `fullWidth` prop

**Files:**
- Modify: `app/components/SegmentedControl.vue`
- Test: `tests/app/components/segmentedControl.spec.ts` (Create — file does not exist today)

**Interfaces:**
- Produces: prop `fullWidth: Boolean` (default `false`). When `true`: root gets `w-full md:w-auto`; buttons get `flex-1 md:flex-none`. No other consumer is affected (only `daily-report.vue` will pass it).

- [ ] **Step 1: Write the failing test**

Create `tests/app/components/segmentedControl.spec.ts`:

```ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SegmentedControl from '~/components/SegmentedControl.vue'

const options = [
  { value: 'by_league', label: 'Por liga' },
  { value: 'by_hour', label: 'Por horário' },
]

describe('SegmentedControl', () => {
  it('marca a opção ativa', async () => {
    const wrapper = await mountSuspended(SegmentedControl, {
      props: { modelValue: 'by_league', options },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].classes()).toContain('bg-teal-500')
    expect(buttons[1].classes()).not.toContain('bg-teal-500')
  })

  it('aplica largura total quando fullWidth é true', async () => {
    const wrapper = await mountSuspended(SegmentedControl, {
      props: { modelValue: 'by_league', options, fullWidth: true },
    })
    expect(wrapper.find('div').classes()).toContain('w-full')
    expect(wrapper.findAll('button')[0].classes()).toContain('flex-1')
  })

  it('não aplica largura total por padrão', async () => {
    const wrapper = await mountSuspended(SegmentedControl, {
      props: { modelValue: 'by_league', options },
    })
    expect(wrapper.find('div').classes()).not.toContain('w-full')
    expect(wrapper.findAll('button')[0].classes()).not.toContain('flex-1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/app/components/segmentedControl.spec.ts`
Expected: FAIL — `w-full`/`flex-1` not present (prop doesn't exist yet; the `fullWidth` classes assertions fail).

- [ ] **Step 3: Implement**

Replace the template and script of `app/components/SegmentedControl.vue`:

```vue
<template>
  <div
    class="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1"
    :class="fullWidth && 'w-full md:w-auto'"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="rounded-md px-3 py-1 text-sm transition"
      :class="[
        opt.value === modelValue
          ? 'bg-teal-500 font-semibold text-zinc-950'
          : 'font-medium text-zinc-400 hover:text-white',
        fullWidth && 'flex-1 md:flex-none',
      ]"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
  fullWidth: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/app/components/segmentedControl.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/components/SegmentedControl.vue tests/app/components/segmentedControl.spec.ts
git commit -m "feat: add fullWidth prop to SegmentedControl (mobile 50/50 toggle)"
```

---

### Task 2: `filterReportGames` pure util

**Files:**
- Create: `app/utils/filterReportGames.js`
- Test: `tests/app/utils/filterReportGames.spec.ts` (Create — file does not exist today)

**Interfaces:**
- Produces: `ANY_STRATEGY` (string sentinel `'__any__'`), `normalizeSearchText(text) -> string`, `filterReportGames(jogos, { query, selected }) -> jogos`. Consumed by Task 3.

- [ ] **Step 1: Write the failing test**

Create `tests/app/utils/filterReportGames.spec.ts`:

```ts
// tests/app/utils/filterReportGames.spec.ts
import { describe, it, expect } from 'vitest'
import { ANY_STRATEGY, filterReportGames, normalizeSearchText } from '~/utils/filterReportGames.js'

const games = [
  { jogo_id: '1', home: 'São Paulo', away: 'Corinthians', league: 'Brasileirão Série A', estrategias: [{ estrategia: 'gol_1t' }] },
  { jogo_id: '2', home: 'Talleres Córdoba', away: 'Lanús', league: 'Argentina Liga Profesional', estrategias: [{ estrategia: 'lay_0x1' }, { estrategia: 'lay_1x0' }] },
  { jogo_id: '3', home: 'Avaí', away: 'CRB', league: 'Brasil Brasileirão Série B', estrategias: [] },
  { jogo_id: '4', home: 'Real Madrid', away: 'Betis', league: 'Espanha La Liga', estrategias: [{ estrategia: 'lay_zebra' }] },
]

describe('normalizeSearchText', () => {
  it('remove acentos e minúsculas', () => {
    expect(normalizeSearchText('São Paulo')).toBe('sao paulo')
  })
})

describe('filterReportGames', () => {
  it('sem filtro devolve todos os jogos', () => {
    expect(filterReportGames(games, {})).toHaveLength(4)
  })

  it('busca casa por nome com acento', () => {
    expect(filterReportGames(games, { query: 'sao' }).map((g) => g.jogo_id)).toEqual(['1'])
  })

  it('busca ignora maiúsculas', () => {
    expect(filterReportGames(games, { query: 'SAO PAULO' }).map((g) => g.jogo_id)).toEqual(['1'])
  })

  it('busca casa com a liga', () => {
    expect(filterReportGames(games, { query: 'série' }).map((g) => g.jogo_id)).toEqual(['1', '3'])
  })

  it('busca sem correspondência devolve vazio', () => {
    expect(filterReportGames(games, { query: 'flamengo' })).toHaveLength(0)
  })

  it('estratégia única filtra pelos jogos daquela estratégia', () => {
    expect(filterReportGames(games, { selected: ['gol_1t'] }).map((g) => g.jogo_id)).toEqual(['1'])
  })

  it('múltiplas estratégias usam união (OR)', () => {
    expect(filterReportGames(games, { selected: ['lay_0x1', 'lay_zebra'] }).map((g) => g.jogo_id)).toEqual(['2', '4'])
  })

  it('Com recomendação mostra jogos com pelo menos 1 estratégia', () => {
    expect(filterReportGames(games, { selected: [ANY_STRATEGY] }).map((g) => g.jogo_id)).toEqual(['1', '2', '4'])
  })

  it('busca e estratégias combinam (interseção)', () => {
    expect(filterReportGames(games, { query: 'avai', selected: ['gol_1t'] })).toHaveLength(0)
  })

  it('seleção vazia não filtra', () => {
    expect(filterReportGames(games, { selected: [] })).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/app/utils/filterReportGames.spec.ts`
Expected: FAIL — module not found (`~/utils/filterReportGames.js` doesn't exist yet).

- [ ] **Step 3: Implement**

Create `app/utils/filterReportGames.js`:

```js
// Filtro client-side dos jogos do relatório: busca textual (time da casa,
// visitante e liga — sem diferenciar caixa nem acentos) + seleção de
// estratégias (união OR; a sentinela ANY_STRATEGY representa "qualquer jogo
// com pelo menos 1 estratégia"). Função pura, testada em tests/app/utils/.
export const ANY_STRATEGY = '__any__'

export function normalizeSearchText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function filterReportGames(jogos = [], { query = '', selected = [] } = {}) {
  const q = normalizeSearchText(query)
  const sel = selected.filter(Boolean)
  return jogos.filter((jogo) => {
    if (q) {
      const haystack = [jogo.home, jogo.away, jogo.league]
      if (!haystack.some((field) => normalizeSearchText(field).includes(q))) return false
    }
    if (sel.length) {
      const keys = (jogo.estrategias || []).map((e) => e.estrategia)
      if (sel.includes(ANY_STRATEGY) ? keys.length === 0 : !keys.some((k) => sel.includes(k))) {
        return false
      }
    }
    return true
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/app/utils/filterReportGames.spec.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add app/utils/filterReportGames.js tests/app/utils/filterReportGames.spec.ts
git commit -m "feat: add client-side report filter util (search + strategy OR)"
```

---

### Task 3: Wire filters into `/daily-report`

**Files:**
- Modify: `app/pages/daily-report.vue`

**Interfaces:**
- Consumes: `filterReportGames` + `ANY_STRATEGY` (Task 2), `modelNameToNaturalName` (`~/utils/resolveModelName.js`), `fullWidth` prop (Task 1).

- [ ] **Step 1: Add imports**

At the top of `<script setup>` in `app/pages/daily-report.vue`, after the existing `SP_TZ` import line, add:

```js
import { ANY_STRATEGY, filterReportGames } from '~/utils/filterReportGames'
import { modelNameToNaturalName } from '~/utils/resolveModelName'
```

- [ ] **Step 2: Add filter state and computeds**

Insert this block right after the existing `viewOptions` array definition (before the `byHour` computed):

```js
// --- Filtros client-side (busca + estratégias) ---
// Estado transitório de exploração — NÃO persiste entre visitas (diferente do
// viewMode, que é preferência de visualização). Reseta naturalmente no
// re-mount da página.
const query = ref('')
const selected = ref([])

// Opções do multiselect: "Com recomendação" + as estratégias distintas do
// relatório do dia, em ordem alfabética do nome natural (nunca lista fixa).
const strategyOptions = computed(() => {
  const keys = [
    ...new Set((state.response?.jogos || []).flatMap((j) => (j.estrategias || []).map((e) => e.estrategia))),
  ]
  const rest = keys
    .map((key) => ({ value: key, label: modelNameToNaturalName(key) }))
    .sort((a, b) => a.label.localeCompare(b.label))
  return [{ value: ANY_STRATEGY, label: 'Com recomendação' }, ...rest]
})

const strategyLabel = (value) => (value === ANY_STRATEGY ? 'Com recomendação' : modelNameToNaturalName(value))

// Gatilho compacto do multiselect: evita o label padrão do USelectMenu
// (labels unidos por vírgula), que transborda no mobile com 3+ selecionadas.
// A limpeza das estratégias fica no X embutido do próprio select (clear).
const triggerLabel = computed(() => {
  const n = selected.value.length
  if (n === 0) return 'Estratégias'
  if (n === 1) return strategyLabel(selected.value[0])
  return `${n} estratégias`
})

// Jogos que passam busca + estratégias; alimenta os dois agrupamentos
// (liga/horário). Favoritos continuam na lista completa — seção fixa no topo.
const filteredJogos = computed(() =>
  filterReportGames(state.response?.jogos || [], { query: query.value, selected: selected.value }),
)
```

- [ ] **Step 3: Point both groupers at the filtered list**

In the `byLeague` computed, change the first line of the body from:

```js
  const jogos = state.response?.jogos || []
```

to:

```js
  const jogos = filteredJogos.value
```

Do the **same single-line change** inside the `byHour` computed. Also update the stale comment in **both** groupers (currently "Todos os jogos entram nos grupos — favoritos também (ficam duplicados na seção de cima, de propósito).") to:

```js
  // Jogos filtrados (busca + estratégias); favoritos continuam duplicados na
  // seção de cima, de propósito (usam a lista completa, não a filtrada).
```

- [ ] **Step 4: Replace the toolbar and the groups block in the template**

This is **two disjoint replacements** — the favorites `<template v-if="favoriteGames.length">` block (section + `<USeparator />`) sits between them and must stay untouched.

**(a)** Replace the single line `<SegmentedControl v-model="viewMode" :options="viewOptions" class="self-start" />` with the toolbar div:

```html
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <SegmentedControl v-model="viewMode" :options="viewOptions" full-width />

        <div class="flex w-full flex-col gap-3 md:flex-row md:items-center md:w-auto">
          <UInput v-model="query" icon="i-lucide-search" placeholder="Buscar time ou liga…" class="w-full md:w-72" />

          <USelectMenu
            v-model="selected"
            :items="strategyOptions"
            multiple
            clear
            value-key="value"
            class="w-full md:w-64"
          >
            <template #default>
              <span class="truncate" :class="selected.length === 0 ? 'text-zinc-500' : ''">{{ triggerLabel }}</span>
            </template>
          </USelectMenu>
        </div>
      </div>
```

**(b)** Replace the whole `<section v-for="group in groups" :key="group.key" …>…</section>` block (the one that renders `<ReportGameCard v-for="j in group.jogos" …>`) with the empty-state + groups templates:

```html
      <template v-if="filteredJogos.length === 0">
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900 py-14 text-center text-sm text-zinc-500">
          Nenhum jogo corresponde ao filtro.
        </div>
      </template>
      <template v-else>
        <section v-for="group in groups" :key="group.key" class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <header class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-bold text-zinc-100">{{ group.label }}</h2>

            <span
              class="text-2xs rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-semibold whitespace-nowrap text-zinc-400"
            >
              {{ group.jogos.length }} {{ group.jogos.length === 1 ? 'jogo' : 'jogos' }}
            </span>
          </header>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ReportGameCard v-for="j in group.jogos" :key="j.jogo_id" :game="j" />
          </div>
        </section>
      </template>
```

The favorites `<template v-if="favoriteGames.length">` block (section + `<USeparator />`) stays untouched, above the new empty-state/groups block.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test:unit`
Expected: PASS — all existing tests plus the 14 new ones (Task 1: 3, Task 2: 11). No regressions.

- [ ] **Step 6: Visual verification (dev server, desktop + mobile)**

The user's dev server runs on port 3000 — do not kill it. Open `http://localhost:3000/daily-report` in the browser:
- Desktop (~1280px): segmented control left, `Buscar time ou liga…` input + `Estratégias` select grouped right.
- Mobile (375px): segmented control full-width 50/50; input full-width; select full-width; open the select → options include `Com recomendação` + the day's models, internal search box present; select 3 options → trigger shows `3 estratégias`.
- Type `sao` → only matches involving "São Paulo" teams/leagues remain; group counters update; empty groups disappear.
- Select a strategy → only games with that model; `Com recomendação` → only games with ≥1 strategy.
- Favorites section (when favorites exist) stays full and unfiltered.
- Clear strategies with the select's built-in X; clear the search by editing the input text.
- Reload the page → filters reset (no persistence); `Por liga / Por horário` still remembers the choice.

- [ ] **Step 7: Commit**

```bash
git add app/pages/daily-report.vue
git commit -m "feat: add search and strategy filters to daily report"
```

---

## Self-Review Notes (run by the plan author)

- **Spec coverage:** toolbar layout desktop A / mobile 3 (Tasks 1+3); search accent/case-insensitive on home/away/league (Task 2); multiselect semantics incl. `Com recomendação` superset and games-with-no-analysis behavior (Task 2); favorites immune (Task 3 keeps `favoriteGames` on the full list); group counters reflect filter (Task 3, counters read `group.jogos.length` of filtered groups); empty-filter state (Task 3); `Limpar` (Task 3); no persistence (Task 3); USelectMenu multiple/search/clear verified against installed 4.10.0 source.
- **Placeholder scan:** all steps contain concrete code; no TBD/TODO.
- **Type consistency:** `filterReportGames(jogos, { query, selected })`, `ANY_STRATEGY`, `normalizeSearchText`, and `fullWidth` used identically across tasks; `strategyOptions` items are `{ value, label }` and the USelectMenu sets `value-key="value"` (v4 has no valueKey default — without it the v-model would bind item objects, breaking the string comparisons).
