# PRD — Performance Optimization: DataPlay Bets Dashboard

> **Status**: Draft
> **Data**: 2026-07-19
> **Baseline**: Lighthouse Mobile 85/100 · FCP 3.1s · LCP 3.4s
> **Target**: Lighthouse Mobile ≥95 · FCP ≤1.5s · LCP ≤2.0s

---

## 1. Problema

A dashboard em produção (<https://dataplaybets.vercel.app/>) atinge **85/100 no Lighthouse mobile**. O desktop é 100/100. Os gargalos são:

| Métrica     | Atual | Target | Status |
| ----------- | ----- | ------ | ------ |
| FCP         | 3.1s  | ≤1.5s  | 🔴     |
| LCP         | 3.4s  | ≤2.0s  | 🔴     |
| TBT         | 20ms  | ≤200ms | 🟢     |
| CLS         | 0     | ≤0.1   | 🟢     |
| Speed Index | 3.9s  | ≤2.5s  | 🟡     |

**Causa raiz**: Zero code splitting/ lazy loading + Chart.js + luxon + zod carregados eagerly no bundle principal.

---

## 2. Escopo

5 workstreams independentes, cada um com fix específica:

| WS  | Problema                             | Est. impacto FCP |
| --- | ------------------------------------ | ---------------- |
| A   | Lazy loading de componentes          | -500ms           |
| B   | Chart.js dynamic import              | -400ms           |
| C   | Tree-shaking (zod/luxon/json-server) | -200ms           |
| D   | Otimização de imagens                | -50ms            |
| E   | Render-blocking CSS + preconnect     | -200ms           |

**Total estimado**: -1350ms → FCP ~1.7s (dentro do target)

---

## 3. Workstream A — Lazy Loading de Componentes

### 3.1 Contexto

Zero uso de `Lazy` prefix ou `defineAsyncComponent` no projeto. Todos os componentes são importados eagerly, inflando o bundle principal.

### 3.2 Mudanças

#### `app/pages/index.vue`

| Linha | Antes                     | Depois                        |
| ----- | ------------------------- | ----------------------------- |
| 16    | `<TopGamesCard ...>`      | `<LazyTopGamesCard ...>`      |
| 30    | `<BankrollEvolution ...>` | `<LazyBankrollEvolution ...>` |

**Razão**: `BankrollEvolution` importa Chart.js (~90KB). `TopGamesCard` usa carrossel + modal + drawer.

#### `app/pages/performance/[[model]].vue`

| Linha | Antes                        | Depois                           |
| ----- | ---------------------------- | -------------------------------- |
| 38    | `<PerformanceChartCard ...>` | `<LazyPerformanceChartCard ...>` |
| 47    | `<ResultsTablesGrid ...>`    | `<LazyResultsTablesGrid ...>`    |
| 49    | `<BetsTableCard ...>`        | `<LazyBetsTableCard ...>`        |

#### `app/pages/fixtures.vue`

| Linha | Antes                | Depois                   |
| ----- | -------------------- | ------------------------ |
| 11    | `<FixturesList ...>` | `<LazyFixturesList ...>` |

### 3.3 O que NÃO lazy-loadar

`PageHeader`, `DataErrorCard`, `USkeleton`, `UAlert`, `DatePicker`, `USelectMenu`, `YesterdayMetricsCard`, `YesterdayDetailsCard`, `RankingModels`, `DailyBetCard`, `AcademyTermCard`, `MetricsCard` — componentes leves, above-the-fold, ou renderizados via `v-if`.

### 3.4 Config Vite — manualChunks

Adicionar em `nuxt.config.ts`:

```ts
vite: {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-charts': ['chart.js', 'chartjs-plugin-annotation', 'chartjs-plugin-zoom'],
          'vendor-luxon': ['luxon'],
        },
      },
    },
  },
},
```

### 3.5 Estimativa

- Bundle principal: 230KB → ~45KB inicial
- Chart.js carrega apenas quando componente de gráfico monta

---

## 4. Workstream B — Chart.js Dynamic Import

### 4.1 Contexto

`app/plugins/chartjs.client.js` importa e registra **tudo** eager:

- chart.js (~335KB ESM)
- chartjs-plugin-zoom (~32KB)
- chartjs-plugin-annotation (~82KB)
- registerables (Bar, Pie, Doughnut, etc.) — desnecessário, só usamos Line

`vue-chart-3` faz `import * as Chartjs from "chart.js"` — impede tree-shaking e puxa lodash-es.

### 4.2 Abordagem: Drop vue-chart-3 + Lazy Registration

**Decisão**: Substituir `vue-chart-3` por wrapper nativo Chart.js. Razões:

- vue-chart-3 bloqueia tree-shaking
- Apenas `LineChart` é usado
- Wrapper nativo dá acesso direto a `resetZoom()` (hoje usa `chartKey++` para forçar remount)

#### 4.2.1 Criar `app/composables/useChartSetup.js`

```js
let chartReady = false

export async function ensureChartRegistered() {
  if (chartReady) return

  const [
    { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler },
    zoomPlugin,
    annotationPlugin,
  ] = await Promise.all([import('chart.js'), import('chartjs-plugin-zoom'), import('chartjs-plugin-annotation')])

  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin.default ?? zoomPlugin,
    annotationPlugin.default ?? annotationPlugin,
  )

  chartReady = true
}
```

#### 4.2.2 Criar `app/components/BaseLineChart.vue`

```vue
<script setup>
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import { ensureChartRegistered } from '~/composables/useChartSetup'

const props = defineProps({
  chartData: { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
})

const canvasRef = ref(null)
const chartInstance = shallowRef(null)

onMounted(async () => {
  await ensureChartRegistered()
  const { Chart } = await import('chart.js')
  chartInstance.value = new Chart(canvasRef.value, {
    type: 'line',
    data: props.chartData,
    options: props.options,
  })
})

watch(
  () => props.chartData,
  (newData) => {
    if (chartInstance.value) {
      chartInstance.value.data = newData
      chartInstance.value.update()
    }
  },
  { deep: true },
)

watch(
  () => props.options,
  (newOpts) => {
    if (chartInstance.value) {
      chartInstance.value.options = newOpts
      chartInstance.value.update()
    }
  },
  { deep: true },
)

onUnmounted(() => chartInstance.value?.destroy())

// Expõe para o parent poder chamar resetZoom()
defineExpose({ resetZoom: () => chartInstance.value?.resetZoom() })
</script>

<template>
  <canvas ref="canvasRef" />
</template>
```

#### 4.2.3 Atualizar componentes

**`app/components/bankrollEvolution.vue`**:

```vue
<!-- Antes -->
<LineChart :chart-data="chartData" :options="chartOptions" :style="chartStyle" />

<!-- Depois -->
<BaseLineChart :chart-data="chartData" :options="chartOptions" :style="chartStyle" />
```

**`app/components/performanceChartCard.vue`**:

```vue
<!-- Antes -->
<LineChart :key="chartKey" class="w-full" :chart-data="chartData" :options="chartOptions" :style="chartStyle" />
<!-- ... -->
<LineChart
  :key="`dd-${chartKey}`"
  class="w-full"
  :chart-data="drawdownChartData"
  :options="drawdownOptions"
  :style="{ height: '72px' }"
/>

<!-- Depois -->
<BaseLineChart ref="mainChartRef" class="w-full" :chart-data="chartData" :options="chartOptions" :style="chartStyle" />
<!-- ... -->
<BaseLineChart class="w-full" :chart-data="drawdownChartData" :options="drawdownOptions" :style="{ height: '72px' }" />
```

**Zoom reset** (substituir `chartKey++`):

```js
// Antes
function resetsZoom() {
  chartKey.value++
}

// Depois
const mainChartRef = ref(null)
function resetsZoom() {
  mainChartRef.value?.resetZoom()
}
```

#### 4.2.4 Remover dependências

```bash
pnpm remove vue-chart-3
```

#### 4.2.5 Atualizar `app/plugins/chartjs.client.js`

Plugin vazio (ou deletar):

```js
export default defineNuxtPlugin(() => {
  // Chart.js registration deferred to composables/useChartSetup.js
})
```

### 4.3 Estimativa

- Remove ~9KB vue-chart-3 + lodash-es
- Tree-shake chart.js para ~200KB (só Line components)
- Carregamento diferido para primeiro render de gráfico

---

## 5. Workstream C — Tree-Shaking & Bundle Cleanup

### 5.1 `json-server` → devDependencies

```bash
# Mover de dependencies para devDependencies
pnpm remove json-server
pnpm add -D json-server
```

Não é importado em código de aplicação — é CLI tool usado apenas no script `backend`.

### 5.2 Zod → `zod/v4-mini`

**Contexto**: zod v4 regular = ~41KB. `zod/v4-mini` = ~5-6KB. Schemas usam apenas `z.object()`, `z.array()`, `z.unknown()`, `.passthrough()`, `.default()`, `.safeParse()`.

**Mudança em `app/utils/schemas.js`**:

```js
// Antes
import { z } from 'zod'

// Depois
import * as z from 'zod/v4-mini'
```

> ⚠️ Verificar compatibilidade: `zod/v4-mini` usa API function-based. Testar todos os schemas após mudança.

### 5.3 Luxon — code-split

Luxon (~50KB minificado) é usado em 6 arquivos mas não é necessário no first paint.

**Abordagem**: `manualChunks` (já coberto no WS A, seção 3.4) separa luxon em chunk assíncrono.

**Opcional (futuro)**: Substituir luxon por `date-fns` (~1KB por função) ou `Intl.DateTimeFormat` nativo. Economia: ~45KB. Esforço: alto (6 arquivos para reescrever).

### 5.4 `optimizeDeps.include` — manter

`optimizeDeps` afeta apenas dev pre-bundling, não production bundle. Manter para UX no dev.

### 5.5 Bundle analysis

Adicionar ao `nuxt.config.ts`:

```ts
build: {
  analyze: true,
}
```

Rodar `npx nuxt analyze` para treemap interativo da composição do bundle.

### 5.6 Estimativa

| Mudança               | Savings                           |
| --------------------- | --------------------------------- |
| json-server → devDeps | ~200KB node_modules (não bundled) |
| zod/v4-mini           | **~35KB** do bundle               |
| manualChunks luxon    | Code-split do main chunk          |

---

## 6. Workstream D — Otimização de Imagens

### 6.1 Logo — width/height (fix imediato)

**`app/layouts/default.vue`**, linha 41:

```html
<!-- Antes -->
<img src="/dataplay-icon.png" alt="DataPlay" class="h-8" />

<!-- Depois -->
<img src="/dataplay-icon.png" alt="DataPlay" width="161" height="32" loading="eager" fetchpriority="high" class="h-8" />
```

Dimensões: 484×116 natural → renderiza a 32px de altura → width = 32 × (484/116) = 161.

### 6.2 Instalar `@nuxt/image`

```bash
npx nuxt module add image
```

**`nuxt.config.ts`**:

```ts
modules: ['@nuxt/image', /* ... */],

image: {
  provider: 'vercel',
  quality: 80,
  format: ['webp', 'avif'],
},
```

**Logo com NuxtImg**:

```vue
<NuxtImg
  src="/dataplay-icon.png"
  alt="DataPlay"
  width="161"
  height="32"
  loading="eager"
  fetchpriority="high"
  preload
  class="h-8"
/>
```

Vercel auto-serves WebP/AVIF baseado no `Accept` do browser. 26KB PNG → ~6-8KB WebP.

### 6.3 Favicon

Upload `dataplay-icon.png` para [realfavicongenerator.net](https://realfavicongenerator.net/). Gerar:

- `favicon.ico` (16+32px)
- `favicon.svg` (moderno)
- `apple-touch-icon.png` (180×180)
- `icon-192.png`, `icon-512.png` (PWA)

Adicionar links em `nuxt.config.ts`:

```ts
app: {
  head: {
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    ],
  },
},
```

### 6.4 SVG (opcional)

Se o logo for vetorial (texto + formas geométricas), SVG é ~2-5KB vs 26KB PNG, com renderização nítida em qualquer resolução.

---

## 7. Workstream E — Render-Blocking CSS + Preconnect

### 7.1 Remover CSS render-blocking

**Problema**: Nuxt 4 SSR injeta estilos como `<style>` inline, mas TAMBÉM adiciona `<link rel="stylesheet">` redundante no `<head>`, bloqueando render.

**Fix — `build:manifest` hook em `nuxt.config.ts`**:

```ts
hooks: {
  'build:manifest': (manifest) => {
    for (const key of Object.keys(manifest)) {
      const entry = manifest[key]
      if (entry.resourceType === 'style' || key.endsWith('.css')) {
        entry.dynamicImports = []
      }
      entry.css = []  // remove <link> redundante — estilos já inline via SSR
    }
  },
},
```

**Alternativa**: `nuxt-vitalizer` module (mais maintível):

```bash
pnpm add -D nuxt-vitalizer
```

```ts
modules: ['nuxt-vitalizer'],
vitalizer: { disableStylesheets: 'entry' },
```

### 7.2 Preconnect à API

```ts
app: {
  head: {
    link: [
      { rel: 'preconnect', href: 'https://api.jonebet.xyz' },
      { rel: 'dns-prefetch', href: 'https://api.jonebet.xyz' },
    ],
  },
},
```

Economia: 150-300ms no primeiro fetch da API (DNS+TCP+TLS).

### 7.3 Font preload

```ts
fonts: {
  families: [
    { name: 'Plus Jakarta Sans', preload: true },
  ],
},
```

`@nuxt/fonts` já gera `@font-face` com `font-display: swap`. `preload: true` adiciona `<link rel="preload">` no `<head>`.

### 7.4 Vercel compression

Já ativo automaticamente (brotli/gzip). **Nenhuma ação necessária.**

### 7.5 NuxtLoadingIndicator

Impacto negligível. Manter como está.

---

## 8. nuxt.config.ts — Estado Final

```ts
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Dataplay Bets',
      link: [
        { rel: 'preconnect', href: 'https://api.jonebet.xyz' },
        { rel: 'dns-prefetch', href: 'https://api.jonebet.xyz' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },

  modules: ['@nuxt/image', '@nuxt/ui', '@nuxt/fonts', '@pinia/nuxt', '@nuxtjs/device', '@nuxt/eslint'],

  image: {
    provider: 'vercel',
    quality: 80,
    format: ['webp', 'avif'],
  },

  fonts: {
    families: [{ name: 'Plus Jakarta Sans', preload: true }],
  },

  css: ['@/assets/css/main.css'],

  devtools: { enabled: false },

  compatibilityDate: '2026-06-05',

  colorMode: { preference: 'dark' },

  hooks: {
    'build:manifest': (manifest) => {
      for (const key of Object.keys(manifest)) {
        const entry = manifest[key]
        if (entry.resourceType === 'style' || key.endsWith('.css')) {
          entry.dynamicImports = []
        }
        entry.css = []
      }
    },
  },

  runtimeConfig: {
    public: { API_URL: 'https://api.jonebet.xyz' },
  },

  build: {
    analyze: true,
  },

  vite: {
    optimizeDeps: {
      include: ['chart.js', 'chartjs-plugin-annotation', 'chartjs-plugin-zoom', 'luxon', 'pinia'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-charts': ['chart.js', 'chartjs-plugin-annotation', 'chartjs-plugin-zoom'],
            'vendor-luxon': ['luxon'],
          },
        },
      },
    },
  },
})
```

---

## 9. Ordem de Implementação

| Fase | WS  | Ação                                               | Dependências                |
| ---- | --- | -------------------------------------------------- | --------------------------- |
| 1    | E   | Remover render-blocking CSS (hook)                 | Nenhuma                     |
| 1    | E   | Preconnect API                                     | Nenhuma                     |
| 1    | D   | Fix width/height no logo                           | Nenhuma                     |
| 1    | C   | Mover json-server → devDeps                        | Nenhuma                     |
| 2    | A   | Adicionar `Lazy` prefix nos componentes            | Nenhuma                     |
| 2    | A   | Adicionar `manualChunks` no Vite                   | Nenhuma                     |
| 3    | B   | Criar `useChartSetup.js`                           | Nenhuma                     |
| 3    | B   | Criar `BaseLineChart.vue`                          | useChartSetup               |
| 3    | B   | Atualizar bankrollEvolution + performanceChartCard | BaseLineChart               |
| 3    | B   | Remover vue-chart-3                                | Atualização dos componentes |
| 4    | C   | Zod → zod/v4-mini                                  | Testes de schema            |
| 4    | D   | Instalar @nuxt/image + NuxtImg                     | Nenhuma                     |
| 4    | D   | Favicon refresh                                    | Nenhuma                     |
| 5    | E   | Font preload                                       | Nenhuma                     |

**Fases 1-2** são low-risk, high-impact → fazer primeiro.
**Fase 3** é medium-risk (muda API de chart) → testar bem.
**Fase 4** é low-risk, medium-impact.
**Fase 5** é polish.

---

## 10. Verificação

### Antes de cada fase

```bash
npx lighthouse https://dataplaybets.vercel.app/ --output=json --output-path=/tmp/lh-before.json --chrome-flags="--headless --no-sandbox" --only-categories=performance
```

### Após cada fase

```bash
# Build
pnpm build

# Lighthouse
npx lighthouse https://dataplaybets.vercel.app/ --output=json --output-path=/tmp/lh-after-{phase}.json --chrome-flags="--headless --no-sandbox" --only-categories=performance

# Bundle analysis
npx nuxt analyze
```

### Checklist de aceitação

| Critério                                   | Target |
| ------------------------------------------ | ------ |
| Lighthouse Mobile score                    | ≥95    |
| FCP mobile                                 | ≤1.5s  |
| LCP mobile                                 | ≤2.0s  |
| CLS                                        | ≤0.1   |
| TBT                                        | ≤200ms |
| Bundle principal (main chunk)              | ≤80KB  |
| Zero `<link rel="stylesheet">` no `<head>` | ✅     |
| Chart.js não no initial bundle             | ✅     |

---

## 11. Riscos

| Risco                                           | Mitigação                                     |
| ----------------------------------------------- | --------------------------------------------- |
| `Lazy` prefix causa flash de conteúdo           | USkeleton já cobre estados de loading         |
| vue-chart-3 removal quebra zoom/pan             | BaseLineChart expõe `resetZoom()` diretamente |
| zod/v4-mini incompatível com schemas existentes | Testar todos os safeParse antes de deploy     |
| build:manifest hook quebra com atualização Nuxt | Usar nuxt-vitalizer como alternativa          |
| @nuxt/image adiciona overhead no server         | Vercel provider é serverless, overhead mínimo |

---

## 12. Futuro (fora deste PRD)

| Item                                         | Impacto                  | Esforço |
| -------------------------------------------- | ------------------------ | ------- |
| Substituir luxon por date-fns ou Intl nativo | -45KB                    | Alto    |
| Converter logo para SVG                      | -20KB + qualidade Retina | Médio   |
| Service Worker para cache offline            | UX offline               | Alto    |
| HTTP/2 Server Push para chunks críticos      | -100ms                   | Médio   |
