# Scanner Alert Criteria Chips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render entry criteria as UBadge chips in the alerts panel item.

**Architecture:** `entryCriteria()` keeps shape but splits label/value for two-tone chips; `scannerAlertsPanel.vue` swaps the text line for UBadge chips and merges the minute into the game line. Pure presentational change, no data flow touched.

**Tech Stack:** Nuxt 4, Vue 3, NuxtUI v4 UBadge, Vitest.

## Global Constraints

- No TypeScript in source files — plain `<script setup>` JS only.
- No `text-2xs` in new markup — text-xs for details, text-sm for the rest.
- Prettier: no semicolons, single quotes, trailing commas, 120 char width.
- Tests run with `pnpm test:unit` from `jonebet-frontend/`.

---

### Task 1: Split entryCriteria into label/value pairs

**Files:**
- Modify: `app/utils/scanner.js:150-187`
- Test: `tests/app/utils/scanner.spec.ts`

**Interfaces:**
- Consumes: notification object `{rule, dados, gatilhos}` (unchanged input).
- Produces: `entryCriteria(n)` returns `[{key, label, value, hot}]` — `label` is the
  criterion name (`odd`, `fav5`, `pico`, `soma5`, `soma10`, `chutes`), `value` is the
  formatted string (`1.72`, `0.30`, `4`). Chutes keeps `label: 'chutes'`.

- [ ] **Step 1: Write the failing test**

```ts
describe('entryCriteria', () => {
  it('retorna label/value separados', () => {
    const out = entryCriteria({
      rule: 'entrada_gol_ht',
      dados: { odd: 1.72, fav5: 0.3, pico: 0.3, soma5: 0.5, chutes: 4 },
      gatilhos: ['fav5'],
    })
    expect(out[0]).toEqual({ key: 'odd', label: 'odd', value: '1.72', hot: false })
    expect(out.find((c) => c.key === 'fav5')).toEqual({ key: 'fav5', label: 'fav5', value: '0.30', hot: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/app/utils/scanner.spec.ts 2>&1 | tail -8`
Expected: FAIL — existing tests expect `text`, new test expects `label`/`value`.

- [ ] **Step 3: Update entryCriteria to label/value shape**

Replace the whole `entryCriteria` function in `app/utils/scanner.js` with:

```js
// Critérios que bateram p/ os chips do item do painel.
// Retorna [{ key, label, value, hot }]: hot = perna do OU que efetivamente
// decidiu (chip primary). Sem dados (alerta antigo) → [] e a linha some.
// Regras de momento (regra_*) não têm dados → [].
export function entryCriteria(n = {}) {
  const d = n.dados
  if (!d || typeof d !== 'object') return []
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v).toFixed(2) : '—')
  const shots =
    Number.isFinite(Number(d.chutes)) ? { key: 'chutes', label: 'chutes', value: `${d.chutes}`, hot: false } : null
  const chip = (key, raw, hot = false) => ({ key, label: key, value: raw, hot })
  if (n.rule === 'entrada_gol_ht') {
    const hot = new Set(n.gatilhos || [])
    const legs = [
      chip('fav5', num(d.fav5), hot.has('fav5')),
      chip('pico', num(d.pico), hot.has('pico')),
      chip('soma5', num(d.soma5), hot.has('soma5')),
    ]
    // Só o que decidiu: pernas quentes + contexto (odd/chutes nunca em destaque).
    const decided = legs.filter((l) => l.hot)
    const shown = decided.length ? decided : legs
    const out = [chip('odd', num(d.odd)), ...shown]
    if (shots) out.push(shots)
    return out
  }
  if (n.rule === 'entrada_ltd') {
    const out = [chip('odd', num(d.odd)), chip('soma10', num(d.soma10), true)]
    if (shots) out.push(shots)
    return out
  }
  if (n.rule === 'entrada_fim_jogo') {
    const out = [chip('soma5', num(d.soma5), true)]
    if (shots) out.push(shots)
    return out
  }
  return []
}
```

- [ ] **Step 4: Update existing entryCriteria specs to the new shape**

In `tests/app/utils/scanner.spec.ts`, replace the whole `describe('entryCriteria', ...)` block with:

```ts
describe('entryCriteria', () => {
  const ht = (dados, gatilhos) => ({ rule: 'entrada_gol_ht', dados, gatilhos })
  it('gol HT: só a perna que decidiu vai em destaque', () => {
    const d = { odd: 1.72, fav5: 0.3, pico: 0.3, soma5: 0.5, chutes: 4 }
    const out = entryCriteria(ht(d, ['fav5', 'soma5']))
    expect(out.map((c) => c.key)).toEqual(['odd', 'fav5', 'soma5', 'chutes'])
    expect(out.filter((c) => c.hot).map((c) => c.key)).toEqual(['fav5', 'soma5'])
    expect(out.find((c) => c.key === 'odd')).toMatchObject({ label: 'odd', value: '1.72', hot: false })
    expect(out.find((c) => c.key === 'fav5')).toMatchObject({ label: 'fav5', value: '0.30', hot: true })
    expect(out.find((c) => c.key === 'chutes')).toMatchObject({ label: 'chutes', value: '4' })
  })
  it('gol HT sem gatilhos: mostra as três pernas sem destaque (alerta antigo)', () => {
    const d = { odd: 1.72, fav5: 0.3, pico: 0.3, soma5: 0.5, chutes: 4 }
    const out = entryCriteria(ht(d, []))
    expect(out.map((c) => c.key)).toEqual(['odd', 'fav5', 'pico', 'soma5', 'chutes'])
    expect(out.some((c) => c.hot)).toBe(false)
  })
  it('ltd e fim de jogo: destaca o gate de pressão', () => {
    const ltd = entryCriteria({ rule: 'entrada_ltd', dados: { odd: 1.95, soma10: 0.46, chutes: 9 } })
    expect(ltd.find((c) => c.key === 'soma10')).toMatchObject({ value: '0.46', hot: true })
    const fim = entryCriteria({ rule: 'entrada_fim_jogo', dados: { soma5: 0.56, chutes: 12 } })
    expect(fim.find((c) => c.key === 'soma5')).toMatchObject({ value: '0.56', hot: true })
  })
  it('sem dados retorna vazio (linha some)', () => {
    expect(entryCriteria({ rule: 'entrada_gol_ht' })).toEqual([])
    expect(entryCriteria({ rule: 'regra_jogo_quente' })).toEqual([])
  })
})
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test:unit tests/app/utils/scanner.spec.ts 2>&1 | tail -6`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/utils/scanner.js tests/app/utils/scanner.spec.ts
git commit -m "feat(scanner): entryCriteria retorna label/value p/ chips"
```

### Task 2: Render UBadge chips in the panel item

**Files:**
- Modify: `app/components/scannerAlertsPanel.vue:56-97`
- Test: `tests/app/components/scannerAlertsPanel.spec.ts`

**Interfaces:**
- Consumes: `entryCriteria(a)` returning `[{key, label, value, hot}]` from Task 1.
- Produces: panel item with minute merged into the game line and a UBadge chip row.

- [ ] **Step 1: Write the failing test**

```ts
it('item com dados mostra chips UBadge com gatilho primary', async () => {
  const withData = [
    {
      gameId: 'm3',
      rule: 'entrada_gol_ht',
      label: 'GOL HT — entrada pra gol antes do intervalo',
      minute: 24,
      half: 1,
      at: new Date(Date.now() - 2 * 60_000).toISOString(),
      home: 'Palmeiras',
      away: 'Botafogo',
      league: 'Brasil Série A',
      dados: { odd: 1.72, fav5: 0.3, pico: 0.3, soma5: 0.5, chutes: 4 },
      gatilhos: ['fav5', 'soma5'],
    },
  ]
  const w = await mountSuspended(ScannerAlertsPanel, { props: { items: withData, open: true } })
  expect(w.find('[data-testid="alert-criteria-m3-0"]').exists()).toBe(true)
  expect(w.findAllComponents({ name: 'UBadge' }).length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/app/components/scannerAlertsPanel.spec.ts 2>&1 | tail -8`
Expected: FAIL — no `alert-criteria` UBadge markup yet in the new shape.

- [ ] **Step 3: Replace the item body markup**

In `app/components/scannerAlertsPanel.vue`, replace lines 65-94 (title row, game
line, minute badge, criteria text line) with:

```vue
<span class="flex items-center justify-between gap-2">
  <span class="truncate text-sm font-bold text-zinc-100">{{ entryTitle(a.rule, a.label) }}</span>

  <span class="shrink-0 text-xs text-zinc-500">{{ formatAlertTime(a.at, now) }}</span>
</span>

<span class="truncate text-sm text-zinc-400"
  >{{ a.home }} x {{ a.away
  }}<span v-if="a.minute != null"> · {{ a.minute }}&prime;{{ halfSuffix(a.half) }}</span></span
>

<span
  v-if="entryCriteria(a).length"
  :data-testid="`alert-criteria-${a.gameId}-${i}`"
  class="flex flex-wrap items-center gap-1.5"
>
  <UBadge
    v-for="c in entryCriteria(a)"
    :key="c.key"
    :color="c.hot ? 'primary' : 'neutral'"
    variant="soft"
    size="sm"
  >
    <span class="font-normal text-zinc-400">{{ c.label }}</span>
    <span class="font-bold text-zinc-100">{{ c.value }}</span>
  </UBadge>
</span>
```

Notes: the green `entryTag` badge is removed (redundant with the title).
The minute moves into the game line as text. Vertical gap comes from the
button's `gap-0.5` → change to `gap-2` on the button class in the same edit
(`class="flex w-full flex-col gap-2 border-b ..."`).

- [ ] **Step 4: Replace existing criteria specs with chip assertions**

In `tests/app/components/scannerAlertsPanel.spec.ts`, replace the two criteria
tests (`item com dados mostra critérios...` and `item sem dados...`) with:

```ts
it('item com dados mostra chips UBadge com gatilho primary', async () => {
  const withData = [
    {
      gameId: 'm3',
      rule: 'entrada_gol_ht',
      label: 'GOL HT — entrada pra gol antes do intervalo',
      minute: 24,
      half: 1,
      at: ago(2),
      home: 'Palmeiras',
      away: 'Botafogo',
      league: 'Brasil Série A',
      dados: { odd: 1.72, fav5: 0.3, pico: 0.3, soma5: 0.5, chutes: 4 },
      gatilhos: ['fav5', 'soma5'],
    },
  ]
  const w = await mountSuspended(ScannerAlertsPanel, { props: { items: withData, open: true } })
  const crit = w.find('[data-testid="alert-criteria-m3-0"]')
  expect(crit.exists()).toBe(true)
  expect(crit.text()).toContain('odd')
  expect(crit.text()).toContain('1.72')
  expect(crit.text()).toContain('fav5')
  expect(crit.text()).not.toContain('pico')
  expect(w.text()).toContain('Palmeiras x Botafogo · 24')
  expect(w.text()).not.toContain('GHT')
  w.unmount()
})

it('item sem dados não mostra linha de critérios', async () => {
  const w = await mountSuspended(ScannerAlertsPanel, { props: { items, open: true } })
  expect(w.find('[data-testid="alert-criteria-m1-0"]').exists()).toBe(false)
  w.unmount()
})
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test:unit tests/app/components/scannerAlertsPanel.spec.ts tests/app/utils/scanner.spec.ts 2>&1 | tail -6`
Expected: all pass.

- [ ] **Step 6: Run the full frontend suite**

Run: `pnpm test:unit 2>&1 | tail -5`
Expected: all files pass.

- [ ] **Step 7: Commit**

```bash
git add app/components/scannerAlertsPanel.vue tests/app/components/scannerAlertsPanel.spec.ts
git commit -m "feat(scanner): item de alerta com criterios em chips UBadge"
```

### Task 3: Refresh the mock preview page and validate visually

**Files:**
- Modify: `app/pages/preview-alerts.vue`

**Interfaces:**
- Consumes: finished Task 2 panel rendering. No new interfaces.

- [ ] **Step 1: Point the preview page at the real panel**

No code change needed — `preview-alerts.vue` already renders
`ScannerAlertsPanel` with mocked items covering the three trigger legs plus
one LTD. Just open it.

- [ ] **Step 2: Start the dev server and screenshot**

Run: `pnpm run dev --port 4311 --host 127.0.0.1`
Expected: `http://127.0.0.1:4311/preview-alerts` shows four alert items with
UBadge chips, minute merged into the game line, no green tag.

- [ ] **Step 3: Delete the preview page**

```bash
git rm app/pages/preview-alerts.vue
git commit -m "chore(scanner): remove pagina de preview dos alertas"
```
