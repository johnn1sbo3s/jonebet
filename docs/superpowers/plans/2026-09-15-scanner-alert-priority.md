# Scanner alert priority Implementation Plan

> **For agentic workers:** implement this plan task-by-task with a fresh subagent per task (or `unlazy` gates for critical work). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Item com chute + alerta no gráfico de momentum desenha o losango âmbar em vez da bolinha do chute.

**Architecture:** `buildTracks` expõe `hasAlerts` por item (derivado dos grupos fundidos); o template do `momentumChart.vue` exige `!hasAlerts` no ramo da bolinha, deixando o `v-else` do losango assumir. Mesma trilha, mesmo `+N`, mesmo popover.

**Tech Stack:** Nuxt 4, Vue SFC, Vitest + happy-dom (`mountSuspended` para componente).

## Global Constraints

- Zero mudança de backend/VPS.
- Gol intocado: trilha `goal` própria, fora da disputa.
- Popover inalterado: chutes primeiro, alertas depois.
- `winner` do `groupIncidents` não é consumido pelo chart — não mexer.
- Sem classes arbitrárias de font-size no template (regra do pre-commit); a mudança aqui é só em atributo `v-if`, sem CSS novo.

---

### Task 1: `hasAlerts` no `buildTracks`

**Files:**
- Modify: `app/utils/scannerIncidents.js:128-134`
- Test: `tests/app/utils/scannerIncidents.spec.ts`

**Interfaces:**
- Consumes: `it.groups[].alerts` (já existe em cada item de `buildTracks`)
- Produces: `item.hasAlerts: boolean` — `true` quando qualquer grupo fundido no item tem alerta; consumido pela Task 2 no template (`!item.hasAlerts`)

- [ ] **Step 1: Write the failing test**

Append ao `describe('sideOf + buildTracks', ...)` em `tests/app/utils/scannerIncidents.spec.ts`:

```js
it('item chute+alerta expõe hasAlerts true; só-chute expõe false', () => {
  const withAlert = buildTracks(
    {
      shots: [{ minute: 20, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
      goals: [],
      notifications: [{ rule: 'r', label: 'Pico', minute: 20, at: 't' }],
    },
    [{ minute: 20, half: 1, home: 0.8, away: 0.1 }],
    (g) => g.minute * 10,
  )
  expect(withAlert).toHaveLength(1)
  expect(withAlert[0].hasAlerts).toBe(true)

  const shotsOnly = buildTracks(
    {
      shots: [{ minute: 20, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
      goals: [],
      notifications: [],
    },
    [{ minute: 20, half: 1, home: 0.8, away: 0.1 }],
    (g) => g.minute * 10,
  )
  expect(shotsOnly).toHaveLength(1)
  expect(shotsOnly[0].hasAlerts).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/app/utils/scannerIncidents.spec.ts`
Expected: FAIL — `expected undefined to be true`

- [ ] **Step 3: Write minimal implementation**

Em `app/utils/scannerIncidents.js`, no loop final do `buildTracks` (linhas 128-134), adicionar uma linha:

```js
for (const it of out) {
  const shots = it.groups.flatMap((g) => g.shots).sort((a, b) => DANGER[a.tier] - DANGER[b.tier])
  const alerts = it.groups.flatMap((g) => g.alerts)
  const total = shots.length + alerts.length + (it.kind === 'goal' ? it.groups.length : 0)
  it.shownShot = shots[0] ?? null
  it.hasAlerts = alerts.length > 0
  it.extra = total - 1
}
```

A única linha nova é `it.hasAlerts = alerts.length > 0`. Derivar dos grupos fundidos (`it.groups`), não do minuto original, cobre vizinhos fundidos onde só um lado tem alerta.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/app/utils/scannerIncidents.spec.ts`
Expected: PASS (todos os testes do arquivo, incluindo os pré-existentes de fusão e snap)

- [ ] **Step 5: Commit**

```bash
git add app/utils/scannerIncidents.js tests/app/utils/scannerIncidents.spec.ts
git commit -m "feat(scanner): hasAlerts por item de trilha no buildTracks"
```

---

### Task 2: Losango quando há alerta + ajuste do spec do chart

**Files:**
- Modify: `app/components/momentumChart.vue:15-16`
- Test: `tests/app/components/momentumChart.spec.ts`

**Interfaces:**
- Consumes: `item.hasAlerts` da Task 1 (sempre presente nos itens de `buildTracks`; item de `kind: 'goal'` tem `false`)
- Produces: nenhum — mudança puramente visual no template

- [ ] **Step 1: Write the failing test**

Adicionar em `tests/app/components/momentumChart.spec.ts`:

```js
it('chute+alerta desenha losango com +1, sem bolinha de chute', async () => {
  const wrapper = await mountSuspended(MomentumChart, {
    props: {
      bars: [{ minute: 35, home: 0.79, away: 0.12 }],
      goals: [],
      shots: [{ minute: 35, team: 'home', tier: 'C2', xg_delta: 0.3, label: 'Boa chance' }],
      notifications: [
        { rule: 'entrada_gol_ht', label: 'Gol HT — entrada pra gol antes do intervalo', minute: 35, at: 't' },
      ],
    },
  })
  expect(wrapper.find('.lane-alert').exists()).toBe(true)
  expect(wrapper.find('.lane-shot').exists()).toBe(false)
  expect(wrapper.find('.lane-more').exists()).toBe(true)
  expect(wrapper.find('.lane-more').text()).toBe('+1')
})
```

E atualizar o teste pré-existente `'popover mostra título curto do alerta, não o label longo do backend'` (mesmas props: chute C2 + notificação `entrada_gol_ht` no minuto 35): trocar o trigger de `.lane-shot` para `.lane-alert`:

```js
await wrapper.find('.lane-alert').trigger('mouseenter')
const pop = wrapper.find('.lane-pop')
expect(pop.exists()).toBe(true)
expect(pop.text()).toContain('Gol HT')
expect(pop.text()).not.toContain('antes do intervalo')
```

(as demais asserções desse teste permanecem idênticas)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/app/components/momentumChart.spec.ts`
Expected: FAIL — `.lane-alert` não existe (o item chute+alerta ainda renderiza `.lane-shot`); o teste atualizado do popover também falha no `find('.lane-alert')`

- [ ] **Step 3: Write minimal implementation**

Em `app/components/momentumChart.vue`, linha 16, trocar:

```html
v-if="item.kind === 'shots' && item.shownShot"
```

por:

```html
v-if="item.kind === 'shots' && item.shownShot && !item.hasAlerts"
```

Nada mais muda: o item com alerta cai no `v-else` do losango (linhas 59-72); `+N`, `trackKey`, fusão de vizinhos e popover seguem iguais; `shownShot` continua calculado para o popover listar os chutes.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/app/components/momentumChart.spec.ts`
Expected: PASS (incluindo chute-sozinho → `.lane-shot`, alerta-sozinho → `.lane-alert`, gol → `.lane-goal`)

- [ ] **Step 5: Commit**

```bash
git add app/components/momentumChart.vue tests/app/components/momentumChart.spec.ts
git commit -m "feat(scanner): alerta tem prioridade sobre chute no gráfico"
```
