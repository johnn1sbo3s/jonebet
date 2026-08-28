# Redesign da tela "Apostas do dia" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agrupar as apostas do dia por horário com painéis sticky, remover o selo de data redundante dos cards, renomear o mercado "Goleada Casa" para "Goleada H", alinhar a contagem de apostas à direita na linha dos filtros (uma linha só no mobile) e adicionar botão flutuante "voltar ao topo".

**Architecture:** A página agrupa as apostas já filtradas por `Time` num computed e renderiza um cabeçalho sticky (pill com hora teal + contagem) seguido da lista de cards para cada grupo. O card perde a coluna de data. Um novo componente `backToTop` cuida do scroll-to-top global da página.

**Tech Stack:** Vue 3 `<script setup>` (plain JS), Nuxt 4 auto-imports, Tailwind v4, NuxtUI v4, Vitest + @nuxt/test-utils.

## Global Constraints

- Sem TypeScript em código fonte; plain JS.
- Prettier: sem ponto-e-vírgula, aspas simples, trailing comma, largura 120.
- Sem `toLocaleString('pt-BR')`; formatação via helpers existentes.
- Enums centralizados em `app/utils/enums.js` — nada de string mágica espalhada.
- Classes Tailwind: usar `text-2xs` (não `text-[10px]`).
- Cores: teal para acento, zinc 950→900→800 para superfícies, bordas `border-zinc-800`.
- Testes: `mountSuspended()` + `// @vitest-environment nuxt`; mocks centrais em `app/test.setup.ts`.
- Header do site tem 64px (`h-(--ui-header)` sticky top-0 z-50) — offset sticky dos grupos = `top-16`.
- Não rodar `pnpm build`/`npx eslint` após cada edição (hooks rodam no commit).

---

### Task 1: Mapeamento de labels de mercado ("Goleada H")

**Files:**
- Modify: `app/utils/enums.js`
- Modify: `app/pages/daily-bets.vue` (computed `bets`, linha do Market)
- Test: nenhum novo (utils sem suíte hoje; comportamento validado via DOM na Task 4)

**Interfaces:**
- Produces: `MARKET_LABELS` (Object.freeze map) exportado de `app/utils/enums.js`; consumido pelo computed `bets` da página.

- [ ] **Step 1: Adicionar tabela de labels em enums.js**

Após `TRADING_DAYS_PER_YEAR`, adicionar:

```js
// API market names → display labels. Add long/awkward names here instead of
// special-casing in components.
export const MARKET_LABELS = Object.freeze({
  'Goleada Casa': 'Goleada H',
})
```

- [ ] **Step 2: Aplicar no computed bets da página**

Em `app/pages/daily-bets.vue`, trocar a linha:

```js
Market: item.Market ?? null,
```

por:

```js
Market: MARKET_LABELS[item.Market] ?? item.Market ?? null,
```

(Auto-import de `app/utils/*` cobre `MARKET_LABELS`; conferir que Nuxt já resolve `formatNumber` etc. da mesma pasta.)

- [ ] **Step 3: Commit**

```bash
git add app/utils/enums.js app/pages/daily-bets.vue
git commit -m "feat(daily-bets): renomeia mercado Goleada Casa para Goleada H"
```

---

### Task 2: Card sem badge de data

**Files:**
- Modify: `app/components/dailyBetCard.vue`
- Test: `tests/app/components/dailyBetCard.spec.ts`

**Interfaces:**
- Consumes: prop `bet` inalterada (campos `Time`, `Modelo`, `Home`, `Away`, odds, `Odd`, `Market`, `Fixture_ID`).
- Produces: card sem coluna de data; grid externo eliminado.

- [ ] **Step 1: Atualizar testes primeiro**

Em `tests/app/components/dailyBetCard.spec.ts`:

Remover o teste `'renders the date badge with abbreviated month and day'`. Adicionar no lugar:

```ts
it('does not render a date badge', async () => {
  const wrapper = await mountSuspended(DailyBetCard, { props: { bet } })
  expect(wrapper.text()).not.toContain('Jun')
})
```

- [ ] **Step 2: Rodar teste para ver falhar**

Run: `pnpm vitest run tests/app/components/dailyBetCard.spec.ts`
Expected: FAIL — texto 'Jun' presente (badge ainda existe).

- [ ] **Step 3: Remover badge de data do card**

Template novo completo de `app/components/dailyBetCard.vue`:

```vue
<template>
  <div class="flex flex-col gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
    <div class="flex items-center justify-between gap-3">
      <span class="truncate text-sm text-zinc-200"
        >{{ bet.Time }} · <span class="font-semibold text-teal-400">{{ bet.Modelo }}</span></span
      >

      <a
        v-if="bet.Fixture_ID"
        :href="flashscoreUrl(bet.Fixture_ID)"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ver no Flashscore"
        class="shrink-0"
      >
        <UIcon name="i-lucide-external-link" class="text-lg text-zinc-500 hover:text-teal-400" />
      </a>
    </div>

    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-col">
        <span :title="bet.Home" class="truncate text-xs font-semibold text-zinc-100 sm:text-sm">{{ bet.Home }}</span>

        <span :title="bet.Away" class="truncate text-xs font-semibold text-zinc-100 sm:text-sm">{{ bet.Away }}</span>
      </div>

      <div class="flex shrink-0 gap-1 sm:gap-1.5">
        <div class="w-16 rounded-lg border border-zinc-800 bg-zinc-950 px-1.5 py-1 text-center sm:px-2.5">
          <div class="text-2xs font-medium tracking-wide text-zinc-500 uppercase">H</div>

          <div class="text-xs font-semibold text-zinc-100 sm:text-sm">{{ bet.FT_Odds_H }}</div>
        </div>

        <div class="w-16 rounded-lg border border-zinc-800 bg-zinc-950 px-1.5 py-1 text-center sm:px-2.5">
          <div class="text-2xs font-medium tracking-wide text-zinc-500 uppercase">D</div>

          <div class="text-xs font-semibold text-zinc-100 sm:text-sm">{{ bet.FT_Odds_D }}</div>
        </div>

        <div class="w-16 rounded-lg border border-zinc-800 bg-zinc-950 px-1.5 py-1 text-center sm:px-2.5">
          <div class="text-2xs font-medium tracking-wide text-zinc-500 uppercase">A</div>

          <div class="text-xs font-semibold text-zinc-100 sm:text-sm">{{ bet.FT_Odds_A }}</div>
        </div>

        <div
          v-if="bet.Odd != null"
          class="w-16 rounded-lg border border-teal-800/60 bg-teal-950/40 px-1.5 py-1 text-center sm:px-2.5"
        >
          <div class="text-2xs font-medium tracking-wide text-teal-500 uppercase">{{ bet.Market }}</div>

          <div class="text-xs font-semibold text-teal-300 sm:text-sm">{{ bet.Odd }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  bet: { type: Object, required: true },
})
</script>
```

Mudanças: removidos o grid externo, a coluna do badge e todo o Luxon/computed `dateBadge`.

- [ ] **Step 4: Rodar suite do componente**

Run: `pnpm vitest run tests/app/components/dailyBetCard.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add app/components/dailyBetCard.vue tests/app/components/dailyBetCard.spec.ts
git commit -m "feat(daily-bets): remove selo de data do card de aposta"
```

---

### Task 3: Grupos por horário + contagem à direita

**Files:**
- Modify: `app/pages/daily-bets.vue`

**Interfaces:**
- Consumes: `bets` (computed existente), `MARKET_LABELS` (Task 1), `DailyBetCard` sem data (Task 2), `BackToTop` (Task 4).
- Produces: `groupedBets` computed — array de `{ time: string, items: Array }`, ordem = ordem da API.

- [ ] **Step 1: Reescrever página**

Template novo de `app/pages/daily-bets.vue`:

```vue
<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="Apostas do dia" description="Histórico de apostas filtrado por data e modelo" />

    <div class="flex items-center justify-between gap-2">
      <DatePicker v-model="date" :max-value="maxDateIso" />

      <USelectMenu
        v-model="selectedModel"
        variant="outline"
        class="min-w-0 flex-1 sm:flex-none"
        searchable
        placeholder="Todos os modelos"
        :items="modelItems"
        value-key="value"
      />

      <p class="shrink-0 text-sm whitespace-nowrap text-zinc-400 tabular-nums">{{ qtd_games }} apostas</p>
    </div>

    <template v-if="pending">
      <ul class="flex flex-col gap-3">
        <li v-for="i in 3" :key="i">
          <USkeleton class="h-28 w-full rounded-2xl" />
        </li>
      </ul>
    </template>

    <DataErrorCard
      v-else-if="error || !bets.length"
      :message="
        error
          ? 'Não foi possível carregar as apostas'
          : selectedModel
            ? `Nenhuma aposta do modelo ${modelNameToNaturalName(selectedModel)} para esta data`
            : 'Nenhuma aposta encontrada para esta data'
      "
    />

    <template v-else>
      <section v-for="group in groupedBets" :key="group.time" class="flex flex-col gap-3">
        <div
          class="sticky top-16 z-10 -mx-1 w-fit rounded-xl border border-zinc-800 bg-zinc-950/90 px-2.5 py-1.5 backdrop-blur-sm"
        >
          <span class="inline-flex items-center gap-2">
            <span class="text-sm font-bold text-teal-400">{{ group.time }}</span>
            <span class="text-xs text-zinc-500">{{ group.items.length }} apostas</span>
          </span>
        </div>

        <ul class="flex flex-col gap-3">
          <li v-for="bet in group.items" :key="bet._id || `${bet.Date}-${bet.Time}-${bet.Home}`">
            <DailyBetCard :bet="bet" />
          </li>
        </ul>
      </section>
    </template>

    <BackToTop />
  </div>
</template>
```

Script: manter tudo atual (imports Luxon, refs, watch, `modelItems`, `bets`, `qtd_games`) e adicionar:

```js
const groupedBets = computed(() => {
  const groups = new Map()
  for (const bet of bets.value) {
    if (!groups.has(bet.Time)) groups.set(bet.Time, [])
    groups.get(bet.Time).push(bet)
  }
  return [...groups.entries()].map(([time, items]) => ({ time, items }))
})
```

Notas:
- O `<p>` antigo da contagem sai da posição atual; filtros passam a ser uma linha única `justify-between` em todas as larguras (datepicker fixo ~186px, select flex-1, contagem shrink-0). Em 390px cabe (mockup validado).
- `-mx-1` compensa o padding do pill contra a borda do container.
- `top-16` = 64px do header + folga zero (header é sticky h-64px); ajuste fino se necessário na verificação visual.
- `<PageHeader>` não precisa mais do wrapper `flex justify-between`.

- [ ] **Step 2: Commit parcial (sem BackToTop)**

Comentar temporariamente `<BackToTop />` OU criar o componente antes — escolha do executor: se Task 4 ainda não aplicada, remova a linha `<BackToTop />` deste step e ela entra na Task 4. Commit:

```bash
git add app/pages/daily-bets.vue
git commit -m "feat(daily-bets): agrupa apostas por horário e move contagem p/ direita"
```

---

### Task 4: Botão voltar ao topo

**Files:**
- Create: `app/components/backToTop.vue`
- Modify: `app/pages/daily-bets.vue` (garantir `<BackToTop />` do template da Task 3)
- Test: `tests/app/components/backToTop.spec.ts`

**Interfaces:**
- Consumes: nada (self-contained, sem props).
- Produces: componente auto-importado `BackToTop`.

- [ ] **Step 1: Escrever teste falho**

`tests/app/components/backToTop.spec.ts`:

```ts
// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BackToTop from '~/components/backToTop.vue'

describe('backToTop', () => {
  it('renders hidden initially and reveals after scrolling past one viewport', async () => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    const wrapper = await mountSuspended(BackToTop)

    expect(wrapper.find('button').attributes('aria-label')).toBe('Voltar ao topo')
    expect(wrapper.find('button').classes().join(' ')).toContain('opacity-0')

    Object.defineProperty(window, 'scrollY', { value: window.innerHeight + 10, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(wrapper.find('button').classes().join(' ')).not.toContain('opacity-0')
  })

  it('scrolls to top on click', async () => {
    const scrollTo = vi.fn()
    Object.defineProperty(window, 'scrollTo', { value: scrollTo, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: window.innerHeight + 10, configurable: true })

    const wrapper = await mountSuspended(BackToTop)
    await wrapper.find('button').trigger('click')

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
```

- [ ] **Step 2: Rodar pra ver falhar**

Run: `pnpm vitest run tests/app/components/backToTop.spec.ts`
Expected: FAIL (componente não existe).

- [ ] **Step 3: Criar componente**

`app/components/backToTop.vue`:

```vue
<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="scale-95 opacity-0"
    leave-active-class="transition duration-150 ease-out"
    leave-to-class="scale-95 opacity-0"
  >
    <button
      v-if="visible"
      type="button"
      aria-label="Voltar ao topo"
      class="fixed right-6 bottom-6 z-40 flex size-11 cursor-pointer items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 transition-transform active:scale-[0.97] hover:border-zinc-600 hover:text-white"
      @click="scrollTop"
    >
      <UIcon name="i-lucide-arrow-up" class="size-5" />
    </button>
  </Transition>
</template>

<script setup>
const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > window.innerHeight
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>
```

Nota: `v-if` dentro de `<Transition>` dá entrada/saída animada (Vue built-in, sem lib). Entrada parte de scale-95+opacity-0 (nunca scale-0).

- [ ] **Step 4: Rodar teste**

Run: `pnpm vitest run tests/app/components/backToTop.spec.ts`
Expected: PASS (2 tests).

Se o mock do `window.scrollY` não pegar (happy-dom), alternativa: expor `visible` via `defineExpose({ visible })` e assertar estado. Executor decide pela leitura do erro.

- [ ] **Step 5: Garantir uso na página e commit**

`<BackToTop />` deve estar no fim do template da página (Task 3). Commit:

```bash
git add app/components/backToTop.vue tests/app/components/backToTop.spec.ts app/pages/daily-bets.vue
git commit -m "feat(daily-bets): botão flutuante voltar ao topo"
```

---

### Task 5: Verificação visual end-to-end

**Files:** nenhuma mudança; validação.

- [ ] **Step 1: Suite completa**

Run: `pnpm test:unit`
Expected: todos PASS (55 testes existentes − 1 removido + 1 novo do card + 2 novos do backToTop ≈ 57).

- [ ] **Step 2: Dev server + browser headless (browser PRÓPRIO, nunca relay)**

Subir `pnpm run dev --port 3001` via hub. Abrir Chrome for Testing headless do cache playwright (`~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/Google Chrome for Testing.app/...`) com `--headless=new --user-data-dir=/tmp/...`.

Checklist medido via `getBoundingClientRect`/`getComputedStyle` (não confiar em screenshot p/ números):

1. Filtros: datepicker e select com centro Y idêntico; contagem à direita; em 390px nada quebra linha (comparar `offsetTop` dos três).
2. Grupos: pills na ordem cronológica; primeira pill com `top` ≥ header (64px) quando sticky ativa; contagem do grupo = nº de cards abaixo até a próxima pill.
3. "Goleada H": caixa teal com `scrollWidth <= clientWidth` em todos os cards do mercado.
4. Card: sem texto de mês/dia; largura das caixas de odds intacta (64px).
5. BackToTop: `opacity-0`/ausente no topo; após scrollY > innerHeight aparece; click retorna scrollY=0 (smooth — aguardar animação).
6. Mobile 390px: repetir 1–4.

- [ ] **Step 3: Lint nos arquivos tocados**

Hooks rodam no push/commit; se algo falhar, corrigir antes de prosseguir.

- [ ] **Step 4: Smoke final e encerrar**

Recarregar página, interagir (trocar data, filtrar modelo, abrir select), confirmar grupos recalculando e sem erros no console do browser.

---

## Self-review

- Spec coverage: contagem à direita (Task 3), grupos sticky (Task 3), Goleada H (Task 1), remoção data/mês inglês (Task 2), backToTop (Task 4), mobile 1 linha (Task 3 + Step 6 da Task 5), validação DOM headless (Task 5). Completo.
- Placeholders: nenhum TBD; snippets completos.
- Type consistency: `groupedBets` → `{ time, items }` usado no template exatamente como definido; `MARKET_LABELS[item.Market] ?? item.Market ?? null` casa com spec; classes do pill batem com tabela da spec (hora `text-sm font-bold text-teal-400`, contagem `text-xs text-zinc-500`).
