# Top Games Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar seção "Jogos do Dia" na dashboard com top 5 jogos por nº de modelos, em cards scrolláveis que navegam para fixtures com detalhes.

**Architecture:** Novo endpoint backend retorna fixtures rankeados. Frontend consoma via composable, renderiza em componente de scroll horizontal, e integra na dashboard com navegação para página de detalhes.

**Tech Stack:** Python (backend API), Vue 3 `<script setup>`, Nuxt 4, NuxtUI v4, Tailwind CSS v4

---

## File Structure

| File | Change | Responsibility |
|------|--------|----------------|
| `jonebet-api/` (backend) | Create | Novo endpoint `/fixtures/top-daily` |
| `app/composables/useModelApi.js` | Modify | Adicionar `useTopGames()` |
| `app/components/topGamesCard.vue` | Create | Componente de cards scrolláveis |
| `app/components/topGamesCardSkeleton.vue` | Create | Skeleton de loading |
| `app/pages/index.vue` | Modify | Integrar TopGamesCard |
| `app/pages/fixtures.vue` | Modify | Adicionar watcher para `?game=` query |

---

### Task 1: Backend — Endpoint `/fixtures/top-daily`

**Files:**
- Create: `jonebet-api/routes/fixtures.py` (ou local apropriado)

- [ ] **Step 1: Criar rota `/fixtures/top-daily`**

```python
@router.get("/fixtures/top-daily")
async def get_top_daily_fixtures(
    date: str = None,
    limit: int = 5,
    source: str = "bookie"
):
    """
    Retorna os top N jogos do dia rankeados por nº de modelos apostando.
    
    Query Params:
        date: YYYY-MM-DD (default: today BRT)
        limit: Nº máximo de jogos (default: 5)
        source: Fonte das odds (default: "bookie")
    """
    # Resolver data (default: hoje BRT)
    if not date:
        from datetime import datetime
        from zoneinfo import ZoneInfo
        date = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%Y-%m-%d")
    
    # Buscar fixtures do dia (reutilizar lógica existente)
    fixtures = await get_fixtures_by_date(date, source)
    
    # Buscar apostas do dia
    bets = await get_bets_by_date(date)
    
    # Contar modelos por fixture
    from collections import defaultdict
    models_by_fixture = defaultdict(set)
    for bet in bets:
        fixture_key = (bet.get("Date"), bet.get("Home"), bet.get("Away"))
        models_by_fixture[fixture_key].add(bet.get("Modelo"))
    
    # Enriquecer fixtures com models_count
    enriched = []
    for fixture in fixtures:
        fixture_key = (fixture.get("Date"), fixture.get("Home"), fixture.get("Away"))
        models_count = len(models_by_fixture.get(fixture_key, set()))
        if models_count > 0:
            enriched.append({
                **fixture,
                "models_count": models_count
            })
    
    # Ordenar por models_count DESC e limitar
    enriched.sort(key=lambda x: x["models_count"], reverse=True)
    enriched = enriched[:limit]
    
    return {
        "date": date,
        "fixtures": enriched
    }
```

- [ ] **Step 2: Testar endpoint manualmente**

Run: `curl "http://localhost:8000/fixtures/top-daily?limit=3"`
Expected: JSON com `{ "date": "...", "fixtures": [...] }` com até 3 jogos

- [ ] **Step 3: Commit**

```bash
git add jonebet-api/routes/fixtures.py
git commit -m "feat(api): add /fixtures/top-daily endpoint for dashboard"
```

---

### Task 2: Composable — `useTopGames`

**Files:**
- Modify: `app/composables/useModelApi.js`

- [ ] **Step 1: Adicionar import de `isRef` e `ref` no topo do arquivo**

Verificar se já existem. Se não, adicionar:
```js
import { isRef, ref } from 'vue'
```

- [ ] **Step 2: Adicionar composable `useTopGames`**

Adicionar no final do arquivo `useModelApi.js`:

```js
export function useTopGames({ date, limit = 5, source = 'bookie' } = {}) {
  const cache = useCache()
  const sourceRef = isRef(source) ? source : ref(source)
  const cacheKey = computed(() => `top-games-${date.value ?? 'any'}-${limit}-${sourceRef.value}`)
  return useFetch(() => `${apiUrl()}/fixtures/top-daily`, {
    key: 'top-games',
    query: computed(() => {
      const q = {}
      if (date.value) q.date = date.value
      q.limit = limit
      if (sourceRef.value) q.source = sourceRef.value
      return q
    }),
    default: () => ({ date: null, fixtures: [] }),
    watch: [date, sourceRef],
    getCachedData: (key, nuxtApp) => {
      const cached = cacheGet(cache, cacheKey.value)
      if (cached) return cached
      const payloadData = nuxtApp?.payload?.data?.[key]
      if (payloadData && (date.value === null || date.value === payloadData.date)) {
        return payloadData
      }
      return undefined
    },
    onResponse({ response }) {
      if (response?.ok && response._data !== undefined) {
        cacheSet(cache, cacheKey.value, response._data)
      }
    },
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/composables/useModelApi.js
git commit -m "feat(composable): add useTopGames for dashboard top games"
```

---

### Task 3: Componente — `topGamesCardSkeleton`

**Files:**
- Create: `app/components/topGamesCardSkeleton.vue`

- [ ] **Step 1: Criar componente skeleton**

```vue
<template>
  <div class="flex gap-3 overflow-x-auto pb-3">
    <div
      v-for="i in 5"
      :key="i"
      class="h-32 min-w-[280px] animate-pulse rounded-xl bg-zinc-800"
    />
  </div>
</template>

<script setup>
</script>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/topGamesCardSkeleton.vue
git commit -m "feat(component): add topGamesCardSkeleton loading state"
```

---

### Task 4: Componente — `topGamesCard`

**Files:**
- Create: `app/components/topGamesCard.vue`

- [ ] **Step 1: Criar componente principal**

```vue
<template>
  <div v-if="fixtures.length > 0 || loading" class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <UIcon name="i-lucide-flame" class="text-teal-500" />
      <h2 class="text-base font-semibold text-white">Jogos do Dia</h2>
      <span class="text-xs text-zinc-500">Mais apostados pelos modelos</span>
    </div>

    <TopGamesCardSkeleton v-if="loading" />

    <div v-else class="flex gap-3 overflow-x-auto pb-3">
      <div
        v-for="fixture in fixtures"
        :key="fixture._id"
        class="min-w-[280px] cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all duration-200 hover:border-teal-500"
        @click="emits('select', fixture)"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="text-[10px] uppercase tracking-wide text-zinc-500">
            {{ fixture.League }}
          </span>
          <span class="text-sm font-semibold text-zinc-400">
            {{ fixture.Time }}
          </span>
        </div>

        <div class="mb-3 text-base font-semibold text-white">
          {{ fixture.Home }} x {{ fixture.Away }}
        </div>

        <div class="flex items-center justify-between">
          <div class="flex gap-1.5">
            <span
              class="rounded-md px-2 py-1 text-xs"
              :class="fixture.FT_Odds_H <= fixture.FT_Odds_A && fixture.FT_Odds_H <= fixture.FT_Odds_D
                ? 'bg-teal-500/10 text-teal-500'
                : 'bg-zinc-800 text-zinc-300'"
            >
              {{ formatNumber(fixture.FT_Odds_H) }}
            </span>
            <span class="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
              {{ formatNumber(fixture.FT_Odds_D) }}
            </span>
            <span
              class="rounded-md px-2 py-1 text-xs"
              :class="fixture.FT_Odds_A <= fixture.FT_Odds_H && fixture.FT_Odds_A <= fixture.FT_Odds_D
                ? 'bg-teal-500/10 text-teal-500'
                : 'bg-zinc-800 text-zinc-300'"
            >
              {{ formatNumber(fixture.FT_Odds_A) }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-0.5">
            <span class="h-1.5 w-1.5 rounded-full bg-teal-500" />
            <span class="text-xs font-semibold text-teal-500">
              {{ fixture.models_count }} {{ fixture.models_count === 1 ? 'modelo' : 'modelos' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  fixtures: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['select'])
</script>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/topGamesCard.vue
git commit -m "feat(component): add topGamesCard with horizontal scroll"
```

---

### Task 5: Integração na Dashboard

**Files:**
- Modify: `app/pages/index.vue`

- [ ] **Step 1: Adicionar import de DateTime**

Adicionar após o `<script setup>`:
```js
import { DateTime } from 'luxon'
```

- [ ] **Step 2: Adicionar data fetching para top games**

Adicionar após os imports existentes:
```js
const today = ref(DateTime.now().setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd'))
const { data: topGamesData, status: topGamesStatus } = await useTopGames({ date: today })

const topGames = computed(() => topGamesData.value?.fixtures || [])
const topGamesLoading = computed(() => topGamesStatus.value === 'pending')
```

- [ ] **Step 3: Adicionar handler de seleção**

Adicionar função:
```js
function onGameSelect(fixture) {
  navigateTo({
    path: '/fixtures',
    query: { game: fixture._id, date: fixture.Date },
  })
}
```

- [ ] **Step 4: Inserir componente no template**

Inserir logo após o `UAlert` (aproximadamente linha 15):
```vue
<TopGamesCard
  :fixtures="topGames"
  :loading="topGamesLoading"
  @select="onGameSelect"
/>
```

- [ ] **Step 5: Verificar se DateTime já está importado**

Se já existir `import { DateTime } from 'luxon'`, não adicionar novamente.

- [ ] **Step 6: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat(dashboard): integrate topGamesCard section"
```

---

### Task 6: Navegação na Página `/fixtures`

**Files:**
- Modify: `app/pages/fixtures.vue`

- [ ] **Step 1: Adicionar leitura do query param `game`**

Adicionar após `const selectedDate = ref('')`:
```js
const route = useRoute()
const selectedGameId = computed(() => route.query.game)
```

- [ ] **Step 2: Adicionar watcher para selecionar jogo automaticamente**

Adicionar após o `watch(selectedDate, ...)` existente:
```js
// Selecionar jogo automaticamente se veio do query param
watch(
  [selectedGameId, () => fixtures.value],
  ([gameId, fixturesList]) => {
    if (gameId && fixturesList?.length) {
      const game = fixturesList.find((f) => f._id === gameId)
      if (game) {
        chosenGame.value = game
      }
    }
  },
  { immediate: true },
)
```

- [ ] **Step 3: Verificar se `chosenGame` é ref**

Se `chosenGame` não for uma ref, ajustar o watcher para usar a variável correta.

- [ ] **Step 4: Commit**

```bash
git add app/pages/fixtures.vue
git commit -m "feat(fixtures): auto-select game from ?game= query param"
```

---

### Task 7: Smoke Test

- [ ] **Step 1: Iniciar dev server**

Run: `pnpm run dev`

- [ ] **Step 2: Verificar dashboard**

1. Abrir `http://localhost:3000`
2. Verificar se seção "Jogos do Dia" aparece abaixo do alerta
3. Verificar se cards mostram dados corretos
4. Verificar se scroll horizontal funciona

- [ ] **Step 3: Verificar navegação**

1. Clicar em um card
2. Verificar se navega para `/fixtures?game=...&date=...`
3. Verificar se jogo é selecionado automaticamente

- [ ] **Step 4: Verificar empty state**

1. Se não houver jogos com modelos, verificar se seção não aparece

- [ ] **Step 5: Verificar responsivo**

1. Redimensionar janela para mobile (<640px)
2. Verificar cards em scroll horizontal
3. Verificar tablet (640-1024px)

---

## Self-Review Checklist

- [ ] Spec coverage: Todos os requisitos do spec têm tarefas correspondentes
- [ ] Placeholder scan: Nenhum TBD/TODO no plano
- [ ] Type consistency: Nomes de props, eventos e funções são consistentes entre tarefas
