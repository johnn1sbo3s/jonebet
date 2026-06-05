# DataPlay Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the ClickHouse-inspired dark design system with teal primary and blue secondary colors across the NuxtUI-based dashboard.

**Architecture:** Update CSS variables in `main.css`, override NuxtUI component themes in `app.config.ts`, and update individual components to use the new design tokens. The design follows `DESIGN.md` specifications.

**Tech Stack:** Nuxt 3, NuxtUI, Tailwind CSS, Inter font

---

## File Structure

| File | Responsibility |
|------|----------------|
| `app/assets/css/main.css` | CSS variables, animations, utility classes |
| `app/app.config.ts` | NuxtUI component theme overrides |
| `app/layouts/default.vue` | Header/navigation styling |
| `app/pages/index.vue` | Dashboard page layout |
| `app/components/*.vue` | Individual component updates |

---

## Task 1: Update CSS Variables & Animations

**Files:**
- Modify: `app/assets/css/main.css`

- [ ] **Step 1: Update main.css with design tokens**

```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;

  /* Colors - Canvas & Surface */
  --color-canvas: #0a0a0a;
  --color-surface-soft: #121212;
  --color-surface-card: #1a1a1a;
  --color-surface-elevated: #242424;

  /* Colors - Brand */
  --color-primary: #14B8A6;
  --color-primary-active: #0D9488;
  --color-primary-disabled: #1a2a2a;
  --color-secondary: #3B82F6;

  /* Colors - Borders */
  --color-hairline: #2a2a2a;
  --color-hairline-strong: #3a3a3a;

  /* Colors - Text */
  --color-text-on-dark: #ffffff;
  --color-text-body: #cccccc;
  --color-text-body-strong: #e6e6e6;
  --color-text-muted: #888888;
  --color-text-muted-soft: #5a5a5a;
  --color-text-on-primary: #0a0a0a;

  /* Colors - Semantic */
  --color-accent-emerald: #22c55e;
  --color-accent-rose: #ef4444;
  --color-accent-blue: #3B82F6;
  --color-warning: #F59E0B;

  /* Spacing */
  --spacing-section: 96px;
}

/* Animations */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(20, 184, 166, 0.3); }
  50% { box-shadow: 0 0 30px rgba(20, 184, 166, 0.5); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Utility Classes */
.animate-fade-in {
  animation: fade-in 300ms ease-out;
}

.skeleton-shimmer {
  background: linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #121212;
}

::-webkit-scrollbar-thumb {
  background: #3a3a3a;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4a4a4a;
}
```

- [ ] **Step 2: Verify CSS compiles**

Run: `pnpm dev`
Expected: Server starts without CSS errors

- [ ] **Step 3: Commit**

```bash
git add app/assets/css/main.css
git commit -m "feat: add design system CSS variables and animations"
```

---

## Task 2: Update app.config.ts for NuxtUI Theme

**Files:**
- Modify: `app/app.config.ts`

- [ ] **Step 1: Update app.config.ts with component overrides**

```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'teal',
      secondary: 'blue',
      neutral: 'slate'
    },
    container: {
      base: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
    },
    header: {
      root: 'bg-[#0a0a0a] border-b border-[#2a2a2a]'
    },
    card: {
      background: 'bg-[#1a1a1a]',
      border: 'border border-[#2a2a2a]',
      rounded: 'rounded-xl'
    },
    button: {
      base: 'cursor-pointer transition-all duration-150',
      primary: {
        solid: 'bg-[#14B8A6] hover:bg-[#0D9488] text-[#0a0a0a] font-semibold'
      },
      secondary: {
        solid: 'bg-[#1a1a1a] hover:bg-[#242424] border border-[#2a2a2a] text-white'
      }
    },
    alert: {
      info: {
        soft: 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#cccccc]'
      }
    },
    table: {
      wrapper: 'border border-[#2a2a2a] rounded-xl overflow-hidden',
      th: 'bg-[#121212] text-[#888888] text-xs uppercase tracking-wider',
      td: 'border-t border-[#2a2a2a] text-[#cccccc]'
    },
    skeleton: {
      background: 'bg-[#1a1a1a]'
    }
  }
})
```

- [ ] **Step 2: Verify config loads**

Run: `pnpm dev`
Expected: No config errors in terminal

- [ ] **Step 3: Commit**

```bash
git add app/app.config.ts
git commit -m "feat: update NuxtUI theme with dark design system"
```

---

## Task 3: Update Layout Header

**Files:**
- Modify: `app/layouts/default.vue`

- [ ] **Step 1: Update header styling**

```vue
<script setup>
const navItems = [
  [
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-grid',
      to: '/',
    },
    {
      label: 'Jogos do Dia',
      icon: 'i-lucide-calendar-days',
      to: '/fixtures',
    },
    {
      label: 'Apostas do Dia',
      icon: 'i-lucide-clipboard-list',
      to: '/daily-bets',
    },
    {
      label: 'Performance',
      icon: 'i-lucide-bar-chart-3',
      to: '/performance',
    },
    {
      label: 'Monitoramento',
      icon: 'i-lucide-inbox',
      to: '/batch-monitoring',
    },
  ],
]
</script>

<template>
  <UHeader class="bg-[#0a0a0a] border-b border-[#2a2a2a]">
    <template #title>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-chart-bar" class="text-[#14B8A6] w-6 h-6" />
        <span class="text-white font-bold text-lg tracking-tight">DataPlay</span>
      </div>
    </template>

    <UNavigationMenu
      :items="navItems"
      class="hidden xl:flex xl:justify-center"
      :ui="{ item: 'text-[#888888] hover:text-white', active: 'text-[#14B8A6] bg-[#1a1a1a] rounded-lg' }"
    />

    <template #right>
      <UNavigationMenu
        :items="navItems"
        class="hidden lg:flex xl:hidden"
        :ui="{ item: 'text-[#888888] hover:text-white', active: 'text-[#14B8A6] bg-[#1a1a1a] rounded-lg' }"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="navItems"
        orientation="vertical"
        class="-mx-2.5"
        :ui="{ item: 'text-[#888888] hover:text-white', active: 'text-[#14B8A6] bg-[#1a1a1a] rounded-lg' }"
      />
    </template>
  </UHeader>

  <UMain class="bg-[#0a0a0a]">
    <UContainer class="py-8">
      <NuxtPage />
    </UContainer>
  </UMain>
</template>
```

- [ ] **Step 2: Verify header renders**

Run: `pnpm dev`
Expected: Dark header with teal accent on active nav item

- [ ] **Step 3: Commit**

```bash
git add app/layouts/default.vue
git commit -m "feat: update layout header with dark theme"
```

---

## Task 4: Update Dashboard Page

**Files:**
- Modify: `app/pages/index.vue`

- [ ] **Step 1: Update page header and alert styling**

Replace the PageHeader and Alert sections with updated classes:

```vue
<template>
  <div class="flex flex-col gap-8">
    <div class="flex justify-between items-start">
      <PageHeader title="Bem-vindo(a) ao DataPlay!" />
    </div>

    <UAlert
      v-if="showAlert"
      color="warning"
      variant="soft"
      title="Atenção"
      close
      description="Apostas são para maiores de 18 anos e envolvem riscos financeiros. Aposte com responsabilidade e nunca arrisque mais do que pode perder."
      class="bg-[#291C0F] border border-[#F59E0B40] text-[#FCD34D]"
      :ui="{ description: 'text-[#FCD34D]' }"
      @update:open="showAlert = false"
    />

    <!-- Rest of the template remains the same -->
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/index.vue
git commit -m "feat: update dashboard page with dark theme styles"
```

---

## Task 5: Update Metrics Cards

**Files:**
- Modify: `app/components/metricsCard.vue`
- Modify: `app/components/yesterdayMetricsCard.vue`
- Modify: `app/components/yesterdayDetailsCard.vue`
- Modify: `app/components/rankingModels.vue`

- [ ] **Step 1: Update yesterdayMetricsCard.vue**

```vue
<template>
  <UCard class="w-full h-full bg-[#1a1a1a] border border-[#2a2a2a]">
    <template #header>
      <p class="font-semibold text-white">Métricas</p>
    </template>

    <template #default>
      <div class="flex justify-between">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="flex flex-col justify-center"
        >
          <p class="text-[#888888] text-sm">{{ item.name }}</p>

          <p
            class="text-xl font-black"
            :class="item.value >= 0 ? 'text-[#14B8A6]' : 'text-[#ef4444]'"
          >
            {{ item.value.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }} {{ item.sufix }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <p class="text-xs text-[#5a5a5a]">1 un = 1% da banca</p>
    </template>
  </UCard>
</template>

<script setup>
defineProps({
    items: {
        type: Array,
        required: true,
        default: () => []
    }
})
</script>
```

- [ ] **Step 2: Update yesterdayDetailsCard.vue**

```vue
<template>
  <UCard class="w-full h-full bg-[#1a1a1a] border border-[#2a2a2a]">
    <template #header>
      <p class="font-semibold text-white">Detalhes</p>
    </template>

    <template #default>
      <div class="flex flex-col gap-4">
        <div class="flex align-middle justify-between">
          <div class="text-[#cccccc]">Apostas</div>
          <div class="font-semibold text-white">{{ numberBets }}</div>
        </div>

        <div class="flex align-middle justify-between">
          <div class="text-[#cccccc]">Modelos com apostas</div>
          <div class="font-semibold text-white">{{ numberModels }}</div>
        </div>

        <div class="flex align-middle justify-between">
          <div class="text-[#cccccc]">Modelos positivos</div>
          <div class="font-semibold text-[#14B8A6]">{{ positiveModels }}</div>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
defineProps({
    numberModels: { type: Number, required: true, default: () => 0 },
    numberBets: { type: Number, required: true, default: () => 0 },
    positiveModels: { type: Number, required: true, default: () => 0 }
})
</script>
```

- [ ] **Step 3: Update rankingModels.vue**

Replace color classes in the template:
- `text-teal-600` → `text-[#14B8A6]`
- `text-red-600` → `text-[#ef4444]`
- `hover:text-teal-600` → `hover:text-[#14B8A6]`

- [ ] **Step 4: Commit**

```bash
git add app/components/yesterdayMetricsCard.vue app/components/yesterdayDetailsCard.vue app/components/rankingModels.vue
git commit -m "feat: update metric components with dark theme colors"
```

---

## Task 6: Update Chart Components

**Files:**
- Modify: `app/components/bankrollEvolution.vue`

- [ ] **Step 1: Update chart colors**

In `bankrollEvolution.vue`, update the chart configuration:

```typescript
const chartOptions = ref({
  // ... existing options
  plugins: {
    legend: {
      position: "top",
      display: true,
      labels: {
        color: '#cccccc'
      }
    },
    // ... rest of plugins
  },
  scales: {
    x: {
      ticks: { color: '#888888' },
      grid: { color: '#2a2a2a' }
    },
    y: {
      ticks: { color: '#888888' },
      grid: { color: '#2a2a2a' }
    }
  }
});

const chartData = computed(() => {
  // ... existing logic
  return {
    labels: labels,
    datasets: [{
      label: "Acúmulo de capital",
      data: data,
      borderColor: "#14B8A6",
      backgroundColor: "rgba(20, 184, 166, 0.1)",
      pointRadius: 3,
      pointHoverRadius: 7,
      fill: true,
      tension: 0.2,
    }],
  };
})
```

- [ ] **Step 2: Commit**

```bash
git add app/components/bankrollEvolution.vue
git commit -m "feat: update chart colors to match dark theme"
```

---

## Task 7: Update Remaining Components

**Files:**
- Modify: `app/components/batchCard.vue`
- Modify: `app/components/metricsCard.vue`

- [ ] **Step 1: Update batchCard.vue colors**

Replace:
- `hover:outline-teal-400` → `hover:outline-[#14B8A6]`
- `text-teal-600` → `text-[#14B8A6]`
- `text-red-600` → `text-[#ef4444]`
- `text-teal-500` → `text-[#14B8A6]`

Add dark background to card:
```vue
<UCard class="max-w-150 bg-[#1a1a1a] border border-[#2a2a2a] hover:cursor-pointer hover:outline hover:outline-[#14B8A6] group">
```

- [ ] **Step 2: Update metricsCard.vue colors**

Replace color classes with dark theme equivalents.

- [ ] **Step 3: Commit**

```bash
git add app/components/batchCard.vue app/components/metricsCard.vue
git commit -m "feat: update batch and metrics cards with dark theme"
```

---

## Task 8: Update Page Components

**Files:**
- Modify: `app/pages/daily-bets.vue`
- Modify: `app/pages/batch-monitoring.vue`

- [ ] **Step 1: Update daily-bets.vue table styling**

```vue
<UTable
  :ui="{
    wrapper: 'relative overflow-x-auto border border-[#2a2a2a] rounded-xl',
    th: 'bg-[#121212] text-[#888888] text-xs uppercase',
    td: 'border-t border-[#2a2a2a] text-[#cccccc]'
  }"
  :rows="bets"
  :columns="columns"
  :sort="sort"
  class="bg-[#1a1a1a]"
/>
```

- [ ] **Step 2: Update batch-monitoring.vue styling**

Apply similar dark theme classes to tables and cards.

- [ ] **Step 3: Commit**

```bash
git add app/pages/daily-bets.vue app/pages/batch-monitoring.vue
git commit -m "feat: update page components with dark theme"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run dev server**

```bash
pnpm dev
```

Expected: No errors, dark theme applied throughout

- [ ] **Step 2: Visual verification**

Check all pages:
- Dashboard (index.vue) - dark background, teal accents
- Jogos do Dia (fixtures.vue)
- Apostas do Dia (daily-bets.vue) - dark tables
- Performance
- Monitoramento (batch-monitoring.vue)

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete dark design system implementation"
```

---

## Summary

| Task | Files Modified | Description |
|------|----------------|-------------|
| 1 | main.css | CSS variables, animations |
| 2 | app.config.ts | NuxtUI theme overrides |
| 3 | default.vue | Header/navigation |
| 4 | index.vue | Dashboard page |
| 5 | yesterdayMetricsCard, yesterdayDetailsCard, rankingModels | Metric components |
| 6 | bankrollEvolution.vue | Chart colors |
| 7 | batchCard, metricsCard | Card components |
| 8 | daily-bets, batch-monitoring | Page components |
| 9 | - | Final verification |
