# Scanner Momentum Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 momentum-derived metrics (PRESSÃO 5', PRESSÃO 10', PICO 5', CONTROLE, C10) + per-team tendência chips to the scanner card, computed client-side from the `momentum[]` array already in `live.json`.

**Architecture:** Pure functions in `app/utils/scannerPressure.js` mirror the backend definitions (`momentum-scanner/momentum/monitor.py:402-413`); `scannerCard.vue` renders them as new proportional tug-of-war stat rows (same template as the existing 5 stats) under the momentum chart, plus ▲/▼ chips next to team names. No backend, schema, or page changes.

**Tech Stack:** Vue 3 `<script setup>` (plain JS), Nuxt 4, NuxtUI v4 (`UTooltip`, `UIcon`), Vitest 4.

## Global Constraints

- Repo: `/Users/jone/Projetos/jonebet` — plain JS, no TypeScript in source.
- Prettier: no semicolons, single quotes, trailing commas, 120-char width.
- Imports between `app/utils` modules use `~/utils/...` (never relative).
- Compact indicator font: `text-2xs`. Colors: home = teal-400, away = blue-500; text hierarchy zinc-200/500/600.
- `formatPercent(n, decimals)` appends `%` **without** scaling — multiply by 100 at the call site.
- Spec (read first): `docs/superpowers/specs/2026-08-11-scanner-momentum-metrics-design.md`.
- **Implementers: SKIP all gates (lint, prettier, full test suite, build).** Orchestrator runs verification once after both tasks.
- Backend semantics to mirror: `mean5`/`mean10`/`max5` = over the last 5/10 entries of `momentum[]` per side; 0.0 sides count in means; fewer than N bars → mean of existing; empty → null (display `'—'`). `momentum[]` entries always carry both `home` and `away` keys (absent side 0.0).

---

### Task 1: `scannerPressure.js` util + unit spec

**Files:**
- Create: `app/utils/scannerPressure.js`
- Test: `tests/app/utils/scannerPressure.spec.ts`

**Interfaces:**
- Produces (consumed by Task 2):
  - `computePressure(momentum) -> { mean5:{home,away}, mean10:{home,away}, max10:{home,away}, meanTotal:{home,away} }` — values 0..1 or `null` when the relevant window is empty.
  - `computeControl(momentum) -> { home, away }` — shares 0..1 that sum to 1, or `{ home: null, away: null }` when no decided minute.

- [ ] **Step 1: Write the failing test**

```js
// tests/app/utils/scannerPressure.spec.ts
import { describe, it, expect } from 'vitest'
import { computePressure, computeControl } from '~/utils/scannerPressure'

const bar = (minute, home, away) => ({ minute, home, away })

describe('computePressure', () => {
  it('mean5/mean10 sobre a janela certa, contando 0.0', () => {
    const momentum = [
      bar(1, 0.5, 0), bar(2, 0, 0.8), bar(3, 0.6, 0),
      bar(4, 0, 0.4), bar(5, 0.9, 0), bar(6, 0, 0.7),
    ]
    const p = computePressure(momentum)
    // últimas 5 (min 2..6): home (0+0.6+0+0.9+0)/5 = 0.3 ; away (0.8+0+0.4+0+0.7)/5 = 0.38
    expect(p.mean5.home).toBeCloseTo(0.3, 10)
    expect(p.mean5.away).toBeCloseTo(0.38, 10)
    // últimas 10 = todas as 6: home (0.5+0+0.6+0+0.9+0)/6 = 1/3 ; away (0+0.8+0+0.4+0+0.7)/6 = 0.3166…
    expect(p.mean10.home).toBeCloseTo(1 / 3, 10)
    expect(p.mean10.away).toBeCloseTo(0.3166666667, 10)
    // max10 (últimas 10 = todas as 6): home 0.9 ; away 0.8
    expect(p.max10.home).toBe(0.9)
    expect(p.max10.away).toBe(0.8)
    // meanTotal = todas
    expect(p.meanTotal.home).toBeCloseTo(1 / 3, 10)
  })

  it('janela parcial: menos de 5 barras usa as existentes', () => {
    const p = computePressure([bar(1, 0.4, 0), bar(2, 0, 0.2)])
    expect(p.mean5.home).toBeCloseTo(0.2, 10)
    expect(p.mean5.away).toBeCloseTo(0.1, 10)
    expect(p.max10.home).toBe(0.4)
  })

  it('vazio/ausente → tudo null (não 0)', () => {
    expect(computePressure([]).mean5).toEqual({ home: null, away: null })
    expect(computePressure(undefined).mean10).toEqual({ home: null, away: null })
    expect(computePressure(null).max10).toEqual({ home: null, away: null })
  })
})

describe('computeControl', () => {
  it('% dos minutos decididos; empates saem do denominador', () => {
    const momentum = [
      bar(1, 0.6, 0), // home
      bar(2, 0, 0.5), // away
      bar(3, 0.8, 0), // home
      bar(4, 0, 0), // empate (minuto morto) — excluído
      bar(5, 0.3, 0), // home
    ]
    const c = computeControl(momentum)
    expect(c.home).toBeCloseTo(3 / 4, 10)
    expect(c.away).toBeCloseTo(1 / 4, 10)
  })

  it('sem minuto decidido → null', () => {
    expect(computeControl([bar(1, 0, 0), bar(2, 0, 0)])).toEqual({ home: null, away: null })
    expect(computeControl([])).toEqual({ home: null, away: null })
  })

  it('C10 = computeControl das últimas 10', () => {
    const momentum = Array.from({ length: 12 }, (_, i) => bar(i + 1, i % 2 === 0 ? 0.7 : 0, i % 2 === 0 ? 0 : 0.6))
    // 12 barras alternadas: últimas 10 (min 3..12) = 5 home + 5 away → 50/50
    const c10 = computeControl(momentum.slice(-10))
    expect(c10.home).toBeCloseTo(0.5, 10)
    expect(c10.away).toBeCloseTo(0.5, 10)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/app/utils/scannerPressure.spec.ts`
Expected: FAIL — module `~/utils/scannerPressure` not found.

- [ ] **Step 3: Write the implementation**

```js
// app/utils/scannerPressure.js
// Métricas de pressão derivadas do gráfico de momentum (barras do Flashscore).
// Definição canônica no backend: momentum-scanner/momentum/monitor.py
// `extract_state` — mean5/mean10 = média das últimas 5/10 barras por time
// (0.0 conta), janela = minutos de gráfico (1 barra/minuto).
// Aqui reproduzimos a mesma conta sobre o momentum[] que o live.json já
// envia (snapshot.py serializa o MESMO array mesclado por minuto, com
// home/away sempre presentes; lado ausente = 0.0).

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

const meanOf = (bars, side) => {
  if (!bars.length) return null
  return bars.reduce((acc, b) => acc + toNum(b?.[side]), 0) / bars.length
}

export function computePressure(momentum) {
  const bars = Array.isArray(momentum) ? momentum : []
  const last5 = bars.slice(-5)
  const last10 = bars.slice(-10)
  const pair = (list) => ({ home: meanOf(list, 'home'), away: meanOf(list, 'away') })
  return {
    mean5: pair(last5),
    mean10: pair(last10),
    max10: {
      home: last10.length ? Math.max(...last10.map((b) => toNum(b?.home))) : null,
      away: last10.length ? Math.max(...last10.map((b) => toNum(b?.away))) : null,
    },
    meanTotal: pair(bars),
  }
}

export function computeControl(momentum) {
  const bars = Array.isArray(momentum) ? momentum : []
  let homeWins = 0
  let awayWins = 0
  for (const b of bars) {
    const h = toNum(b?.home)
    const a = toNum(b?.away)
    if (h > a) homeWins += 1
    else if (a > h) awayWins += 1
    // empate (ex.: minuto morto 0 x 0) não conta pra ninguém e sai do denominador
  }
  const decided = homeWins + awayWins
  if (!decided) return { home: null, away: null }
  return { home: homeWins / decided, away: awayWins / decided }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/app/utils/scannerPressure.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add app/utils/scannerPressure.js tests/app/utils/scannerPressure.spec.ts
git commit -m "feat: scanner pressure/control metrics util"
```

---

### Task 2: `scannerCard.vue` — metric rows, info popovers, tendência chips

**Files:**
- Modify: `app/components/scannerCard.vue` (script section + 2 template spots)
- Test: `tests/app/components/scannerCard.spec.ts` (extend)

**Interfaces:**
- Consumes (from Task 1): `computePressure`, `computeControl` — signatures in Task 1's Interfaces block.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing tests (extend `scannerCard.spec.ts`)**

Append inside the existing `describe('ScannerCard', …)` block (the `game()` factory already exists; its default `momentum` is `[{ minute: 1, home: 0.5, away: 0 }]`):

```js
it('renderiza as novas métricas de momentum (pressão, pico, controle, C10)', async () => {
  const wrapper = await mountSuspended(ScannerCard, { props: { game: game() } })
  expect(wrapper.text()).toContain("PRESSÃO 5'")
  expect(wrapper.text()).toContain("PRESSÃO 10'")
  expect(wrapper.text()).toContain("PICO 10'")
  expect(wrapper.text()).toContain('CONTROLE')
  expect(wrapper.text()).toContain('C10')
  // 1 barra, casa vence: controle 100% x 0%
  expect(wrapper.text()).toContain('100%')
})

it('mostra "—" e sem barra quando não há momentum', async () => {
  const wrapper = await mountSuspended(ScannerCard, { props: { game: { ...game(), momentum: [] } } })
  expect(wrapper.text()).toContain("PRESSÃO 5'")
  // valores ausentes: "—" (e nenhuma barra preenchida)
  expect(wrapper.text()).toContain('—')
})

it('tem ícone de ajuda (?) nas linhas CONTROLE e C10', async () => {
  const wrapper = await mountSuspended(ScannerCard, { props: { game: game() } })
  expect(wrapper.findAll('.i-lucide-circle-help').length).toBe(2)
})

it('mostra chip de tendência ▲ quando os últimos 5\' superam a média do jogo', async () => {
  const momentum = Array.from({ length: 15 }, (_, i) => ({
    minute: i + 1,
    home: i < 10 ? 0.1 : 0.9, // casa esquentou no fim
    away: 0,
  }))
  const wrapper = await mountSuspended(ScannerCard, { props: { game: { ...game(), momentum } } })
  // mean5.home 0.9 >> meanTotal.home 0.3667 → trending-up visível
  expect(wrapper.findAll('.i-lucide-trending-up').length).toBeGreaterThan(0)
})

it('nome longo fica em 1 linha (truncate) com nome completo no title', async () => {
  const wrapper = await mountSuspended(ScannerCard, {
    props: { game: { ...game(), home: 'Estudiantes (ARG)', away: 'Universidad Católica (CHI)' } },
  })
  const awayName = wrapper.findAll('span').find((s) => s.attributes('title') === 'Universidad Católica (CHI)')
  expect(awayName?.classes()).toContain('truncate')
})
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `pnpm exec vitest run tests/app/components/scannerCard.spec.ts`
Expected: new tests FAIL (labels/icon/chip missing); existing tests still pass.

- [ ] **Step 3: Implement the script changes**

In `<script setup>` of `app/components/scannerCard.vue`:

Add imports (next to the existing `~/utils` imports):

```js
import { formatPercent } from '~/utils/formatNumber'
import { computePressure, computeControl } from '~/utils/scannerPressure'
```

Add after the existing `STAT_LABELS` constant:

```js
const CONTROL_HINT = 'Controle do jogo: % dos minutos com barra em que o time pressionou mais que o adversário no gráfico de momentum.'
const C10_HINT = 'C10 = controle dos últimos 10 minutos: o mesmo cálculo, considerando só as últimas 10 barras.'
const TREND_THRESHOLD = 0.05
```

Add computeds (place before the existing `statRows` computed):

```js
const pressure = computed(() => computePressure(props.game.momentum))
const control = computed(() => computeControl(props.game.momentum))
const control10 = computed(() => computeControl((props.game.momentum || []).slice(-10)))

const sharePct = (pair) => {
  const h = Number(pair?.home)
  const a = Number(pair?.away)
  if (!Number.isFinite(h) || !Number.isFinite(a) || h + a <= 0) return null
  return (h / (h + a)) * 100
}

const fmtPct = (v) => (v == null ? '—' : formatPercent(v * 100, 0))

const derivedRows = computed(() => {
  const p = pressure.value
  const c = control.value
  const c10 = control10.value
  return [
    { label: "PRESSÃO 5'", home: fmtPct(p.mean5.home), away: fmtPct(p.mean5.away), pctHome: sharePct(p.mean5), hint: null },
    { label: "PRESSÃO 10'", home: fmtPct(p.mean10.home), away: fmtPct(p.mean10.away), pctHome: sharePct(p.mean10), hint: null },
    { label: "PICO 10'", home: fmtPct(p.max10.home), away: fmtPct(p.max10.away), pctHome: sharePct(p.max10), hint: null },
    { label: 'CONTROLE', home: fmtPct(c.home), away: fmtPct(c.away), pctHome: sharePct(c), hint: CONTROL_HINT },
    { label: 'C10', home: fmtPct(c10.home), away: fmtPct(c10.away), pctHome: sharePct(c10), hint: C10_HINT },
  ]
})

const trends = computed(() => {
  const { mean5, meanTotal } = pressure.value
  const dir = (recent, total) => {
    if (recent == null || total == null) return null
    if (recent > total + TREND_THRESHOLD) return 'up'
    if (recent < total - TREND_THRESHOLD) return 'down'
    return null
  }
  return { home: dir(mean5.home, meanTotal.home), away: dir(mean5.away, meanTotal.away) }
})

const trendTitle = (side) => {
  const p = pressure.value
  const pair = side === 'home' ? { recent: p.mean5.home, total: p.meanTotal.home } : { recent: p.mean5.away, total: p.meanTotal.away }
  if (pair.recent == null || pair.total == null) return ''
  return `Pressão ${trends.value[side] === 'up' ? 'subindo' : 'caindo'}: últimos 5' (${fmtPct(pair.recent)}) vs média do jogo (${fmtPct(pair.total)})`
}
```

Replace the existing `statRows` computed with a merged version (derived rows FIRST, then the 5 cumulative stats unchanged):

```js
const statRows = computed(() => [
  ...derivedRows.value,
  ...STAT_LABELS.map(([key, label]) => {
    const pair = props.game.stats?.[key] || {}
    const home = pair.home
    const away = pair.away
    const total = (Number(home) || 0) + (Number(away) || 0)
    return {
      label,
      home: home ?? '—',
      away: away ?? '—',
      pctHome: total > 0 ? ((Number(home) || 0) / total) * 100 : null,
      hint: null,
    }
  }),
])
```

- [ ] **Step 4: Implement the template changes**

(a) Header — append the tendência chip after each team name, AND fix long-name wrapping. Replace:

```html
<span class="min-w-0 text-zinc-400">{{ game.home }}</span>
```

with:

```html
<span class="flex min-w-0 items-center gap-1">
  <span class="min-w-0 truncate text-zinc-400" :title="game.home">{{ game.home }}</span>

  <UIcon
    v-if="trends.home"
    :name="trends.home === 'up' ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
    :class="trends.home === 'up' ? 'text-teal-400' : 'text-zinc-500'"
    class="h-3.5 w-3.5 shrink-0"
    :title="trendTitle('home')"
  />
</span>
```

Same treatment for the away name span (use `trends.away` / `trendTitle('away')`, `:title="game.away"`).

**Why:** long names (e.g. "Universidad Católica (CHI)") currently wrap to 2 lines and an inline icon would overflow the row at narrow widths (verified headless: 375px, row 313px, icon +18px would squeeze the minute badge). `truncate` on the name (with the full name in `:title`) absorbs the overflow — the icon is `shrink-0` and always renders. Row height drops from 40px to 24px. This is a deliberate behavior change (user flagged the 2-line wrap as an existing bug).

(b) Stat rows — add the info popover to the label. Replace the label span inside the row loop:

```html
<span class="text-2xs tracking-wide text-zinc-500 uppercase">{{ row.label }}</span>
```

with:

```html
<span class="flex items-center gap-0.5">
  <span class="text-2xs tracking-wide text-zinc-500 uppercase">{{ row.label }}</span>

  <UTooltip v-if="row.hint" :text="row.hint">
    <UIcon
      name="i-lucide-circle-help"
      class="h-3 w-3 cursor-help text-zinc-600 transition-colors hover:text-zinc-300"
      @click.stop
    />
  </UTooltip>
</span>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec vitest run tests/app/components/scannerCard.spec.ts`
Expected: PASS — all existing + 4 new tests.

- [ ] **Step 6: Commit**

```bash
git add app/components/scannerCard.vue tests/app/components/scannerCard.spec.ts
git commit -m "feat: scanner card momentum metrics + tendência chips"
```

---

## Verification (orchestrator, after both tasks)

1. `pnpm test:unit` — full suite green.
2. Headless browser: dev server on a free port, `/scanner` with real `live.json`; assert new labels render, card has no overflow at 1440/1024/768/375, and height is stable between filtered/unfiltered states (workflow: commit bac3918, skill `headless-ui-layout-verification`).
3. Commit hook gates (prettier, eslint, `check-arbitrary-values.cjs`) run on the final commit.

## Out of Scope

- Backend changes (`momentum-scanner` untouched), schema changes, `scanner.vue`, `momentumChart.vue`.
- `sum10`, intensity-weighted control, threshold tint (mean5 ≥ 0.40 highlight).
