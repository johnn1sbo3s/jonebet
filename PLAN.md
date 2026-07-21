# Plano — Performance Optimization DataPlay Bets

> Baseline: Lighthouse Mobile 85/100 · FCP 3.1s · LCP 3.4s
> Target: Lighthouse Mobile ≥95 · FCP ≤1.5s · LCP ≤2.0s
> PRD: PERFORMANCE-PRD.md

---

## Fase 1 — Fixes rápidos (low-risk, high-impact)

### 1.1 Remover render-blocking CSS

**Arquivo**: `nuxt.config.ts`

Adicionar hook `build:manifest` para limpar `<link rel="stylesheet">` redundante do `<head>` (estilos já inline via SSR):

```ts
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
```

### 1.2 Preconnect à API

**Arquivo**: `nuxt.config.ts`

Adicionar em `app.head.link`:

```ts
{ rel: 'preconnect', href: 'https://api.jonebet.xyz' },
{ rel: 'dns-prefetch', href: 'https://api.jonebet.xyz' },
```

### 1.3 Fix width/height no logo

**Arquivo**: `app/layouts/default.vue` (linha 41)

```html
<!-- Antes -->
<img src="/dataplay-icon.png" alt="DataPlay" class="h-8" />

<!-- Depois -->
<img src="/dataplay-icon.png" alt="DataPlay" width="161" height="32" loading="eager" fetchpriority="high" class="h-8" />
```

### 1.4 Mover json-server → devDependencies

```bash
pnpm remove json-server && pnpm add -D json-server
```

### 1.5 Adicionar build.analyze

**Arquivo**: `nuxt.config.ts`

```ts
build: { analyze: true },
```

---

## Fase 2 — Lazy loading + manualChunks

### 2.1 Lazy prefix nos componentes

**`app/pages/index.vue`**:

- Linha 17: `<TopGamesCard` → `<LazyTopGamesCard`
- Linha 40: `<BankrollEvolution` → `<LazyBankrollEvolution`

**`app/pages/performance/[[model]].vue`**:

- Linha 47: `<PerformanceChartCard` → `<LazyPerformanceChartCard`
- Linha 59: `<ResultsTablesGrid` → `<LazyResultsTablesGrid`
- Linha 61: `<BetsTableCard` → `<LazyBetsTableCard`

**`app/pages/fixtures.vue`**:

- Linha 9: `<FixturesList` → `<LazyFixturesList`

### 2.2 manualChunks no Vite

**Arquivo**: `nuxt.config.ts`

Adicionar `vite.build.rollupOptions.output.manualChunks`:

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

---

## Fase 3 — Chart.js dynamic import (medium-risk)

### 3.1 Criar `app/composables/useChartSetup.js`

Lazy registration — carrega chart.js + plugins apenas no primeiro render de gráfico.
Registra apenas componentes de Line (não Bar/Pie/etc).

### 3.2 Criar `app/components/BaseLineChart.vue`

Wrapper nativo Chart.js com:

- `ensureChartRegistered()` no `onMounted`
- Watchers para `chartData` e `options`
- `defineExpose({ resetZoom })` para acesso direto
- `destroy()` no `onUnmounted`

### 3.3 Atualizar `app/components/bankrollEvolution.vue`

- Trocar `<LineChart>` por `<BaseLineChart>`
- Remover import de `LineChart` de `vue-chart-3`

### 3.4 Atualizar `app/components/performanceChartCard.vue`

- Trocar ambos `<LineChart>` por `<BaseLineChart>`
- Adicionar `ref="mainChartRef"` no chart principal
- Substituir `chartKey++` / `resetsZoom()` por `mainChartRef.value?.resetZoom()`
- Remover `chartKey` ref e o watcher de `[chosenModelIdRef, groupBy]` que incrementava `chartKey`
- Remover import de `LineChart` de `vue-chart-3`

### 3.5 Atualizar `app/plugins/chartjs.client.js`

Tornar plugin vazio (registration deferida para useChartSetup.js).

### 3.6 Remover vue-chart-3

```bash
pnpm remove vue-chart-3
```

---

## Fase 4 — Tree-shaking + imagens

### 4.1 Zod → zod/v4-mini

**Arquivo**: `app/utils/schemas.js` (linha 1)

```js
// Antes
import { z } from 'zod'
// Depois
import * as z from 'zod/v4-mini'
```

⚠️ Verificar se todos os schemas funcionam (z.object, z.array, z.unknown, .passthrough, .default, .safeParse).

### 4.2 Instalar @nuxt/image

```bash
npx nuxt module add image
```

**`nuxt.config.ts`** — adicionar módulo e config:

```ts
modules: ['@nuxt/image', ...],
image: { provider: 'vercel', quality: 80, format: ['webp', 'avif'] },
```

### 4.3 Trocar img por NuxtImg no layout

**Arquivo**: `app/layouts/default.vue`

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

### 4.4 Favicon refresh

Gerar favicon moderno via realfavicongenerator.net. Adicionar links em `nuxt.config.ts` app.head.

---

## Fase 5 — Font preload

### 5.1 Configurar font preload

**Arquivo**: `nuxt.config.ts`

```ts
fonts: { families: [{ name: 'Plus Jakarta Sans', preload: true }] },
```

---

## Verificação

### Após cada fase

```bash
pnpm build && npx nuxt analyze
```

### Checklist final

- [ ] Lighthouse Mobile ≥95
- [ ] FCP ≤1.5s
- [ ] LCP ≤2.0s
- [ ] Main chunk ≤80KB
- [ ] Zero `<link rel="stylesheet">` no `<head>`
- [ ] Chart.js não no initial bundle
- [ ] Todos os componentes funcionando (zoom, pan, dates, etc)

---

## Arquivos modificados (resumo)

| Arquivo                                   | Fases      |
| ----------------------------------------- | ---------- |
| `nuxt.config.ts`                          | 1, 2, 4, 5 |
| `app/layouts/default.vue`                 | 1, 4       |
| `app/pages/index.vue`                     | 2          |
| `app/pages/performance/[[model]].vue`     | 2          |
| `app/pages/fixtures.vue`                  | 2          |
| `app/composables/useChartSetup.js`        | 3 (novo)   |
| `app/components/BaseLineChart.vue`        | 3 (novo)   |
| `app/components/bankrollEvolution.vue`    | 3          |
| `app/components/performanceChartCard.vue` | 3          |
| `app/plugins/chartjs.client.js`           | 3          |
| `app/utils/schemas.js`                    | 4          |
| `package.json`                            | 1, 3, 4    |
