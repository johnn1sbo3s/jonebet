# Melhorias na tela de performance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o eixo X e a anotação do gráfico de acúmulo, transformar a tabela "Jogos reais" em lista no mobile, melhorar a paginação mobile e adicionar headings semânticos na página de performance.

**Architecture:** A página de performance (`app/pages/performance/[[model]].vue`) é composta por cards que recebem dados via composables (`useModelApi.js`). As mudanças são: (1) `usePerformanceChartOptions` passa a configurar ticks/grid/título de eixo e o label da anotação; (2) um novo componente `betsListCard.vue` renderiza a aposta em card (padrão `dailyBetCard.vue`); (3) `betsTableCard.vue` alterna tabela (≥md) e lista (<md) mantendo uma única paginação; (4) títulos de card trocam `<p>` por `<h2>`/`<h3>`.

**Tech Stack:** Nuxt 4.4.7, Vue 3.5, Tailwind CSS v4, Chart.js + chartjs-plugin-annotation 2.2.1, Nuxt UI v4 (UCard/UTable/UPagination), Vitest 4.1.8 + @nuxt/test-utils.

## Global Constraints

- Sem TypeScript em source — `<script setup>` JS puro.
- Formatação Prettier: sem `;`, aspas simples, trailing commas, 120 chars.
- Componentes em `app/components/` (flat, camelCase). Sem lodash.
- Cores: teal (`text-teal-400`/`text-teal-500`) positivo, vermelho (`text-red-400`) negativo, superfícies zinc 950→900→800.
- Formatação de números: `formatNumber` (bruto), `formatPercent` (%), `formatUnit` (u) de `app/utils/formatNumber.js`; datas via `formatDate(iso, { style: 'short' })` de `app/utils/formatDate.js` (dd/mm/aa).
- NÃO usar valores arbitrários em px no Tailwind (lint-staged `scripts/check-arbitrary-values.cjs` bloqueia `*-[Npx]`). Escala padrão apenas.
- Testes: `mountSuspended()` + `// @vitest-environment nuxt`; mocks centralizados em `app/test.setup.ts`; NÃO rodar `npx eslint`/`pnpm build` a cada edição (pre-commit roda lint); rodar `pnpm test:unit` para validar.
- Dev server do agente: porta 3001 (`./node_modules/.bin/nuxt dev --port 3001`). Nunca tocar na porta 3000.
- Escopo: componentes usados SÓ em `app/pages/performance/[[model]].vue` (verificado por grep). Nenhuma outra página muda.

---

### Task 1: Eixo X + label da anotação no gráfico de acúmulo

**Files:**
- Modify: `app/composables/useChartOptions.js` (função `usePerformanceChartOptions`, linhas ~69-99)
- Modify: `app/components/performanceChartCard.vue` (computed `chartOptions`, linha ~420)

**Interfaces:**
- Consumes: `chartPayload.annotationIndex` (já usado), `formatDate` (já importado no componente), `ZINC_TICK`/`ZINC_GRID`/`ZINC_LABEL` (constantes existentes no arquivo).
- Produces: `usePerformanceChartOptions({ annotationIndex, xAxisTitle })` — usado só neste componente. `xAxisTitle` (string|null) vira `x.title.text`. As datas do modo "por dia" são formatadas nos labels do `chartData` (no componente), NÃO via callback de ticks — o chart.js 3.9.1 (instalado) chama callbacks de ticks com o ÍNDICE da categoria, não com a label (CategoryScale.buildTicks → `callback(tick.value, i, ticks)`); formatar via callback renderizaria "0, 8, 16…".

- [ ] **Step 1: Atualizar `usePerformanceChartOptions` em `app/composables/useChartOptions.js`**

Substituir o corpo da função (que hoje é):

```js
export function usePerformanceChartOptions({ annotationIndex = -100 } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    transitions: { zoom: { animation: { duration: 1000, easing: 'easeOutCubic' } } },
    scales: { y: { beginAtZero: false }, x: { beginAtZero: false } },
    plugins: { … }
  }
}
```

pelo seguinte (manter intactos `plugins.legend`, `plugins.zoom` e a estrutura de `plugins.annotation`; só `scales` muda e `line1` ganha `label`):

```js
export function usePerformanceChartOptions({ annotationIndex = -100, xAxisTitle = null } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    transitions: { zoom: { animation: { duration: 1000, easing: 'easeOutCubic' } } },
    scales: {
      x: {
        beginAtZero: false,
        title: { display: Boolean(xAxisTitle), text: xAxisTitle, color: ZINC_LABEL },
        ticks: {
          color: ZINC_TICK,
          autoSkip: true,
          maxTicksLimit: 8,
          maxRotation: 0,
          minRotation: 0,
          autoSkipPadding: 16,
        },
        grid: { color: ZINC_GRID },
      },
      y: {
        beginAtZero: false,
        ticks: { color: ZINC_TICK },
        grid: { color: ZINC_GRID },
      },
    },
    plugins: {
      legend: { position: 'top', display: true },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
          drag: { enabled: true, borderColor: TEAL, borderWidth: 1, backgroundColor: TEAL_BG },
        },
        pan: { enabled: true, mode: 'x', modifierKey: 'ctrl' },
      },
      annotation: {
        annotations: {
          line1: {
            type: 'line',
            xMin: annotationIndex,
            xMax: annotationIndex,
            borderColor: TEAL,
            borderWidth: 2,
            label: {
              display: true,
              content: 'Início dos jogos reais',
              position: 'start',
              color: ZINC_LABEL,
              font: { size: 10 },
              xAdjust: 6,
            },
          },
        },
      },
    },
  }
}
```

- [ ] **Step 2: Atualizar o computed `chartOptions` e os labels do `chartData` em `app/components/performanceChartCard.vue`**

Substituir o computed `chartOptions` (hoje):

```js
const chartOptions = computed(() =>
  usePerformanceChartOptions({ annotationIndex: chartPayload.value?.annotationIndex }),
)
```

por (título do eixo só quando há labels, conforme a spec):

```js
const chartOptions = computed(() =>
  usePerformanceChartOptions({
    annotationIndex: chartPayload.value?.annotationIndex,
    xAxisTitle: chartPayload.value?.labels?.length ? (chartByDay.value ? 'Data' : 'Nº da aposta') : null,
  }),
)
```

E formatar os labels no modo "por dia" dentro do computed `chartData` (hoje termina com `return { labels: payload.labels || [], datasets }`). Formatar aqui é a forma confiável — o chart.js 3.9.1 chama callbacks de ticks com o índice da categoria, não com a label:

```js
const chartData = computed(() => {
  if (chartPending.value) return { labels: [], datasets: [] }
  const payload = chartPayload.value
  if (!payload || !payload.data) return { labels: [], datasets: [] }
  const labels = chartByDay.value
    ? (payload.labels || []).map((d) => formatDate(d, { style: 'short' }))
    : payload.labels || []
  const datasets = [
    // datasets idênticos ao código atual — não mudam
  ]
  return { labels, datasets }
})
```

Na prática, basta trocar `return { labels: payload.labels || [], datasets }` por:

```js
  const labels = chartByDay.value ? (payload.labels || []).map((d) => formatDate(d, { style: 'short' })) : payload.labels || []
  return { labels, datasets }
```

`formatDate` já está importado neste arquivo (`import { formatDate } from '~/utils/formatDate'`). O `annotationIndex` continua sendo um índice — o array de labels mantém o mesmo tamanho, então a linha de anotação e o zoom/pan continuam corretos. No modo bet os labels já são "1".."N" (sem formatação).

- [ ] **Step 3: Rodar a suíte de testes existente**

Run: `pnpm test:unit`
Expected: 217 testes PASS (baseline real do repo — 26 arquivos; o AGENTS.md cita 55, está stale). Nenhum asserta as options do chart — o chart.js é stubado em `app/test.setup.ts`.

- [ ] **Step 4: Commit**

```bash
git add app/composables/useChartOptions.js app/components/performanceChartCard.vue
git commit -m "feat(performance): eixo X rotulado e anotação com label no gráfico de acúmulo"
```

---

### Task 2: Componente `betsListCard.vue` (card de aposta para a lista mobile)

**Files:**
- Create: `app/components/betsListCard.vue`
- Test: `tests/app/components/betsListCard.spec.ts`

**Interfaces:**
- Consumes: props `{ bet: Object }` com campos do payload real de bets: `date`, `home`, `away`, `odds`, `profit`, `result` (verificado na API: `{"date":"2026-08-14","home":"Eindhoven","away":"Maastricht","odds":1.82,"profit":-1,"result":"red"}`).
- Produces: componente auto-importado (Nuxt) — Task 3 o consome como `<BetsListCard :bet="bet" />`.

- [ ] **Step 1: Escrever o teste**

Create `tests/app/components/betsListCard.spec.ts`:

```ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BetsListCard from '~/components/betsListCard.vue'

describe('BetsListCard', () => {
  const bet = { date: '2026-08-14', home: 'Palmeiras', away: 'Internacional', odds: 1.85, profit: 2.15, result: 'green' }

  it('renders date, teams, odds, result and profit', async () => {
    const wrapper = await mountSuspended(BetsListCard, { props: { bet } })
    const text = wrapper.text()
    expect(text).toContain('14/08/26')
    expect(text).toContain('Palmeiras')
    expect(text).toContain('Internacional')
    expect(text).toContain('1.85')
    expect(text).toContain('Green')
    expect(text).toContain('2.15u')
  })

  it('colors profit teal for positive and red for negative', async () => {
    const wrapper = await mountSuspended(BetsListCard, { props: { bet } })
    const positive = [...wrapper.findAll('span')].find((s) => s.text() === '2.15u')
    expect(positive.classes()).toContain('text-teal-400')

    const loss = await mountSuspended(BetsListCard, { props: { bet: { ...bet, profit: -1, result: 'red' } } })
    const negative = [...loss.findAll('span')].find((s) => s.text() === '-1.00u')
    expect(negative.classes()).toContain('text-red-400')
  })

  it('applies :title with the full team name and truncate class on both teams', async () => {
    const wrapper = await mountSuspended(BetsListCard, { props: { bet } })
    const home = [...wrapper.findAll('span')].find((s) => s.text() === 'Palmeiras')
    const away = [...wrapper.findAll('span')].find((s) => s.text() === 'Internacional')
    expect(home.attributes('title')).toBe('Palmeiras')
    expect(home.classes()).toContain('truncate')
    expect(away.attributes('title')).toBe('Internacional')
    expect(away.classes()).toContain('truncate')
  })

  it('capitalizes the result pill (Green/Red)', async () => {
    const wrapper = await mountSuspended(BetsListCard, { props: { bet: { ...bet, result: 'red' } } })
    const text = wrapper.text()
    expect(text).toContain('Red')
    expect(text).not.toContain('red')
  })

  it('shows a dash when result is missing', async () => {
    const wrapper = await mountSuspended(BetsListCard, { props: { bet: { ...bet, result: null } } })
    expect(wrapper.text()).toContain('—')
  })
})
```

- [ ] **Step 2: Rodar o teste para verificar que falha**

Run: `pnpm test:unit -- tests/app/components/betsListCard.spec.ts`
Expected: FAIL com "Failed to resolve component: BetsListCard" (componente não existe).

- [ ] **Step 3: Criar `app/components/betsListCard.vue`**

```vue
<template>
  <div class="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs text-zinc-500">{{ formatDate(bet.date, { style: 'short' }) }}</span>

      <div class="flex items-center gap-2">
        <span
          v-if="bet.result"
          class="rounded-full px-2 py-0.5 text-2xs font-semibold tracking-wide uppercase"
          :class="bet.result.toLowerCase() === 'green' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'"
        >
          {{ bet.result[0].toUpperCase() + bet.result.slice(1) }}
        </span>
        <span v-else class="text-xs text-zinc-500">—</span>

        <span class="text-sm font-bold" :class="bet.profit > 0 ? 'text-teal-400' : bet.profit < 0 ? 'text-red-400' : 'text-white'">
          {{ formatUnit(bet.profit) }}
        </span>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-1.5">
        <span :title="bet.home" class="truncate text-sm font-semibold text-zinc-100">{{ bet.home }}</span>
        <span class="shrink-0 text-xs text-zinc-500">vs</span>
        <span :title="bet.away" class="truncate text-sm font-semibold text-zinc-100">{{ bet.away }}</span>
      </div>

      <span class="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm font-semibold text-white">
        {{ formatNumber(bet.odds) }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  bet: {
    type: Object,
    required: true,
  },
})
</script>
```

Observações: `formatDate`/`formatNumber`/`formatUnit` são auto-importados via Nuxt (`app/utils/` → `utils/*`); `text-2xs` é a classe compacta do projeto (10px). O critério de cor do resultado é o mesmo da tabela atual (`result?.toLowerCase() === 'green'` → teal, senão vermelho).

- [ ] **Step 4: Rodar o teste para verificar que passa**

Run: `pnpm test:unit -- tests/app/components/betsListCard.spec.ts`
Expected: 5 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add app/components/betsListCard.vue tests/app/components/betsListCard.spec.ts
git commit -m "feat(performance): card de aposta para a lista mobile de jogos reais"
```

---

### Task 3: `betsTableCard.vue` — lista no mobile + paginação com alvo de toque maior

**Files:**
- Modify: `app/components/betsTableCard.vue`
- Test: `tests/app/components/betsTableCard.spec.ts` (adicionar 1 teste)

**Interfaces:**
- Consumes: props atuais (`betsItems`, `betsTotal`, `page`, `betsTotalPages`, `betsSize`) e o novo `BetsListCard` (Task 2). Campos reais de `betsItems`: `date/home/away/odds/profit/result` (minúsculos, do payload).
- Produces: nenhuma mudança de interface — os consumidores (página `[[model]].vue`) continuam iguais.

- [ ] **Step 1: Adicionar o teste da lista no `tests/app/components/betsTableCard.spec.ts`**

Adicionar ao final do `describe` existente:

```ts
it('renders the card list for mobile with the real bet fields', async () => {
  const realBets = [
    { date: '2026-08-14', home: 'Palmeiras', away: 'Internacional', odds: 1.85, profit: 2.15, result: 'green' },
  ]
  const wrapper = await mountSuspended(BetsTableCard, {
    props: { betsItems: realBets, betsTotal: 250, page: 1, betsTotalPages: 3, betsSize: 100 },
  })
  const cards = wrapper.findAllComponents({ name: 'BetsListCard' })
  expect(cards).toHaveLength(1)
  expect(cards[0].text()).toContain('Palmeiras')
})
```

- [ ] **Step 2: Rodar o teste para verificar que falha**

Run: `pnpm test:unit -- tests/app/components/betsTableCard.spec.ts`
Expected: FAIL no novo teste (`findAllComponents({ name: 'BetsListCard' })` → length 0). Os 4 testes antigos continuam PASS.

- [ ] **Step 3: Modificar `app/components/betsTableCard.vue`**

No `<template>`, envolver a `UTable` em um `div class="hidden md:block"` e adicionar a lista `md:hidden` logo depois, e adicionar a class responsiva no `UPagination`. O template completo passa a ser:

```vue
<template>
  <UCard class="border border-zinc-800 bg-zinc-900">
    <template #header>
      <h2 class="font-semibold">Jogos reais</h2>
    </template>

    <p class="mb-3 text-sm">{{ betsTotal }} jogos</p>

    <div class="hidden md:block">
      <UTable
        ref="tableRef"
        class="h-96"
        :ui="{
          wrapper: 'relative overflow-x-auto overflow-y-auto border border-muted rounded-lg',
          thead: 'sticky top-0 z-10',
          th: 'bg-zinc-950',
        }"
        :data="betsItems"
        :columns="allBetsDataFilteredColumns"
      >
        <template #date-cell="{ row }">
          {{ formatDate(row.original.date) }}
        </template>

        <template #odds-cell="{ row }">
          {{ formatNumber(row.original.odds) }}
        </template>

        <template #result-cell="{ row }">
          <span :class="row.original.result?.toLowerCase() === 'green' ? 'text-teal-400' : 'text-red-400'">
            {{ row.original.result ? row.original.result[0].toUpperCase() + row.original.result.slice(1) : '—' }}
          </span>
        </template>

        <template #profit-cell="{ row }">
          {{ formatUnit(row.original.profit) }}
        </template>
      </UTable>
    </div>

    <ul class="flex flex-col gap-3 md:hidden">
      <li v-for="bet in betsItems" :key="`${bet.date}-${bet.home}-${bet.away}-${bet.odds}`">
        <BetsListCard :bet="bet" />
      </li>
    </ul>

    <div class="flex justify-center pt-3">
      <UPagination
        class="max-md:[&_button]:h-10 max-md:[&_button]:min-w-10"
        :page="page"
        :items-per-page="betsSize"
        :total="betsTotal"
        @update:page="$emit('update:page', $event)"
      />
    </div>
  </UCard>
</template>
```

O `<script setup>` não muda. A paginação fica FORA do `hidden` — visível nos dois layouts. `max-md:[&_button]:h-10 max-md:[&_button]:min-w-10` usa a escala padrão do Tailwind (2.5rem = 40px) — não dispara o lint de valores arbitrários (que só caça `*-[Npx]`).

- [ ] **Step 4: Rodar a suíte do arquivo**

Run: `pnpm test:unit -- tests/app/components/betsTableCard.spec.ts`
Expected: 5 testes PASS (4 antigos + 1 novo).

- [ ] **Step 5: Commit**

```bash
git add app/components/betsTableCard.vue tests/app/components/betsTableCard.spec.ts
git commit -m "feat(performance): jogos reais viram lista no mobile com paginação maior"
```

---

### Task 4: Headings semânticos (h2 nos cards, h3 nos sub-blocos)

**Files:**
- Modify: `app/components/metricsCard.vue` (linha 4: título do card)
- Modify: `app/components/performanceChartCard.vue` (título do card)
- Modify: `app/components/statisticalSignificanceCard.vue` (título do card)
- Modify: `app/components/blockMetricsPanel.vue` (título do card)
- Modify: `app/components/blockMetricsCard.vue` (título via `cardTitle`)
- Modify: `app/components/currentBlockMetricsCard.vue` (título via `cardTitle`)
- Modify: `app/components/blocksHistoryList.vue` (título "Histórico")
- Modify: `app/components/monthlyResultsList.vue` (título do card)
- Modify: `app/components/resultsTablesGrid.vue` (título do card)
- Modify: `app/components/betsTableCard.vue` (já feito na Task 3)

**Interfaces:** nenhuma — só tag HTML do título; props e slots intactos. Testes usam `wrapper.text()` (não selecionam a tag) — verificados: `metricsCard.spec.ts` busca `p.text-xl` (valores, não título), `statisticalSignificanceCard.spec.ts` busca `p.text-base` (valores), `blockMetricsPanel.spec.ts`/`resultsTablesGrid.spec.ts`/`performanceChartCard.spec.ts` usam `text().toContain`.

- [ ] **Step 1: Trocar a tag do título em cada arquivo**

Para cada arquivo, substituir a tag `<p` por `<h2` (títulos de seção) ou `<h3` (sub-blocos) mantendo as classes exatas:

| Arquivo | Linha atual | Nova tag |
|---|---|---|
| `metricsCard.vue` | `<p class="font-semibold text-white">{{ cardTitle }}</p>` | `<h2 class="font-semibold text-white">{{ cardTitle }}</h2>` |
| `performanceChartCard.vue` | `<p class="font-semibold">Gráfico de acúmulo de capital</p>` | `<h2 class="font-semibold">…</h2>` |
| `statisticalSignificanceCard.vue` | `<p class="font-semibold">Significância estatística</p>` | `<h2 class="font-semibold">…</h2>` |
| `blockMetricsPanel.vue` | `<p class="font-semibold">Resultados por blocos de 100 jogos</p>` | `<h2 class="font-semibold">…</h2>` |
| `blockMetricsCard.vue` | `<p class="font-semibold">{{ cardTitle }}</p>` | `<h3 class="font-semibold">{{ cardTitle }}</h3>` |
| `currentBlockMetricsCard.vue` | `<p class="font-semibold">{{ cardTitle }}</p>` | `<h3 class="font-semibold">{{ cardTitle }}</h3>` |
| `blocksHistoryList.vue` | `<p class="font-semibold">Histórico</p>` | `<h3 class="font-semibold">Histórico</h3>` |
| `monthlyResultsList.vue` | `<p class="font-semibold">Resultados por mês</p>` | `<h2 class="font-semibold">…</h2>` |
| `resultsTablesGrid.vue` | `<p class="font-semibold">Resultados por dia</p>` | `<h2 class="font-semibold">…</h2>` |

Fechar a tag correspondente (`</p>` → `</h2>`/`</h3>`) em cada arquivo.

- [ ] **Step 2: Rodar a suíte completa**

Run: `pnpm test:unit`
Expected: 223 testes PASS (217 baseline + 5 do betsListCard + 1 do betsTableCard).

- [ ] **Step 3: Commit**

```bash
git add app/components/
git commit -m "a11y(performance): títulos de card com h2/h3 na página de performance"
```

---

### Task 5: Verificação visual (desktop + mobile)

**Files:** nenhum — verificação de runtime.

- [ ] **Step 1: Subir o dev server (se não estiver no ar)**

Run: `./node_modules/.bin/nuxt dev --port 3001` (via hub `start`, name `dev-perf-eval`; ready log `Local:.*http` + porta 3001). Não tocar na 3000.

- [ ] **Step 2: Verificação desktop (1440px) — headless**

Script Playwright (padrão `headless-browser-verification-fallback`, playwright-core de `/Users/jone/Projetos/jonedev/node_modules/playwright-core` + Chromium `~/Library/Caches/ms-playwright/chromium-1228/...`):
- Abrir `http://localhost:3001/performance`; fechar modal 18+ se aparecer; aguardar canvas.
- Screenshot do canvas do gráfico de acúmulo (via boundingBox do canvas maior) e do full page `/tmp/perf-desktop-final.png`. Verificar na imagem: eixo X com título "Nº da aposta", ~8 labels sem rotação 45°, grid visível, label "Início dos jogos reais" junto à linha teal.
- Opcional (se quiser inspeção programática): `Chart` não é global na página (chartSetup.js importa dinamicamente e não expõe em window) — em vez de `Chart.getChart`, passar temporariamente `:on-chart-render="(c) => { window.__perfChart = c }"` no LineChart do performanceChartCard e ler `window.__perfChart.options.scales.x` no evaluate. O caminho primário (screenshot) já cobre; não bloquear a verificação nisso.
- Verificar que a `UTable` de jogos reais está visível (wrapper `hidden md:block` → `display: block` em 1440px) e que `ul.md:hidden` tem `display: none`.

- [ ] **Step 3: Verificação mobile (375px) — headless**

Mesmo script, viewport 375x812:
- Screenshot `/tmp/perf-mobile-final.png` (full page).
- Verificar que o `ul` da lista de jogos reais está visível (`display: flex`) e o wrapper da tabela tem `display: none`.
- Medir os botões da paginação: `getBoundingClientRect().height` ≥ 40 em todos.
- Verificar um card da lista: spans dos times têm `title` igual ao nome e classe `truncate`.
- Screenshot de um card da lista ampliado.

- [ ] **Step 4: Resumo da verificação**

Reportar no chat: eixo X (título "Nº da aposta"/"Data" + ~8 ticks sem rotação + grid visível), label "Início dos jogos reais" presente, lista no mobile com truncate + `:title`, tamanho dos botões de paginação (≥40px no mobile), e que os 223 testes passaram. Se algo falhar, corrigir no arquivo correspondente e re-rodar o teste/captura antes de concluir.

---

## Revisão (rodada 1 — reviewer)

Findings do reviewer aplicados neste plano:

1. **[MAJOR] formatTick por callback renderizaria índices, não datas** — o chart.js 3.9.1 chama callbacks de ticks com `tick.value` (índice da categoria), não a label; `formatDate(42)` retorna "42". Fix aplicado: as datas são formatadas nos labels do `chartData` (modo day) e o `formatTick` foi removido do factory.
2. **[MAJOR] Teste do lucro negativo buscava "-1u"** — `formatUnit(-1)` = "-1.00u" (toFixed(2)); o teste falharia sempre. Fix aplicado: assert "-1.00u".
3. **[MAJOR] Contagens de testes erradas** — baseline real do repo é 217 (26 arquivos; AGENTS.md cita 55, stale). Final: 217 + 5 (betsListCard) + 1 (betsTableCard) = 223. Corrigido nas Tasks 1, 4 e 5.
4. **[MINOR] `canvas.$chartjs` não existe no vue-chart-3 3.1.8** — Task 5 agora valida por screenshot (com fallback `:on-chart-render` do LineChart, já que `Chart` não é global na página).
5. **[MINOR] Título do eixo sempre presente** — agora `xAxisTitle` só entra quando `labels?.length` (fiel à spec).
