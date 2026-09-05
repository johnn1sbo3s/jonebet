# Ticket 2 — Plano de Implementação (TDD)

**Status:** 🟢 Em execução

## Escopo

Implementar a página `/trading-models` no jonebet-frontend seguindo o layout aprovado (baseado no HTML do Telegram). 4 novos arquivos, 3 modificados.

## Ordem de Implementação

1. **Composable** (`useTradingModels.js`) — fetch + cache + safeParse
2. **Schema** (`schemas.js`) — contratos Zod
3. **Enum** (`enums.js`) — badges coloridos + resultados
4. **Componente: tradingModelDayCard.vue** — card por modelo
5. **Componente: tradingModelAggTable.vue** — tabela agregada
6. **Página: trading-models.vue** — composição + DatePicker
7. **Layout** (`default.vue`) — nav entry

Cada tarefa segue TDD: teste falha → implementação → teste passa → commit.

---

## Task 1: `useTradingModels` Composable

**Files:**
- Create: `app/composables/useTradingModels.js`
- Test: `tests/app/composables/useTradingModels.spec.ts`

### Step 1: Write the failing test

```javascript
// tests/app/composables/useTradingModels.spec.ts
// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

vi.mock('~/utils/schemas', () => ({
  safeParse: vi.fn((endpoint, data) => data),
}))

const mockUseFetch = vi.fn()
vi.mock('#app', () => ({ useFetch: mockUseFetch, useRuntimeConfig: () => ({ public: { API_URL: 'http://test' } }) }))

describe('useTradingModels', () => {
  beforeEach(() => {
    mockUseFetch.mockReset()
    mockUseFetch.mockReturnValue({ data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() })
  })

  it('fetches trading-models with date query', async () => {
    const { useTradingModels } = await import('~/composables/useTradingModels')
    const date = ref('2026-09-04')
    useTradingModels({ date })
    expect(mockUseFetch).toHaveBeenCalledWith(
      expect.stringContaining('/trading-models'),
      expect.objectContaining({ query: expect.any(Object) })
    )
  })

  it('returns fallback on empty response', () => {
    mockUseFetch.mockReturnValue({ data: ref(null), pending: ref(false), error: ref(null), refresh: vi.fn() })
    // expect data to be fallback
  })
})
```

### Step 2: Run test to verify it fails

```bash
cd ~/Projetos/jonebet-frontend
pnpm vitest run tests/app/composables/useTradingModels.spec.ts
```
Expected: FAIL (module not found)

### Step 3: Write minimal implementation

```javascript
// app/composables/useTradingModels.js
import { safeParse } from '~/utils/schemas'

const apiUrl = () => useRuntimeConfig().public.API_URL
const useCache = () => useState('trading-models-cache', () => ({}))
const CACHE_CAP = 50

function cacheGet(cache, key) {
  const v = cache.value[key]
  if (v === undefined) return undefined
  delete cache.value[key]
  cache.value[key] = v
  return v
}

function cacheSet(cache, key, value) {
  if (key in cache.value) delete cache.value[key]
  cache.value[key] = value
  const keys = Object.keys(cache.value)
  while (keys.length > CACHE_CAP) delete cache.value[keys.shift()]
}

export function useTradingModels({ date } = {}) {
  const dateRef = isRef(date) ? date : ref(date)
  const cache = useCache()
  const cacheKey = computed(() => `tm-${dateRef.value ?? 'today'}`)
  const query = computed(() => (dateRef.value ? { date: dateRef.value } : {}))

  return useFetch(`${apiUrl()}/trading-models`, {
    key: 'trading-models',
    query,
    default: () => ({ date: null, daily: [], weekly: {}, monthly: {} }),
    watch: [dateRef],
    getCachedData: () => cacheGet(cache, cacheKey.value),
    onResponse({ response }) {
      if (response?.ok && response._data) {
        const parsed = safeParse('tradingModelsList', response._data)
        cacheSet(cache, cacheKey.value, parsed)
        response._data = parsed
      }
    },
  })
}
```

### Step 4: Run test to verify it passes

```bash
pnpm vitest run tests/app/composables/useTradingModels.spec.ts
```
Expected: PASS

### Step 5: Commit

```bash
git add app/composables/useTradingModels.js tests/app/composables/useTradingModels.spec.ts
git commit -m "feat: useTradingModels composable"
```

---

## Task 2: Schemas (Zod)

**Files:**
- Modify: `app/utils/schemas.js:79-83`
- Test: `tests/app/utils/schemas-trading-models.spec.ts`

### Step 1: Write the failing test

```javascript
// tests/app/utils/schemas-trading-models.spec.ts
import { describe, it, expect } from 'vitest'
import { endpointSchemas } from '~/utils/schemas'

describe('tradingModelsList schema', () => {
  it('has tradingModelsList entry', () => {
    expect(endpointSchemas.tradingModelsList).toBeDefined()
  })

  it('returns fallback on non-object input', () => {
    const result = endpointSchemas.tradingModelsList.schema.parse(null)
    expect(result).toEqual(endpointSchemas.tradingModelsList.fallback)
  })

  it('passthrough preserves daily/weekly/monthly fields', () => {
    const input = {
      date: '2026-09-04',
      daily: [{ model: 'donkey', bets: [] }],
      weekly: { rows: [] },
      monthly: { rows: [] },
    }
    const result = endpointSchemas.tradingModelsList.schema.parse(input)
    expect(result.daily).toEqual(input.daily)
    expect(result.weekly).toEqual(input.weekly)
  })
})
```

### Step 2: Run test to verify it fails

```bash
pnpm vitest run tests/app/utils/schemas-trading-models.spec.ts
```
Expected: FAIL

### Step 3: Write minimal implementation

Add to `app/utils/schemas.js` after `scannerXgHistory`:

```javascript
  tradingModelsList: {
    schema: FlexObject.default({ date: null, daily: [], weekly: {}, monthly: {} }),
    fallback: { date: null, daily: [], weekly: {}, monthly: {} },
  },
```

### Step 4: Run test to verify it passes

```bash
pnpm vitest run tests/app/utils/schemas-trading-models.spec.ts
```
Expected: PASS

### Step 5: Commit

```bash
git add app/utils/schemas.js tests/app/utils/schemas-trading-models.spec.ts
git commit -m "feat: add tradingModelsList Zod schema"
```

---

## Task 3: Enums

**Files:**
- Modify: `app/utils/enums.js:15-30` (append new enums)
- Test: `tests/app/utils/trading-models-enums.spec.ts`

### Step 1: Write the failing test

```javascript
// tests/app/utils/trading-models-enums.spec.ts
import { describe, it, expect } from 'vitest'
import { TRADING_MODEL_BADGE, TRADING_MODEL_RESULT } from '~/utils/enums'

describe('TRADING_MODEL_BADGE', () => {
  it('has color classes for all 5 models', () => {
    expect(TRADING_MODEL_BADGE.donkey).toBe('bg-blue-500/20 text-blue-400')
    expect(TRADING_MODEL_BADGE.luigi).toBe('bg-green-500/20 text-green-400')
    expect(TRADING_MODEL_BADGE.crash).toBe('bg-red-500/20 text-red-400')
    expect(TRADING_MODEL_BADGE.pacman).toBe('bg-purple-500/20 text-purple-400')
    expect(TRADING_MODEL_BADGE.scorpion).toBe('bg-amber-500/20 text-amber-400')
  })
})

describe('TRADING_MODEL_RESULT', () => {
  it('maps result strings to display classes', () => {
    expect(TRADING_MODEL_RESULT.GREEN).toBe('text-green-400')
    expect(TRADING_MODEL_RESULT.RED_LIGHT).toBe('text-amber-400')
    expect(TRADING_MODEL_RESULT.RED).toBe('text-red-400')
  })
})
```

### Step 2: Run test to verify it fails

```bash
pnpm vitest run tests/app/utils/trading-models-enums.spec.ts
```
Expected: FAIL

### Step 3: Write minimal implementation

Add to `app/utils/enums.js`:

```javascript
export const TRADING_MODEL_BADGE = Object.freeze({
  donkey: 'bg-blue-500/20 text-blue-400',
  luigi: 'bg-green-500/20 text-green-400',
  crash: 'bg-red-500/20 text-red-400',
  pacman: 'bg-purple-500/20 text-purple-400',
  scorpion: 'bg-amber-500/20 text-amber-400',
})

export const TRADING_MODEL_RESULT = Object.freeze({
  GREEN: 'text-green-400',
  RED_LIGHT: 'text-amber-400',
  RED: 'text-red-400',
})
```

### Step 4: Run test to verify it passes

```bash
pnpm vitest run tests/app/utils/trading-models-enums.spec.ts
```
Expected: PASS

### Step 5: Commit

```bash
git add app/utils/enums.js tests/app/utils/trading-models-enums.spec.ts
git commit -m "feat: add trading model enums (badges + results)"
```

---

## Task 4: Componente `tradingModelDayCard.vue`

**Files:**
- Create: `app/components/tradingModelDayCard.vue`
- Test: `tests/app/components/tradingModelDayCard.spec.ts`

### Step 1: Write the failing test

```javascript
// tests/app/components/tradingModelDayCard.spec.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TradingModelDayCard from '~/components/tradingModelDayCard.vue'

const mockModel = {
  model: 'donkey',
  model_label: 'Donkey',
  subtotal: 10.0,
  bets: [
    {
      time: '14:00',
      home: 'Basaksehir',
      away: 'Galatasaray',
      odd: 14.55,
      ht_score: [0, 1],
      minute_70_score: [1, 1],
      ft_score: [2, 3],
      goals_home_minutes: ['34'],
      goals_away_minutes: ['54', '68', '84'],
      result: 'GREEN',
      profit: 10.0,
      liability: 0,
    },
  ],
}

describe('TradingModelDayCard', () => {
  it('renders model badge', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: mockModel },
    })
    expect(wrapper.text()).toContain('Donkey')
  })

  it('renders subtotal with pnl-pos class when positive', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: mockModel },
    })
    const subtotal = wrapper.find('[data-testid="subtotal"]')
    expect(subtotal.classes()).toContain('pnl-pos')
    expect(subtotal.text()).toContain('+R$')
  })

  it('renders bet row with result badge', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: mockModel },
    })
    expect(wrapper.text()).toContain('Basaksehir vs Galatasaray')
    expect(wrapper.text()).toContain('GREEN')
  })

  it('applies pnl-neg class when subtotal is negative', async () => {
    const negativeModel = { ...mockModel, subtotal: -23.17 }
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: negativeModel },
    })
    const subtotal = wrapper.find('[data-testid="subtotal"]')
    expect(subtotal.classes()).toContain('pnl-neg')
  })
})
```

### Step 2: Run test to verify it fails

```bash
pnpm vitest run tests/app/components/tradingModelDayCard.spec.ts
```
Expected: FAIL

### Step 3: Write minimal implementation

```vue
<!-- app/components/tradingModelDayCard.vue -->
<script setup>
import { TRADING_MODEL_BADGE, TRADING_MODEL_RESULT } from '~/utils/enums'
import { formatUnit, formatNumber } from '~/utils/formatNumber'

const props = defineProps({
  model: { type: Object, required: true },
})

const badgeClass = computed(() => TRADING_MODEL_BADGE[props.model.model] ?? 'bg-zinc-700 text-zinc-300')
const subtotalClass = computed(() => (props.model.subtotal >= 0 ? 'pnl-pos' : 'pnl-neg'))
const subtotalFormatted = computed(() => {
  const sign = props.model.subtotal >= 0 ? '+' : ''
  return `${sign}${formatUnit(props.model.subtotal)}`
})
</script>

<template>
  <div class="card">
    <div class="flex justify-between items-baseline mb-3">
      <span :class="['badge text-xs font-semibold px-3 py-1 rounded-full', badgeClass]">
        {{ model.model_label }}
      </span>
      <span data-testid="subtotal" :class="['text-sm font-semibold', subtotalClass]">
        {{ subtotalFormatted }}
      </span>
    </div>
    <div v-for="bet in model.bets" :key="bet.fixture_id" class="mt-3 pt-3 border-t border-zinc-800 first:mt-0 first:pt-0 first:border-t-0">
      <div class="font-semibold text-sm">{{ bet.home }} vs {{ bet.away }}</div>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
        <span>{{ bet.time }}</span>
        <span class="font-semibold">{{ formatNumber(bet.odd) }}</span>
        <span>{{ bet.ht_score[0] }}x{{ bet.ht_score[1] }} · {{ bet.minute_70_score[0] }}x{{ bet.minute_70_score[1] }} · {{ bet.ft_score[0] }}x{{ bet.ft_score[1] }}</span>
        <span :class="['font-bold', TRADING_MODEL_RESULT[bet.result]]">{{ bet.result }}</span>
        <span :class="['font-bold', bet.profit >= 0 ? 'text-green-400' : 'text-red-400']">
          {{ bet.profit >= 0 ? '+' : '' }}{{ formatUnit(bet.profit) }}
        </span>
      </div>
    </div>
  </div>
</template>
```

### Step 4: Run test to verify it passes

```bash
pnpm vitest run tests/app/components/tradingModelDayCard.spec.ts
```
Expected: PASS

### Step 5: Commit

```bash
git add app/components/tradingModelDayCard.vue tests/app/components/tradingModelDayCard.spec.ts
git commit -m "feat: TradingModelDayCard component"
```

---

## Task 5: Componente `tradingModelAggTable.vue`

**Files:**
- Create: `app/components/tradingModelAggTable.vue`
- Test: `tests/app/components/tradingModelAggTable.spec.ts`

### Step 1: Write the failing test

```javascript
// tests/app/components/tradingModelAggTable.spec.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TradingModelAggTable from '~/components/tradingModelAggTable.vue'

const mockAgg = {
  rows: [
    { model: 'crash', games: 4, green: 3, red_light: 0, red: 1, total: -5.54 },
    { model: 'donkey', games: 5, green: 2, red_light: 3, red: 0, total: 3.28 },
  ],
  total: -2.26,
}

describe('TradingModelAggTable', () => {
  it('renders title', async () => {
    const wrapper = await mountSuspended(TradingModelAggTable, {
      props: { title: 'Semana', agg: mockAgg },
    })
    expect(wrapper.text()).toContain('Semana')
  })

  it('renders all rows', async () => {
    const wrapper = await mountSuspended(TradingModelAggTable, {
      props: { title: 'Semana', agg: mockAgg },
    })
    expect(wrapper.text()).toContain('crash')
    expect(wrapper.text()).toContain('donkey')
  })

  it('renders total row with total class', async () => {
    const wrapper = await mountSuspended(TradingModelAggTable, {
      props: { title: 'Semana', agg: mockAgg },
    })
    const totalRow = wrapper.find('[data-testid="agg-total"]')
    expect(totalRow.classes()).toContain('font-bold')
    expect(totalRow.text()).toContain('-R$')
  })
})
```

### Step 2: Run test to verify it fails

```bash
pnpm vitest run tests/app/components/tradingModelAggTable.spec.ts
```
Expected: FAIL

### Step 3: Write minimal implementation

```vue
<!-- app/components/tradingModelAggTable.vue -->
<script setup>
import { formatUnit } from '~/utils/formatNumber'

defineProps({
  title: { type: String, required: true },
  agg: { type: Object, required: true },
})

const cellClass = (val) => (val >= 0 ? 'text-green-400' : 'text-red-400')
</script>

<template>
  <div class="card">
    <h4 class="text-sm font-semibold mb-3">{{ title }}</h4>
    <table class="w-full text-xs">
      <thead>
        <tr class="border-b border-zinc-800 text-zinc-500">
          <th class="text-left py-2 px-3">Modelo</th>
          <th class="text-center py-2 px-3">Jogos</th>
          <th class="text-center py-2 px-3">G</th>
          <th class="text-center py-2 px-3">RL</th>
          <th class="text-center py-2 px-3">R</th>
          <th class="text-right py-2 px-3">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in agg.rows" :key="row.model" class="border-b border-zinc-900">
          <td class="py-2 px-3 capitalize">{{ row.model }}</td>
          <td class="text-center py-2 px-3">{{ row.games }}</td>
          <td class="text-center py-2 px-3 text-green-400">{{ row.green }}</td>
          <td class="text-center py-2 px-3 text-amber-400">{{ row.red_light }}</td>
          <td class="text-center py-2 px-3 text-red-400">{{ row.red }}</td>
          <td :class="['text-right py-2 px-3 font-semibold', cellClass(row.total)]">
            {{ formatUnit(row.total) }}
          </td>
        </tr>
        <tr data-testid="agg-total" class="font-bold bg-zinc-950">
          <td colspan="5" class="py-2 px-3">TOTAL</td>
          <td :class="['text-right py-2 px-3', cellClass(agg.total)]">
            {{ formatUnit(agg.total) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

### Step 4: Run test to verify it passes

```bash
pnpm vitest run tests/app/components/tradingModelAggTable.spec.ts
```
Expected: PASS

### Step 5: Commit

```bash
git add app/components/tradingModelAggTable.vue tests/app/components/tradingModelAggTable.spec.ts
git commit -m "feat: TradingModelAggTable component"
```

---

## Task 6: Página `trading-models.vue`

**Files:**
- Create: `app/pages/trading-models.vue`
- Test: `tests/app/pages/trading-models.spec.ts`

### Step 1: Write the failing test

```javascript
// tests/app/pages/trading-models.spec.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

// Mock the composable
vi.mock('~/composables/useTradingModels.js', async () => {
  const { ref } = await import('vue')
  return {
    useTradingModels: () => ({
      data: ref({
        date: '2026-09-04',
        daily: [
          {
            model: 'donkey',
            model_label: 'Donkey',
            subtotal: 10.0,
            bets: [
              {
                fixture_id: 'f1',
                time: '14:00',
                home: 'Basaksehir',
                away: 'Galatasaray',
                odd: 14.55,
                ht_score: [0, 1],
                minute_70_score: [1, 1],
                ft_score: [2, 3],
                goals_home_minutes: ['34'],
                goals_away_minutes: ['54', '68', '84'],
                result: 'GREEN',
                profit: 10.0,
                liability: 0,
              },
            ],
          },
        ],
        weekly: { rows: [{ model: 'donkey', games: 1, green: 1, red_light: 0, red: 0, total: 10 }], total: 10 },
        monthly: { rows: [{ model: 'donkey', games: 1, green: 1, red_light: 0, red: 0, total: 10 }], total: 10 },
      }),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn(),
    }),
  }
})

describe('Trading Models Page', () => {
  it('renders header with title', async () => {
    const wrapper = await mountSuspended((await import('~/pages/trading-models.vue')).default)
    expect(wrapper.text()).toContain('Trading Models')
  })

  it('renders DatePicker', async () => {
    const wrapper = await mountSuspended((await import('~/pages/trading-models.vue')).default)
    expect(wrapper.find('input[type="date"]').exists()).toBe(true)
  })

  it('renders daily cards for each model', async () => {
    const wrapper = await mountSuspended((await import('~/pages/trading-models.vue')).default)
    expect(wrapper.text()).toContain('Donkey')
    expect(wrapper.text()).toContain('Basaksehir vs Galatasaray')
  })

  it('renders weekly and monthly tables', async () => {
    const wrapper = await mountSuspended((await import('~/pages/trading-models.vue')).default)
    expect(wrapper.text()).toContain('Semana')
    expect(wrapper.text()).toContain('Mês')
  })
})
```

### Step 2: Run test to verify it fails

```bash
pnpm vitest run tests/app/pages/trading-models.spec.ts
```
Expected: FAIL

### Step 3: Write minimal implementation

```vue
<!-- app/pages/trading-models.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useTradingModels } from '~/composables/useTradingModels'
import TradingModelDayCard from '~/components/tradingModelDayCard.vue'
import TradingModelAggTable from '~/components/tradingModelAggTable.vue'
import DataErrorCard from '~/components/DataErrorCard.vue'

const route = useRoute()
const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(route.query.date ?? today)

const { data, pending, error, refresh } = useTradingModels({ date: selectedDate })

const weeklyTitle = computed(() => {
  if (!data.value?.weekly?.start_date) return 'Semana'
  return `Semana (${data.value.weekly.start_date} a ${data.value.weekly.end_date})`
})

const monthlyTitle = computed(() => {
  if (!data.value?.monthly?.year) return 'Mês'
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[data.value.monthly.month - 1]} ${data.value.monthly.year}`
})

function onDateChange(e) {
  selectedDate.value = e.target.value
  refresh()
}
</script>

<template>
  <div class="min-h-screen p-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-xl font-bold text-white">📊 Trading Models</h1>
        <p class="text-xs text-zinc-500">Stake 10u · Green +10 · RL −5% liability · Red −30%</p>
      </div>
      <input type="date" :value="selectedDate" class="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white" @change="onDateChange">
    </div>

    <!-- Loading -->
    <div v-if="pending" class="grid grid-cols-1 gap-3">
      <div v-for="i in 5" :key="i" class="h-32 bg-zinc-900 rounded-2xl animate-pulse"></div>
    </div>

    <!-- Error -->
    <DataErrorCard v-else-if="error" message="Erro ao carregar dados" />

    <!-- Content -->
    <div v-else class="grid grid-cols-1 gap-3">
      <!-- Daily sections per model -->
      <TradingModelDayCard
        v-for="model in data?.daily ?? []"
        :key="model.model"
        :model="model"
      />

      <!-- Weekly aggregation -->
      <TradingModelAggTable
        v-if="data?.weekly"
        :title="weeklyTitle"
        :agg="data.weekly"
      />

      <!-- Monthly aggregation -->
      <TradingModelAggTable
        v-if="data?.monthly"
        :title="monthlyTitle"
        :agg="data.monthly"
      />
    </div>
  </div>
</template>
```

### Step 4: Run test to verify it passes

```bash
pnpm vitest run tests/app/pages/trading-models.spec.ts
```
Expected: PASS

### Step 5: Commit

```bash
git add app/pages/trading-models.vue tests/app/pages/trading-models.spec.ts
git commit -m "feat: Trading Models page"
```

---

## Task 7: Nav Entry

**Files:**
- Modify: `app/layouts/default.vue:35-41`

### Step 1: Write the failing test

(Não precisa de teste específico — o nav é coberto visualmente. Podemos validar com `pnpm run dev`.)

### Step 2: Implementation

Add after `{ label: 'Academia', ... }` in `navItems[0]`:

```javascript
{
  label: 'Trading Models',
  icon: 'i-lucide-trending-up',
  to: '/trading-models',
},
```

### Step 3: Commit

```bash
git add app/layouts/default.vue
git commit -m "feat: add Trading Models to nav"
```

---

## Task 8: Update TICKETS.md

**Files:**
- Modify: `docs/tickets/trading-models/TICKETS.md:52-65`

### Step 1: Implementation

Change Ticket 2 status from `🔴 Não iniciado` to `🟢 Concluído em 2026-09-05`.

### Step 2: Commit

```bash
git add docs/tickets/trading-models/TICKETS.md
git commit -m "docs: mark Ticket 2 as complete"
```

---

## Verificação Final

```bash
# Rodar todos os novos testes
pnpm vitest run tests/app/composables/useTradingModels.spec.ts tests/app/utils/schemas-trading-models.spec.ts tests/app/utils/trading-models-enums.spec.ts tests/app/components/tradingModelDayCard.spec.ts tests/app/components/tradingModelAggTable.spec.ts tests/app/pages/trading-models.spec.ts

# Deve passar tudo
```

## Notas

- O composable `useTradingModels` será adicionado ao `test.setup.ts` mock **somente se** causar problemas em specs existentes. Até lá, os specs individuais mockam diretamente.
- O DatePicker nativo (`<input type="date">`) é mais simples e acessível que um componente customizado. Pode ser trocado por `DatePicker.vue` depois se necessário.
- O layout mobile (cards empilhados, scroll horizontal) é padrão do grid/flex do Tailwind — sem CSS extra.
