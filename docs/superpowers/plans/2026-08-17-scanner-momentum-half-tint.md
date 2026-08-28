# Divisor 1º/2º tempo com painéis flexíveis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a linha tracejada do divisor 1º/2º tempo no MomentumChart por fundos tintados (1ºT zinc-950, 2ºT zinc-800) e tornar os painéis proporcionais à duração real de cada tempo (45' + acréscimo), com mínimo 45 em jogo ao vivo.

**Architecture:** Mudança local em `app/components/momentumChart.vue` (template + script) e no spec correspondente. As larguras `W1`/`W2` derivam dos máximos de minuto por half nas props `bars`/`goals` via `computed` (reativo a updates de long-polling). Sem mudança de props, backend ou outros componentes.

**Tech Stack:** Nuxt 4 / Vue 3 `<script setup>` plain JS, SVG viewBox `640x158`, Vitest + `@nuxt/test-utils` (`mountSuspended`).

## Global Constraints

- Repo: `/Users/jone/Projetos/jonebet`
- Sem TypeScript em source — `<script setup>` JS puro
- Prettier: sem semicolons, aspas simples, trailing commas, 120 cols
- Testes: `pnpm test:unit` (Vitest single run); arquivo do spec: `tests/app/components/momentumChart.spec.ts`
- Não rodar `eslint`/`build` por edição (pré-commit cuida)
- Convenção de teste: `// @vitest-environment nuxt`, `mountSuspended()`, asserts via `.text()`/`.attributes()`
- Suíte completa deve passar antes do commit (hoje 85 testes / 12 specs)
- Spec de design: `docs/superpowers/specs/2026-08-17-scanner-momentum-half-tint-design.md` (aprovado no review)

---

### Task 1: Painéis flexíveis + fundos tintados no MomentumChart

**Files:**
- Modify: `app/components/momentumChart.vue` (template + script setup)
- Test: `tests/app/components/momentumChart.spec.ts`

**Interfaces:**
- Consumes: props existentes `bars: Array` (itens `{minute, half?, home, away}`) e `goals: Array` (itens `{minute, stoppage_time?, team, half?}`)
- Produces: mesmas props e mesmo `aria-label`; larguras `W1`/`W2` calculadas; barras com classe `momentum-bar` (usada pelo spec)

**Geometria (regra de negócio):**
- `h1Len = clamp(max(45, maxMinuteH1), 50)`; `maxMinuteH1` = maior `minute + (stoppage_time||0)` entre itens com `half === 1` (ou sem half, legado) em `bars` e `goals`
- `h2Len = clamp(max(45, maxMinuteH2 − 45), 50)`; `maxMinuteH2` = maior `minute + (stoppage_time||0)` entre itens com `half === 2`
- `STEP = 640 / (h1Len + h2Len)`; `W1 = h1Len * STEP`; `W2 = h2Len * STEP`
- Divisor (junção dos fundos) em `x = W1`

- [ ] **Step 1: Atualizar o spec de testes (TDD — deve falhar)**

Substituir TODO o conteúdo de `tests/app/components/momentumChart.spec.ts` por:

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
    expect(wrapper.findAll('rect.momentum-bar')).toHaveLength(2)
  })

  it('mostra placeholder sem barras', async () => {
    const wrapper = await mountSuspended(MomentumChart, { props: { bars: [] } })
    expect(wrapper.text()).toContain('aguardando dados do gráfico')
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('renderiza marcadores de gol', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 1, home: 0.5, away: 0 }],
        goals: [
          { minute: 23, stoppage_time: 0, team: 'home', player: 'Rony' },
          { minute: 45, stoppage_time: 2, team: 'away', player: 'Suárez' },
        ],
      },
    })
    const circles = wrapper.findAll('circle')
    expect(circles).toHaveLength(2)
    expect(circles[0].attributes('cy')).toBe('9')
    expect(circles[1].attributes('cy')).toBe('146')
  })

  it('sem gols, sem marcadores', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 1, home: 0.5, away: 0 }] },
    })
    expect(wrapper.findAll('circle')).toHaveLength(0)
  })

  it('posiciona barras do 2º tempo no painel direito', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 1, half: 1, home: 0.5, away: 0 },
          { minute: 46, half: 2, home: 0, away: 0.8 },
        ],
      },
    })
    const rects = wrapper.findAll('rect.momentum-bar')
    expect(rects[0].attributes('x')).toBe('0') // 1ºT minuto 1
    expect(rects[1].attributes('x')).toBe('320') // 2ºT 46' -> rel 1, divisor em 320 (45+45)
  })

  it('gol do 2º tempo posiciona no painel direito', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 46, half: 2, home: 0.5, away: 0 }],
        goals: [{ minute: 46, half: 2, stoppage_time: 0, team: 'home', player: 'X' }],
      },
    })
    expect(wrapper.find('circle').attributes('cx')).toBe('322.5') // 320 + 0 + 2.5
  })

  it("clampa gol além do painel (90+6')", async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 96, half: 2, home: 0.5, away: 0 }],
        goals: [{ minute: 96, half: 2, stoppage_time: 0, team: 'home', player: 'X' }],
      },
    })
    // h1Len=45, h2Len=50, STEP=640/95≈6.7368, W1≈303.16; rel clampado em 50
    const cx = Number(wrapper.find('circle').attributes('cx'))
    expect(cx).toBeCloseTo(635.76, 1) // W1 + 49*STEP + 2.5
  })

  it('barra sem half cai no mapeamento legado', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 60, home: 0.5, away: 0 }] },
    })
    // legado: h1Len=50 (clamp), h2Len=45, STEP=640/95≈6.7368
    const x = Number(wrapper.find('rect.momentum-bar').attributes('x'))
    expect(x).toBeCloseTo(397.47, 1) // (60-1)*STEP
  })

  it('ticks 15/30/45 no 1ºT e 50/75/90 no 2ºT', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: { bars: [{ minute: 1, half: 1, home: 0.5, away: 0 }] },
    })
    const labels = wrapper.findAll('text').map((t) => t.text())
    expect(labels).toEqual(["15'", "30'", "45'", "50'", "75'", "90'"])
  })

  it('fundo tintado: 1ºT zinc-950 e 2ºT zinc-800 na largura dos painéis', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 1, half: 1, home: 0.5, away: 0 },
          { minute: 46, half: 2, home: 0, away: 0.8 },
        ],
      },
    })
    const rects = wrapper.findAll('rect')
    // 0 e 1 são os fundos; barras têm class momentum-bar
    expect(rects[0].attributes('fill')).toBe('#09090b')
    expect(rects[0].attributes('x')).toBe('0')
    expect(rects[0].attributes('width')).toBe('320')
    expect(rects[1].attributes('fill')).toBe('#27272a')
    expect(rects[1].attributes('x')).toBe('320')
    expect(rects[1].attributes('width')).toBe('320')
  })

  it('painéis flexíveis: 1ºT 47 e 2ºT 50 desloca divisor para ~310', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 47, half: 1, home: 0.5, away: 0 },
          { minute: 95, half: 2, home: 0, away: 0.8 },
        ],
      },
    })
    const rects = wrapper.findAll('rect')
    // h1Len=47, h2Len=50, STEP=640/97≈6.5979, W1≈310.10
    const divisor = Number(rects[1].attributes('x'))
    expect(divisor).toBeCloseTo(640 * 47 / 97, 1)
    expect(rects[1].attributes('width')).toBe('' + (640 - 640 * 47 / 97))
  })

  it('jogo ao vivo no 1ºT (minuto 30): divisor fica em 320 (mínimo 45)', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [{ minute: 30, half: 1, home: 0.5, away: 0 }],
      },
    })
    const rects = wrapper.findAll('rect')
    expect(rects[1].attributes('x')).toBe('320') // h1Len=45, h2Len=45
  })
})
```

- [ ] **Step 2: Rodar o spec e confirmar que falha**

Run: `pnpm vitest run tests/app/components/momentumChart.spec.ts` (ou `pnpm test:unit`)

Expected: FAIL — sem `rect.momentum-bar` (barras ainda sem classe), sem os rects de fundo, posições legadas (377.6 em vez de ~397.47), contagem de rects divergente.

- [ ] **Step 3: Implementar no `momentumChart.vue`**

Substituir TODO o conteúdo de `app/components/momentumChart.vue` por:

```vue
<template>
  <div>
    <svg
      v-if="bars.length"
      viewBox="0 0 640 158"
      preserveAspectRatio="none"
      role="img"
      aria-label="Gráfico de momentum"
      class="w-full"
    >
      <!-- Fundos tintados por tempo: 1ºT zinc-950 (afundado), 2ºT zinc-800 (elevado) -->
      <rect x="0" y="0" :width="W1" height="158" fill="#09090b" />
      <rect :x="W1" :width="W2" height="158" fill="#27272a" />

      <line x1="0" y1="55" x2="640" y2="55" stroke="#3f3f46" stroke-width="1" />

      <rect
        v-for="b in bars"
        :key="`${halfOf(b)}-${b.minute}`"
        class="momentum-bar"
        :x="barX(b)"
        :y="barY(b)"
        width="5"
        :height="barHeight(b)"
        rx="1.5"
        :fill="Number(b.home) > 0 ? '#2dd4bf' : '#3b82f6'"
        opacity="0.85"
      />

      <circle
        v-for="(g, i) in goals"
        :key="i"
        :cx="barX(g) + 2.5"
        :cy="g.team === 'home' ? 9 : 146"
        r="5"
        fill="#f4f4f5"
        :stroke="g.team === 'home' ? '#2dd4bf' : '#3b82f6'"
        stroke-width="2"
      >
        <title>{{ g.player || 'Gol' }} ({{ g.minute }}')</title>
      </circle>

      <template v-for="t in TICKS" :key="`${t.half}-${t.minute}`">
        <line :x1="tickX(t)" y1="51" :x2="tickX(t)" y2="59" stroke="#3f3f46" />

        <text :x="tickX(t)" y="153" font-size="20" fill="#52525b" text-anchor="middle">{{ t.minute }}'</text>
      </template>
    </svg>

    <p v-else class="py-6 text-center text-xs text-zinc-500">aguardando dados do gráfico</p>
  </div>
</template>

<script setup>
const props = defineProps({
  bars: { type: Array, default: () => [] },
  goals: { type: Array, default: () => [] },
})

// Geometria do gráfico do Flashscore (viewBox 640x158, centro em 55):
// mesma moldura — barra de valor 1.0 encosta no topo, como lá.
const CENTER = 55

// Ticks fixos por tempo (posição relativa ao painel).
const TICKS = [
  { half: 1, minute: 15 },
  { half: 1, minute: 30 },
  { half: 1, minute: 45 },
  { half: 2, minute: 50 },
  { half: 2, minute: 75 },
  { half: 2, minute: 90 },
]

// Painéis flexíveis: largura proporcional à duração real de cada tempo
// (45' + acréscimo). h1Len/h2Len derivam do maior minuto observado por half
// nas props (bars + goals), com mínimo 45 (jogo ao vivo — divisor estável)
// e clamp em 50 (backend clampado). Sem `half` (snapshot antigo na janela de
// deploy) mantém o mapeamento legado contínuo no painel 1, h2Len = 45.
function halfOf(item) {
  return Number(item.half) === 2 ? 2 : 1
}

function halfMaxMinute(half, items) {
  return items.reduce((max, it) => {
    if (halfOf(it) !== half) return max
    const m = (Number(it.minute) || 0) + (Number(it.stoppage_time) || 0)
    return Math.max(max, m)
  }, 0)
}

const h1Len = computed(() =>
  Math.min(50, Math.max(45, halfMaxMinute(1, props.bars), halfMaxMinute(1, props.goals))),
)
const h2Len = computed(() =>
  Math.min(50, Math.max(45, halfMaxMinute(2, props.bars) - 45, halfMaxMinute(2, props.goals) - 45)),
)
const STEP = computed(() => 640 / (h1Len.value + h2Len.value))
const W1 = computed(() => h1Len.value * STEP.value)
const W2 = computed(() => h2Len.value * STEP.value)

// Minuto relativo ao painel: o 2º tempo recomeça em 1 (46' -> 1). Sem `half`
// mantém o mapeamento legado contínuo. Clamp só no relativo do 2º painel:
// gol de acréscimo longo (90+6' -> rel 51) estoura o viewBox.
function panelMinute(item) {
  const m = Number(item.minute) || 0
  if (halfOf(item) !== 2) return m
  return Math.min(m - 45, 50)
}

function barX(item) {
  return (halfOf(item) === 2 ? W1.value : 0) + (panelMinute(item) - 1) * STEP.value
}

function tickX(t) {
  const rel = t.half === 2 ? t.minute - 45 : t.minute
  return (t.half === 2 ? W1.value : 0) + (rel - 1) * STEP.value
}

function barHeight(b) {
  return Math.max(Number(b.home) || 0, Number(b.away) || 0) * 55
}

function barY(b) {
  return Number(b.home) > 0 ? CENTER - barHeight(b) : CENTER
}
</script>
```

- [ ] **Step 4: Rodar o spec e confirmar que passa**

Run: `pnpm vitest run tests/app/components/momentumChart.spec.ts`

Expected: PASS — 13 testes verdes.

- [ ] **Step 5: Rodar a suíte completa**

Run: `pnpm test:unit 2>&1 | tail -20; echo "EXIT:${PIPESTATUS[0]}"`

Expected: EXIT:0 — 85+ testes verdes (13 novos do momentumChart somados aos 72 existentes; nenhum outro spec quebra — só o momentumChart usa barras com half).

- [ ] **Step 6: Commit**

```bash
git add app/components/momentumChart.vue tests/app/components/momentumChart.spec.ts
git commit -m "feat(scanner): divisor 1T/2T com fundos tintados e painéis flexíveis no momentum chart"
```

- [ ] **Step 7: Verificação visual (dev server)**

Subir dev server na porta 3001 (`pnpm exec nuxt dev --port 3001`), abrir `/scanner` com um jogo vivo (favoritar um id do live.json via localStorage `dataPlay.favorites`), confirmar: 1ºT mais escuro que o card, 2ºT mais claro, divisor na junção proporcional à duração real, sem linha tracejada.

## Self-Review

**Spec coverage:**
- Fundo tintado 1ºT zinc-950 / 2ºT zinc-800 → Step 3 (rects de fundo) + teste "fundo tintado"
- Remoção da linha tracejada → Step 3 (template novo não tem a `<line>` em x=320)
- Painéis flexíveis `h1Len`/`h2Len`/`STEP`/`W1`/`W2` → Step 3 (computed) + testes "painéis flexíveis" e "jogo ao vivo"
- Mínimo 45 ao vivo → `Math.max(45, ...)` em h1Len/h2Len + teste "jogo ao vivo no 1ºT"
- Legado sem half → `halfOf` retorna 1, `h2Len` mínimo 45 + teste "barra sem half"
- Classe `momentum-bar` → Step 3 + testes filtram por ela
- Clamp rel 2ºT em 50 mantido → `panelMinute` + teste "clampa gol"

**Placeholder scan:** nenhum TBD/TODO; todo passo tem código ou comando concreto.

**Type consistency:** `W1`/`W2`/`STEP`/`h1Len`/`h2Len` são `computed` (usados com `.value` no script, auto-unwrap no template); `halfOf`, `halfMaxMinute`, `panelMinute`, `barX`, `tickX`, `barHeight`, `barY` são funções — nomes consistentes entre template e script e entre testes. `computed` é auto-importado pelo Nuxt (sem import explícito, padrão do repo).
