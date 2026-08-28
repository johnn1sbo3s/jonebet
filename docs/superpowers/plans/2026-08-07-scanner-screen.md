# Scanner Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Scanner" page to DataPlay Bets showing live games with the momentum chart, stat strength bars, a breathing glow for recent notifications, and a flip-to-back notification history.

**Architecture:** The page polls `SCANNER_SNAPSHOT_URL` (runtime config, default `https://scanner.jonebet.xyz/live.json`) every 60s and renders cards from the payload as-is (ordering comes pre-sorted from the backend). Pure helpers live in `app/utils/scanner.js`; SVG chart in `momentumChart.vue`; card (flip + glow + history) in `scannerCard.vue`.

**Tech Stack:** Nuxt 4 (SPA), Nuxt UI v4, Tailwind CSS v4, Vue 3 `<script setup>`, zod (safeParse), vitest + @nuxt/test-utils.

**Spec:** `docs/superpowers/specs/2026-08-07-scanner-screen-design.md` (payload contract owned by `momentum-scanner/docs/superpowers/specs/2026-08-07-live-snapshot-api-design.md` — do NOT redefine the schema here).

## Global Constraints

- **Repo hook (descoberto na execução):** o pre-commit (husky + lint-staged) roda `node scripts/check-arbitrary-values.cjs app/`, que REJEITA classes arbitrárias de font-size (`text-[11px]`) — use sempre a escala do Tailwind (`text-xs`=12px, `text-sm`=14px, `text-base`=16px) e o `text-2xs` custom do app (≈10px). O lint também proíbe comentários HTML no template e exige linha em branco entre elementos irmãos (ambos custom rules — `pnpm lint --fix` corrige o segundo).
- **Auto-imports de `~/utils`:** as páginas usam utils sem import (ex.: `safeParse`); o eslint conhece os globals via `nuxt prepare` — rode `pnpm postinstall` (ou `nuxt prepare`) após criar um util novo, senão o lint acusa `no-undef`.


- Payload field names are fixed by the backend spec: `generated_at`, `games[].{id, flashscore_url, league, home, away, score{home,away}, minute, status, momentum[{minute,home,away}], stats{xg,possession,shots,big_chances,box_touches}{home,away}, notifications[{rule,label,minute,at}]}`. `stats` values may be `null`; `momentum` may be `[]`.
- Card link uses `game.flashscore_url` from the payload (`.com/match/…`). Do NOT use the site's `flashscoreUrl()` helper (it builds `.com.br/jogo/…`) — payload wins.
- App is pt-BR hardcoded (no i18n) — literals in pt-BR, matching existing pages.
- Follow repo conventions: `safeParse` for payload validation, `USkeleton`/`rounded-2xl` card language, zinc/teal palette, `PageHeader` component.
- Tests: vitest, `// @vitest-environment nuxt` + `mountSuspended` for components, plain vitest for pure functions.

---

### Task 1: Pure helpers + schema entry + unit tests

**Files:**
- Create: `app/utils/scanner.js`
- Modify: `app/utils/schemas.js`
- Test: `tests/app/utils/scanner.spec.ts`

**Interfaces:**
- Produces:
  - `isRecentNotification(notifications: Array<{at: string}> | null | undefined, now?: number, windowMin?: number) -> boolean` — most recent notification (index 0) within `windowMin` minutes.
  - `formatUpdatedAgo(generatedAt: string | null | undefined, now?: number) -> string` — `"há 12s"` / `"há 1m 20s"`, `''` when unparseable.
  - `endpointSchemas.scannerSnapshot` in `schemas.js` (zod): `FlexObject.default({ generated_at: null, games: [] })`, fallback `{ generated_at: null, games: [] }`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/app/utils/scanner.spec.ts
import { describe, it, expect } from 'vitest'
import { isRecentNotification, formatUpdatedAgo } from '~/utils/scanner.js'

const AT = '2026-08-07T23:55:03-03:00'
const NOW = Date.parse('2026-08-07T23:59:03-03:00')

describe('isRecentNotification', () => {
  it('true quando a notificação mais recente está dentro de 5 min', () => {
    expect(isRecentNotification([{ at: AT }], NOW)).toBe(true)
  })

  it('false quando está fora da janela', () => {
    expect(isRecentNotification([{ at: '2026-08-07T23:45:03-03:00' }], NOW)).toBe(false)
  })

  it('false sem notificações ou com horário inválido', () => {
    expect(isRecentNotification([], NOW)).toBe(false)
    expect(isRecentNotification([{ at: 'nao-e-data' }], NOW)).toBe(false)
    expect(isRecentNotification(null, NOW)).toBe(false)
  })

  it('usa a primeira notificação (mais recente) do histórico', () => {
    // contrato do backend: histórico vem mais recente primeiro (índice 0)
    const list = [{ at: AT }, { at: '2026-08-07T23:50:03-03:00' }]
    expect(isRecentNotification(list, NOW)).toBe(true)
  })
})

describe('formatUpdatedAgo', () => {
  it('formata segundos e minutos', () => {
    expect(formatUpdatedAgo(AT, NOW)).toBe('há 4m 0s')
    expect(formatUpdatedAgo(AT, NOW - 12_000)).toBe('há 3m 48s')
  })

  it('retorna vazio sem horário válido', () => {
    expect(formatUpdatedAgo(null, NOW)).toBe('')
    expect(formatUpdatedAgo('x', NOW)).toBe('')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/app/utils/scanner.spec.ts`
Expected: FAIL — cannot find module `~/utils/scanner.js`

- [ ] **Step 3: Write the implementation**

```js
// app/utils/scanner.js
// Helpers da tela Scanner — dados do snapshot do momentum-scanner
// (scanner.jonebet.xyz/live.json). Funções puras, testáveis.

// Notificação "recente" = a mais recente do histórico dentro da janela (min).
export function isRecentNotification(notifications, now = Date.now(), windowMin = 5) {
  const latest = notifications?.[0]
  if (!latest?.at) return false
  const at = Date.parse(latest.at)
  if (Number.isNaN(at)) return false
  return now - at <= windowMin * 60_000
}

// "atualizado há 12s" / "há 1m 20s" a partir de generated_at (ISO).
export function formatUpdatedAgo(generatedAt, now = Date.now()) {
  if (!generatedAt) return ''
  const at = Date.parse(generatedAt)
  if (Number.isNaN(at)) return ''
  const seconds = Math.max(0, Math.floor((now - at) / 1000))
  if (seconds < 60) return `há ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `há ${minutes}m ${seconds % 60}s`
}
```

Add to `app/utils/schemas.js` — inside the `endpointSchemas` object (after `fixturesDaily`):

```js
  scannerSnapshot: {
    schema: FlexObject.default({ generated_at: null, games: [] }),
    fallback: { generated_at: null, games: [] },
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/app/utils/scanner.spec.ts`
Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
git add app/utils/scanner.js app/utils/schemas.js tests/app/utils/scanner.spec.ts
git commit -m "feat: add scanner snapshot helpers and schema"
```

---

### Task 2: Momentum chart + skeleton components

**Files:**
- Create: `app/components/momentumChart.vue`
- Create: `app/components/scannerSkeleton.vue`
- Test: `tests/app/components/momentumChart.spec.ts`

**Interfaces:**
- `MomentumChart` props: `bars: Array<{ minute: number, home: number, away: number }>` (default `[]`). Renders the SVG chart (viewBox `0 0 640 124`, center line `y=62`, max bar height 56, home up teal `#2dd4bf`, away down blue `#3b82f6`, tick labels 15/30/45/60/75/90) or a placeholder paragraph when empty.
- `ScannerSkeleton` — no props; grid of 6 `USkeleton` cards matching the page grid.

- [ ] **Step 1: Write the failing test**

```ts
// tests/app/components/momentumChart.spec.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MomentumChart from '~/components/momentumChart.vue'

describe('MomentumChart', () => {
  it('renderiza uma barra por minuto com dados', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 1, home: 0.5, away: 0 },
          { minute: 2, home: 0, away: 0.8 },
        ],
      },
    })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('rect')).toHaveLength(2)
  })

  it('mostra placeholder sem barras', async () => {
    const wrapper = await mountSuspended(MomentumChart, { props: { bars: [] } })
    expect(wrapper.text()).toContain('aguardando dados do gráfico')
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/app/components/momentumChart.spec.ts`
Expected: FAIL — cannot find module `~/components/momentumChart.vue`

- [ ] **Step 3: Write the components**

```vue
<!-- app/components/momentumChart.vue -->
<template>
  <div>
    <svg
      v-if="bars.length"
      viewBox="0 0 640 124"
      preserveAspectRatio="none"
      role="img"
      aria-label="Gráfico de momentum"
      class="w-full"
    >
      <line x1="0" y1="62" x2="640" y2="62" stroke="#3f3f46" stroke-width="1" />

      <rect
        v-for="b in bars"
        :key="b.minute"
        :x="(b.minute - 1) * (640 / 96)"
        :y="barY(b)"
        width="5"
        :height="barHeight(b)"
        rx="1.5"
        :fill="Number(b.home) > 0 ? '#2dd4bf' : '#3b82f6'"
        opacity="0.85"
      />

      <template v-for="t in TICKS" :key="t">
        <line :x1="(t - 1) * (640 / 96)" y1="58" :x2="(t - 1) * (640 / 96)" y2="66" stroke="#3f3f46" />
        <text :x="(t - 1) * (640 / 96)" y="120" font-size="9" fill="#52525b" text-anchor="middle">{{ t }}'</text>
      </template>
    </svg>

    <p v-else class="py-6 text-center text-xs text-zinc-500">aguardando dados do gráfico</p>
  </div>
</template>

<script setup>
const props = defineProps({
  bars: { type: Array, default: () => [] },
})

const TICKS = [15, 30, 45, 60, 75, 90]
const CENTER = 62

function barHeight(b) {
  return Math.max(Number(b.home) || 0, Number(b.away) || 0) * 56
}

function barY(b) {
  return Number(b.home) > 0 ? CENTER - barHeight(b) : CENTER
}
</script>
```

```vue
<!-- app/components/scannerSkeleton.vue -->
<template>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
    <USkeleton v-for="i in 6" :key="i" class="h-72 rounded-2xl" />
  </div>
</template>

<script setup></script>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/app/components/momentumChart.spec.ts`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add app/components/momentumChart.vue app/components/scannerSkeleton.vue tests/app/components/momentumChart.spec.ts
git commit -m "feat: add momentum chart and scanner skeleton components"
```

---

### Task 3: Scanner card (flip, glow, actions, history)

**Files:**
- Create: `app/components/scannerCard.vue`
- Test: `tests/app/components/scannerCard.spec.ts`

**Interfaces:**
- Consumes: `MomentumChart` (Task 2), `isRecentNotification` (Task 1).
- `ScannerCard` props: `game: Object` (one payload game, shape per backend spec). Emits nothing.

- [ ] **Step 1: Write the failing test**

```ts
// tests/app/components/scannerCard.spec.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ScannerCard from '~/components/scannerCard.vue'

// Relativo ao relógio real: sempre "recente" (1 min atrás) em qualquer horário.
const RECENT = new Date(Date.now() - 60_000).toISOString()

function game(notifications = [], momentum = [{ minute: 1, home: 0.5, away: 0 }]) {
  return {
    id: 'abc123',
    flashscore_url: 'https://www.flashscore.com/match/abc123/',
    league: 'Brasileirão',
    home: 'Palmeiras',
    away: 'Flamengo',
    score: { home: 2, away: 1 },
    minute: 65,
    status: "65'",
    momentum,
    stats: {
      xg: { home: 1.8, away: 1.2 },
      possession: { home: 58, away: 42 },
      shots: { home: 14, away: 9 },
      big_chances: { home: 3, away: 2 },
      box_touches: { home: 11, away: 7 },
    },
    notifications,
  }
}

describe('ScannerCard', () => {
  it('renderiza times, placar, minuto e stats', async () => {
    const wrapper = await mountSuspended(ScannerCard, { props: { game: game() } })
    expect(wrapper.text()).toContain('Palmeiras')
    expect(wrapper.text()).toContain('Flamengo')
    expect(wrapper.text()).toContain('2 - 1')
    expect(wrapper.text()).toContain("65'")
    expect(wrapper.text()).toContain('POSSE')
  })

  it('aplica glow quando a notificação mais recente está na janela', async () => {
    const wrapper = await mountSuspended(ScannerCard, {
      props: {
        game: game([{ rule: 'regra_jogo_quente', label: 'Jogo quente', minute: 62, at: RECENT }]),
      },
    })
    expect(wrapper.find('.glow-card').exists()).toBe(true)
  })

  it('sem glow e com verso vazio quando não há notificações', async () => {
    const wrapper = await mountSuspended(ScannerCard, { props: { game: game([]) } })
    expect(wrapper.find('.glow-card').exists()).toBe(false)
    expect(wrapper.text()).toContain('Sem notificações neste jogo ainda')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/app/components/scannerCard.spec.ts`
Expected: FAIL — cannot find module `~/components/scannerCard.vue`

- [ ] **Step 3: Write the component**

```vue
<!-- app/components/scannerCard.vue -->
<template>
  <div class="cursor-pointer [perspective:1200px]" @click="flipped = !flipped">
    <div
      class="relative transition-transform duration-500 [transform-style:preserve-3d]"
      :class="{ '[transform:rotateY(180deg)]': flipped }"
    >
      <!-- frente -->
      <div
        class="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 [backface-visibility:hidden]"
        :class="{ 'glow-card': isRecent }"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="text-2xs font-semibold tracking-wide text-zinc-500 uppercase">{{ game.league }}</span>

          <div class="flex items-center gap-1.5">
            <button
              class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-teal-400 hover:text-teal-400"
              :title="copied ? 'Copiado!' : 'Copiar link'"
              @click.stop="copyLink"
            >
              <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="h-3.5 w-3.5" />
            </button>

            <a
              class="flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1.5 text-xs font-semibold text-zinc-400 hover:border-teal-400 hover:text-teal-400"
              :href="game.flashscore_url"
              target="_blank"
              rel="noopener"
              @click.stop
            >
              Flashscore <UIcon name="i-lucide-arrow-up-right" class="h-3 w-3" />
            </a>
          </div>
        </div>

        <div class="mb-2.5 flex items-center gap-2 text-sm font-semibold">
          <span class="text-zinc-100">{{ game.home }}</span>
          <span class="text-base font-bold text-zinc-100">{{ game.score.home }} - {{ game.score.away }}</span>
          <span class="text-zinc-400">{{ game.away }}</span>
          <span class="ml-auto rounded-full border border-teal-500/25 bg-teal-500/10 px-1.5 py-0.5 text-xs font-bold text-teal-400">{{ game.minute }}'</span>
        </div>

        <MomentumChart :bars="game.momentum" class="mb-3" />

        <div class="mt-auto flex flex-col gap-2">
          <div v-for="row in statRows" :key="row.label" class="flex flex-col gap-0.5">
            <div class="flex items-baseline justify-between text-xs">
              <span class="font-bold text-zinc-200">{{ row.home }}</span>
              <span class="text-2xs tracking-wide text-zinc-500 uppercase">{{ row.label }}</span>
              <span class="font-bold text-zinc-200">{{ row.away }}</span>
            </div>
            <div class="flex h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div v-if="row.pctHome !== null" class="bg-teal-400" :style="{ width: row.pctHome + '%' }"></div>
              <div v-if="row.pctHome !== null" class="bg-blue-500" :style="{ width: 100 - row.pctHome + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- verso: histórico de notificações -->
      <div class="absolute inset-0 flex flex-col overflow-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <div class="mb-2.5 flex items-center justify-between">
          <span class="flex items-center gap-1.5 text-sm font-bold">
            <UIcon name="i-lucide-bell" class="text-teal-400" /> Notificações
          </span>
          <button
            class="rounded-lg border border-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-400 hover:border-teal-400 hover:text-teal-400"
            @click.stop="flipped = false"
          >
            ← Voltar
          </button>
        </div>

        <div v-if="game.notifications?.length" class="flex flex-col gap-1.5">
          <div
            v-for="(n, i) in game.notifications"
            :key="i"
            class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-xs"
          >
            <UIcon name="i-lucide-bell" class="shrink-0 text-teal-400" />
            <span class="flex-1 font-semibold text-zinc-200">{{ n.label }}</span>
            <span class="rounded-full bg-teal-500/10 px-1.5 py-0.5 text-2xs font-bold text-teal-400">{{ n.minute }}'</span>
            <span class="text-xs whitespace-nowrap text-zinc-500">{{ formatTime(n.at) }}</span>
          </div>
        </div>

        <p v-else class="mt-auto py-4 text-center text-xs text-zinc-600">Sem notificações neste jogo ainda</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { isRecentNotification } from '~/utils/scanner.js'

const props = defineProps({
  game: { type: Object, required: true },
})

const STAT_LABELS = [
  ['xg', 'XG'],
  ['possession', 'POSSE'],
  ['shots', 'FINALIZAÇÕES'],
  ['big_chances', 'CHANCES CLARAS'],
  ['box_touches', 'TOQUES NA ÁREA'],
]

const flipped = ref(false)
const copied = ref(false)
let copyTimer

const isRecent = computed(() => isRecentNotification(props.game.notifications))

const statRows = computed(() =>
  STAT_LABELS.map(([key, label]) => {
    const pair = props.game.stats?.[key] || {}
    const home = pair.home
    const away = pair.away
    const total = (Number(home) || 0) + (Number(away) || 0)
    return {
      label,
      home: home ?? '—',
      away: away ?? '—',
      pctHome: total > 0 ? ((Number(home) || 0) / total) * 100 : null,
    }
  }),
)

function formatTime(at) {
  return new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.game.flashscore_url)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 2000)
  } catch {
    // clipboard indisponível — mantém o estado atual
  }
}

onUnmounted(() => clearTimeout(copyTimer))
</script>

<style scoped>
.glow-card {
  border-color: rgba(45, 212, 191, 0.75);
  animation: glow-breathe 2.6s ease-in-out infinite;
}

@keyframes glow-breathe {
  0%,
  100% {
    box-shadow: 0 0 8px rgba(45, 212, 191, 0.14), 0 0 2px rgba(45, 212, 191, 0.2);
  }

  50% {
    box-shadow: 0 0 26px rgba(45, 212, 191, 0.38), 0 0 6px rgba(45, 212, 191, 0.3);
  }
}
</style>
```

Note: `text-2xs` is used by existing components (`fixtureCard.vue`); keep it. `[backface-visibility:hidden]` arbitrary property syntax requires the class to be applied on BOTH faces (front and back) and `[transform-style:preserve-3d]` on the rotating wrapper — as above.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/app/components/scannerCard.spec.ts`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add app/components/scannerCard.vue tests/app/components/scannerCard.spec.ts
git commit -m "feat: add scanner card with flip, glow and notification history"
```

---

### Task 4: Scanner page + nav + runtime config

**Files:**
- Create: `app/pages/scanner.vue`
- Modify: `app/layouts/default.vue` (nav item)
- Modify: `nuxt.config.ts` (runtime config)

**Interfaces:**
- Consumes: `PageHeader`, `ScannerCard`, `ScannerSkeleton` (Task 2/3), `safeParse('scannerSnapshot', …)` (Task 1), `formatUpdatedAgo` (Task 1).
- `nuxt.config.ts` gains `runtimeConfig.public.SCANNER_SNAPSHOT_URL` (default `https://scanner.jonebet.xyz/live.json`).

- [ ] **Step 1: Add the nav item and runtime config**

`app/layouts/default.vue` — inside `navItems` (first array, after `Jogos do Dia`):

```js
    {
      label: 'Scanner',
      icon: 'i-lucide-activity',
      to: '/scanner',
    },
```

`nuxt.config.ts` — inside `runtimeConfig.public`:

```ts
      SCANNER_SNAPSHOT_URL: 'https://scanner.jonebet.xyz/live.json',
```

- [ ] **Step 2: Write the page**

```vue
<!-- app/pages/scanner.vue -->
<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="Scanner ao vivo">
      <template #right>
        <div class="ml-auto flex items-center gap-2 text-xs text-zinc-400">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-teal-400"></span>
          </span>
          <span>atualizado {{ updatedAgo }}</span>
          <span class="text-zinc-600">·</span>
          <span>{{ games.length }} jogos</span>
          <span v-if="offline" class="text-zinc-600">· sem conexão</span>
        </div>
      </template>
    </PageHeader>

    <ScannerSkeleton v-if="loading && !snapshot" />

    <div
      v-else-if="fetchError && !snapshot"
      class="rounded-2xl border border-zinc-800 bg-zinc-900 py-16 text-center text-sm text-zinc-500"
    >
      Não foi possível carregar os jogos ao vivo. Tente novamente em instantes.
    </div>

    <div v-else-if="games.length === 0" class="py-16 text-center text-sm text-zinc-500">
      Nenhum jogo ao vivo agora
    </div>

    <div v-else class="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
      <ScannerCard v-for="game in games" :key="game.id" :game="game" />
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()

const snapshot = ref(null)
const loading = ref(true)
const fetchError = ref(false)
const offline = ref(false)
const updatedAgo = ref('')

let inFlight = false
let pollTimer
let tickTimer

const games = computed(() => snapshot.value?.games || [])

async function loadSnapshot() {
  if (inFlight) return
  inFlight = true
  try {
    const data = await $fetch(config.public.SCANNER_SNAPSHOT_URL)
    snapshot.value = safeParse('scannerSnapshot', data)
    fetchError.value = false
    offline.value = false
  } catch {
    fetchError.value = true
    offline.value = true
  } finally {
    inFlight = false
    loading.value = false
  }
}

function tick() {
  updatedAgo.value = formatUpdatedAgo(snapshot.value?.generated_at)
}

onMounted(() => {
  loadSnapshot()
  pollTimer = setInterval(loadSnapshot, 60_000)
  tickTimer = setInterval(tick, 1000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  clearInterval(tickTimer)
})
</script>
```

Note: `safeParse`, `computed`, `ref`, `onMounted`, `onUnmounted` are auto-imported by Nuxt — no imports needed in the script.

- [ ] **Step 3: Verify the page compiles**

Run: `pnpm lint` (only the changed files if eslint is fast; full run otherwise)
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add app/pages/scanner.vue app/layouts/default.vue nuxt.config.ts
git commit -m "feat: add scanner page with live snapshot polling"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `pnpm vitest run`
Expected: all specs pass (8 existing component specs + new scanner/momentumChart/card specs)

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: build succeeds with the new page

- [ ] **Step 3: Manual smoke test with local sample data**

Create a temp dir with the snapshot sample (2 games, one with a recent notification so the glow shows):

```bash
mkdir -p /tmp/scanner-mock && cat > /tmp/scanner-mock/live.json <<'EOF'
{
  "generated_at": "2026-08-07T23:59:03-03:00",
  "games": [
    {
      "id": "demo2", "flashscore_url": "https://www.flashscore.com/match/demo2/",
      "league": "Brasileirão", "home": "Cruzeiro", "away": "Atlético-MG",
      "score": { "home": 0, "away": 0 }, "minute": 30, "status": "30'",
      "momentum": [ { "minute": 1, "home": 0.1, "away": 0.9 }, { "minute": 2, "home": 0.5, "away": 0.0 } ],
      "stats": { "xg": { "home": 0.4, "away": 0.6 }, "possession": { "home": 45, "away": 55 },
                 "shots": { "home": 4, "away": 6 }, "big_chances": { "home": 0, "away": 2 },
                 "box_touches": { "home": 5, "away": 7 } },
      "notifications": []
    },
    {
      "id": "demo1", "flashscore_url": "https://www.flashscore.com/match/demo1/",
      "league": "Brasileirão", "home": "Palmeiras", "away": "Flamengo",
      "score": { "home": 2, "away": 1 }, "minute": 65, "status": "65'",
      "momentum": [ { "minute": 1, "home": 0.6, "away": 0.0 }, { "minute": 2, "home": 0.0, "away": 0.4 } ],
      "stats": { "xg": { "home": 1.8, "away": 1.2 }, "possession": { "home": 58, "away": 42 },
                 "shots": { "home": 14, "away": 9 }, "big_chances": { "home": 3, "away": 2 },
                 "box_touches": { "home": 11, "away": 7 } },
      "notifications": [
        { "rule": "regra_jogo_quente", "label": "Jogo quente", "minute": 62, "at": "2026-08-07T23:55:03-03:00" }
      ]
    }
  ]
}
EOF
python3 -m http.server 8777 --directory /tmp/scanner-mock &
```

Run the dev server pointing at the mock:

```bash
NUXT_PUBLIC_SCANNER_SNAPSHOT_URL=http://localhost:8777/live.json pnpm dev
```

Expected (navigate to `http://localhost:3000/scanner`):
- Palmeiras card sorted after Cruzeiro (backend order is preserved as-is);
- Palmeiras card has the breathing glow (notification 4 min old), Cruzeiro does not;
- click Palmeiras card → flips; back shows "Jogo quente · 62' · 23:55"; "← Voltar" unflips;
- copy button copies the flashscore URL and shows the check icon;
- "atualizado há Xs" ticks every second; grid collapses 3→2→1 columns when resizing;
- stop the mock server (`kill %1`) → header shows "sem conexão", cards stay.

- [ ] **Step 4: Commit any fix-ups**

If the smoke test found issues, fix them in the owning component, re-run `pnpm vitest run` + `pnpm build`, and commit with a descriptive message.

---

## Self-Review Notes

- Spec coverage: header/right status + tick → Task 4; auto-fit grid + skeleton → Tasks 2/4; card top/actions/teams/chart/stats → Task 3; glow window (pure fn) → Task 1 + Task 3; flip + history + empty states → Task 3; polling 60s + keep-last-on-error → Task 4; nav + runtime config → Task 4. Payload schema deliberately not redefined — `scannerSnapshot` schema is permissive like the other endpoints.
- No placeholders: every component and test file is fully written; only the two test helpers referenced from existing files (`_match`/`_state` in the scanner repo's tests, `FakeExtractor` body) are pointed at rather than duplicated, and those references are exact.
- Type consistency: `isRecentNotification(notifications, now, windowMin)` and `formatUpdatedAgo(generatedAt, now)` signatures match between Task 1 and their call sites (Task 3/4); `ScannerCard` prop `game` shape matches the payload fields consumed (`game.stats[key].home`, `game.notifications[0].at`, `game.flashscore_url`).
