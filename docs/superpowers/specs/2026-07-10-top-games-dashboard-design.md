# Top Games Dashboard — Design Spec

## Overview

Adicionar uma seção "Jogos do Dia" na dashboard principal, mostrando os top 5 jogos mais relevantes (por nº de modelos apostando). Cards em scroll horizontal, clicáveis, que navegam para a página de fixtures com o jogo selecionado.

## Goals

- Destacar jogos com maior consenso entre modelos de apostas
- Dar acesso rápido aos detalhes dos jogos mais relevantes
- Manter a dashboard enxuta — seção compacta, não domina a página

## Non-Goals

- Não é uma substituição da página `/fixtures` — é um atalho visual
- Não mostrar todos os jogos — só os top N mais relevantes
- Não adicionar filtros ou interações complexas — mantém simples

---

## API Design

### Endpoint

```
GET /fixtures/top-daily?date=YYYY-MM-DD&limit=5&source=bookie
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `date` | string | today (BRT) | Data dos jogos |
| `limit` | int | 5 | Nº máximo de jogos retornados |
| `source` | string | "bookie" | Fonte das odds (bookie, etc.) |

### Response Shape

```json
{
  "date": "2026-07-10",
  "fixtures": [
    {
      "_id": "fixture_mongo_id",
      "Date": "2026-07-10",
      "Time": "15:00",
      "Home": "Arsenal",
      "Away": "Chelsea",
      "League": "Premier League",
      "Fixture_ID": "flashscore_id",
      "FT_Odds_H": 1.85,
      "FT_Odds_D": 3.40,
      "FT_Odds_A": 4.20,
      "models_count": 4
    }
  ]
}
```

### Backend Logic

1. Buscar fixtures do dia (reutiliza lógica existente de `/fixtures/daily`)
2. Para cada fixture, contar quantos modelos distintos fizeram apostas
3. Ordenar por `models_count` DESC
4. Limitar por `limit`
5. Retornar no formato acima

### Error Handling

- Se não houver jogos com `models_count > 0`, retornar `fixtures: []`
- Se a data não tiver dados, retornar vazio (não erro)
- Erros de conexão → HTTP 500 com mensagem padrão

---

## Frontend Design

### Component: `topGamesCard.vue`

**Localização:** `app/components/topGamesCard.vue`

**Props:**

```js
defineProps({
  fixtures: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})
```

**Events:**

```js
defineEmits(['select'])
```

### Layout

**Container:**
```
flex gap-3 overflow-x-auto pb-3
scrollbar: zinc-800 track, zinc-700 thumb
```

**Card (cada jogo):**
```
min-w-[280px] bg-zinc-900 border border-zinc-800 rounded-xl p-4
cursor-pointer transition-all duration-200
hover:border-teal-500
```

**Estrutura do Card:**

```
┌─────────────────────────────────────┐
│ PREMIER LEAGUE           15:00      │  ← header: liga + hora
│                                     │
│ Arsenal x Chelsea                   │  ← teams: text-base font-semibold
│                                     │
│ [1.85] [3.40] [4.20]   ● 4 modelos │  ← meta: odds badges + models badge
└─────────────────────────────────────┘
```

**Detalhes visuais:**

- **Header:** `text-[10px] text-zinc-500 uppercase tracking-wide` (liga) + `text-sm font-semibold text-zinc-400` (hora)
- **Teams:** `text-base font-semibold text-white`
- **Odds badges:** `bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md text-xs`
  - Odd favorita (menor valor): `bg-teal-500/10 text-teal-500`
- **Models badge:** `bg-teal-500/10 text-teal-500 rounded-full px-2.5 py-0.5 text-xs font-semibold` com dot indicator `w-1.5 h-1.5 bg-teal-500 rounded-full`

### Skeleton Loading

```
5x cards: animate-pulse bg-zinc-800 rounded-xl h-32 min-w-[280px]
```

### Empty State

Se `fixtures.length === 0` e `!loading`:
- **Esconder a seção inteira** (não mostrar card vazio)
- Usar `v-if="fixtures.length > 0 || loading"` no container pai

---

## Integration

### Localização na Dashboard

**Arquivo:** `app/pages/index.vue`

**Posição:** Logo abaixo do `UAlert`, antes do gráfico de evolução da banca.

```
<UAlert ... />
<TopGamesCard :fixtures="topGames" :loading="topGamesLoading" @select="onGameSelect" />
<USkeleton v-if="status === 'pending'" ... />  ← gráfico de banca
```

### Data Fetching

**Composable:** `useTopGames` em `app/composables/useModelApi.js`

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

**Uso no index.vue:**

```js
const today = ref(DateTime.now().setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd'))
const { data: topGamesData, status: topGamesStatus } = await useTopGames({ date: today })

const topGames = computed(() => topGamesData.value?.fixtures || [])
const topGamesLoading = computed(() => topGamesStatus.value === 'pending')
```

### Navegação

**Click no card:**

```js
function onGameSelect(fixture) {
  navigateTo({
    path: '/fixtures',
    query: { game: fixture._id, date: fixture.Date }
  })
}
```

**Na página `/fixtures`:**

Adicionar watcher para selecionar automaticamente o jogo se `?game=` estiver na URL:

```js
const route = useRoute()
const selectedGameId = computed(() => route.query.game)

// Dentro do FixturesList, após carregar fixtures:
watch(selectedGameId, (id) => {
  if (id && fixtures.value.length) {
    const game = fixtures.value.find(f => f._id === id)
    if (game) handleGameClick(game)
  }
}, { immediate: true })
```

---

## Responsive Behavior

| Breakpoint | Cards per row | Scroll |
|------------|---------------|--------|
| Mobile (<640px) | 1 card visível | Horizontal |
| Tablet (640-1024px) | 2 cards visíveis | Horizontal |
| Desktop (>1024px) | 3 cards visíveis | Horizontal |

---

## Testing

### Unit Tests

1. **TopGamesCard:** renderiza cards, emite select, mostra skeleton, esconde quando vazio
2. **useTopGames:** cache funciona, query params corretos

### E2E / Manual

1. Dashboard carrega → seção aparece abaixo do alerta
2. Cards mostram dados corretos (liga, hora, times, odds, modelos)
3. Scroll horizontal funciona em todos os breakpoints
4. Click no card → navega para `/fixtures?game=...&date=...`
5. Página `/fixtures` abre com aquele jogo selecionado
6. Se nenhum jogo tem modelos, seção não aparece

---

## File Changes Summary

| File | Change |
|------|--------|
| `jonebet-api/` (backend) | Novo endpoint `/fixtures/top-daily` |
| `app/composables/useModelApi.js` | Adicionar `useTopGames()` |
| `app/components/topGamesCard.vue` | Novo componente |
| `app/pages/index.vue` | Integrar TopGamesCard abaixo do alerta |
| `app/pages/fixtures.vue` | Adicionar watcher para `?game=` query param |
