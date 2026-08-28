# Relatório — Segmented Control "Por liga / Por horário" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um segmented control na página /relatorio que alterna a visualização dos jogos entre agrupamento por liga (atual) e por horário (bloco "14h"), com escolha persistida em localStorage.

**Architecture:** Mudança exclusiva em `app/pages/relatorio.vue`. O script ganha um `visualizacao` ref (persistido), um `byHour` computed que espelha o `byLeague` existente, e um `groups` computed que escolhe entre os dois. O template ganha a linha com `<SegmentedControl>` (componente já existente) e troca o `v-for` de `byLeague` para `groups`, com `byLeague` refatorado para o shape `{ key, label, jogos }` na mesma task (não quebrar estado intermediário). Estados de loading/erro/vazio ficam intocados.

**Tech Stack:** Nuxt 4.4.7, Vue 3 `<script setup>` JS puro, NuxtUI v4, Tailwind v4, Vitest (não usado aqui — verificação é visual/browser, padrão do repo).

## Global Constraints

- **Sem TypeScript** — JS puro em `<script setup>`.
- **Prettier**: sem ponto-e-vírgula, aspas simples, trailing commas, largura 120.
- **NÃO rodar** `npx eslint`, `npx prettier --check` ou `pnpm build` manualmente — o pre-commit (lint-staged) roda isso no commit. O hook também barra valores arbitrários de pixel do Tailwind (`text-[10px]` etc.) — não usar.
- **Sem lodash** — usar nativo (`Map`, `Array.sort`).
- **Não matar o dev server do usuário** (porta 3000). O dev hot-reload os arquivos; verificar via browser. Se a 3000 estiver ocupada por outra instância nossa, usar a porta que o log do server mostrar (3001).
- **Único arquivo alterado**: `app/pages/relatorio.vue`.
- **Espec**: `docs/superpowers/specs/2026-08-10-relatorio-visualizacao-design.md` (não commitado — gitignored).
- **Data do relatório**: nunca usar `new Date().toISOString()` (UTC); `DateTime.now().setZone(SP_TZ).toFormat('yyyy-MM-dd')`.
- **Dados são dinâmicos**: contagens e horários variam por dia — assertions de verificação devem ser relativas aos dados do dia, nunca números fixos.

---

### Task 1: Lógica de visualização no script (somente adições)

**Files:**
- Modify: `app/pages/relatorio.vue` (script setup)

**Interfaces:**
- Consumes: `state` do `useDailyReport()` (já existente). `byLeague` NÃO é tocado nesta task.
- Produces: `visualizacao` (ref string, `'por_liga'` | `'por_horario'`), `viewOptions` (array `[{ value, label }]`), `byHour` (computed de `[{ key, label, jogos }]`), `groups` (computed que retorna `byHour` ou `byLeague`).

- [ ] **Step 1: Ajustar o import do Vue**

No topo do `<script setup>`, trocar `import { computed } from 'vue'` por:

```js
import { computed, ref, watch } from 'vue'
```

- [ ] **Step 2: Adicionar `visualizacao`, `viewOptions`, `byHour` e `groups`**

Logo após o computed `byLeague` existente (antes de `function goBack()`), inserir:

```js
// Visualização escolhida pelo usuário: 'por_liga' | 'por_horario'. Persistida
// em localStorage; guarda de import.meta.client porque o setup roda em SSR.
const visualizacao = ref('por_liga')

if (import.meta.client) {
  visualizacao.value = localStorage.getItem('relatorio.visualizacao') || 'por_liga'
}

watch(visualizacao, (v) => {
  if (import.meta.client) localStorage.setItem('relatorio.visualizacao', v)
})

const viewOptions = [
  { value: 'por_liga', label: 'Por liga' },
  { value: 'por_horario', label: 'Por horário' },
]

// Agrupa por bloco de hora do kickoff (ex.: "14h" junta 14:00, 14:30).
// Jogo sem horário parseável cai no grupo "Outros", no final.
const byHour = computed(() => {
  const jogos = state.response?.jogos || []
  const map = new Map()
  for (const j of jogos) {
    const match = /^(\d{1,2}):/.exec(j.time || '')
    const key = match ? match[1] : 'Outros'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(j)
  }
  return [...map.entries()]
    .map(([hour, items]) => ({
      key: hour,
      label: hour === 'Outros' ? 'Outros' : `${hour}h`,
      jogos: items.sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    }))
    .sort((a, b) => {
      if (a.key === 'Outros') return 1
      if (b.key === 'Outros') return -1
      return a.key.localeCompare(b.key)
    })
})

const groups = computed(() => (visualizacao.value === 'por_horario' ? byHour.value : byLeague.value))
```

- [ ] **Step 3: Smoke test de não-regressão**

No browser headless (ou manual), abrir `http://localhost:3000/relatorio` (ou a porta real do dev server; conferir o log do server se 3000 estiver ocupada). Aguardar o relatório carregar.

Expected: a página renderiza exatamente como antes — painéis por liga com os cards, sem erro no console. Nenhuma mudança visual ainda (o template ainda usa `byLeague`; `groups`/`visualizacao` ainda não são consumidos).

---

### Task 2: Template — controle, switch e refactor do shape de `byLeague`

**Files:**
- Modify: `app/pages/relatorio.vue` (template + refactor do `byLeague` no script)

**Interfaces:**
- Consumes: `groups` (computed), `visualizacao` (ref), `viewOptions` (array) — da Task 1; `SegmentedControl` (auto-importado de `app/components/SegmentedControl.vue`, interface `v-model` + `options: [{ value, label }]`).
- Produces: shape consistente `{ key, label, jogos }` para os dois agrupamentos.

- [ ] **Step 1: Refatorar `byLeague` para o shape `{ key, label, jogos }`**

No `<script setup>`, substituir o computed `byLeague` inteiro (de `const byLeague = computed(() => {` até o `})` que o fecha) por:

```js
const byLeague = computed(() => {
  const jogos = state.response?.jogos || []
  const map = new Map()
  for (const j of jogos) {
    const key = j.league || 'Outras'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(j)
  }
  return [...map.entries()]
    .map(([league, items]) => ({
      key: league,
      label: league,
      jogos: items.sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})
```

- [ ] **Step 2: Adicionar a linha do SegmentedControl**

Dentro do `<div v-else-if="state.response" class="flex flex-col gap-4">`, como PRIMEIRO filho (antes do primeiro `<section>`), inserir:

```html
<SegmentedControl v-model="visualizacao" :options="viewOptions" />
```

- [ ] **Step 3: Trocar o loop de `byLeague` para `groups`**

No mesmo bloco, substituir `<section v-for="group in byLeague" :key="group.league"` por:

```html
<section v-for="group in groups" :key="group.key"
```

- [ ] **Step 4: Trocar o título do painel de `group.league` para `group.label`**

No header do painel, substituir `<h2 class="text-sm font-bold text-zinc-100">{{ group.league }}</h2>` por:

```html
<h2 class="text-sm font-bold text-zinc-100">{{ group.label }}</h2>
```

Nada mais no template muda (pill "N jogos", grid, cards, odds, chips, análises permanecem iguais).

- [ ] **Step 5: Verificar no browser — switch e persistência**

No browser headless:
1. Abrir `http://localhost:3000/relatorio`, aguardar carregar.
2. Clicar em "Por horário" no SegmentedControl.
3. Medir via `evaluate` (não screenshot): lista de `h2` dos painéis é `['09h','12h',...,'22h']` — labels `HHh` ordenados crescentes, sem "Outros" (dados reais têm horário em todos); total de cards = total de jogos do relatório; pill "N jogos" de cada painel bate com a contagem de cards do painel.
4. Recarregar a página (F5) — deve voltar em "Por horário" (localStorage).
5. Clicar "Por liga" → painéis com labels de liga (sem regressão do h2).

- [ ] **Step 6: Commit**

```bash
git add app/pages/relatorio.vue
git commit -m "feat: segmented control por liga/por horário no relatório"
```

Expected: o pre-commit roda lint-staged (prettier + eslint + check-arbitrary-values) e o commit passa. Se o lint apontar algo, corrigir e repetir.

---

### Task 3: Verificação completa

**Files:**
- Nenhum (somente verificação).

**Interfaces:**
- Consumes: página implementada nas Tasks 1–2.

- [ ] **Step 1: Viewport desktop (1280px)**

Browser headless, viewport 1280×900, URL `/relatorio`:
1. Clicar "Por liga" → `getComputedStyle(grid).gridTemplateColumns` com **2 tracks** por painel, sem overflow horizontal (`document.documentElement.scrollWidth <= clientWidth`).
2. Clicar "Por horário" → mesmas 2 tracks, painéis `HHh` crescentes.

- [ ] **Step 2: Viewport mobile (375px)**

Browser headless, viewport 375×812 (viewport REAL, não frame CSS), URL `/relatorio`:
1. Clicar "Por horário" → **1 track** em todos os painéis (`gridTemplateColumns`), cards em largura total, **sem overflow horizontal**.
2. Clicar "Por liga" → idem 1 track, sem overflow.
3. Conferir que o SegmentedControl cabe em 375px (largura do controle < 375px, sem wrap estranho na linha).

- [ ] **Step 3: Persistência**

1. Em "Por horário", recarregar → volta em "Por horário".
2. `localStorage.getItem('relatorio.visualizacao')` === `'por_horario'`.
3. Em "Por liga", recarregar → volta em "Por liga".

- [ ] **Step 4: Fallback "Outros" (caso sintético)**

O fetch do relatório é client-side (`onMounted` → `$fetch`), então é interceptável:
1. `page.route('**/report?*', ...)` — substituir a resposta: copiar o JSON real e zerar `time` de um jogo (ex.: `jogos[0].time = ''`).
2. Recarregar a página, clicar "Por horário".
3. Expected: um painel "Outros" com esse jogo aparece no final da lista. Se a intercepção falhar no harness (erro "Request Interception is not enabled" / "undefined is not a function"), alternativa: rodar a regex `^(\d{1,2}):` sobre um array sintético no `evaluate` e confirmar que `''` e `'TBD'` caem no grupo "Outros" e que a ordenação coloca "Outros" por último.

- [ ] **Step 5: Sanity final**

1. Abrir a página no browser do usuário (porta do dev server dele) e confirmar visualmente as duas visões.
2. `git log --oneline -1` mostra o commit da Task 2.
3. `git status` limpo (spec/plan em `docs/superpowers/` são gitignored e não aparecem).
