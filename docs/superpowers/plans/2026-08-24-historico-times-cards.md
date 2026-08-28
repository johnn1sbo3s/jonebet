# Histórico dos times nos cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir as features de histórico dos times do pipeline noturno num popover nos cards do scanner e do relatório diário.

**Architecture:** O momentum-scanner já mantém o JSON de features em memória (`FeaturesStore`). Um helper `attach_team_history` cruza os jogos por id e injeta `team_history` no payload de `/live.json` e na resposta de `/report`. No frontend, um componente novo `teamHistoryPopover.vue` (trigger nativo + `UPopover`) renderiza o bloco espelhado aprovado (opção A); os dois cards o usam com `v-if="game.team_history"`.

**Tech Stack:** Python stdlib (momentum-scanner), Vue 3 `<script setup>` + NuxtUI v4 `UPopover`, Vitest + `mountSuspended`, pytest.

**Spec:** `docs/superpowers/specs/2026-08-24-historico-times-cards-design.md`

## Global Constraints

- Repos: momentum-scanner em `~/Projetos/momentum-scanner`; frontend em `~/Projetos/jonebet-frontend`.
- Contrato: cada jogo ganha campo opcional `team_history = { home_metrics, away_metrics, h2h }` — só chaves presentes como dict entram; jogo sem feature → campo **omitido**; `h2h` nulo → chave ausente.
- Frontend: sem TypeScript, sem ponto-e-vírgula, aspas simples, trailing comma, largura 120 (Prettier do repo). Formatação de números SOMENTE via `app/utils/formatNumber.js` (`formatPercent` recebe valor JÁ em percentual: `formatPercent(40)` → `"40.00%"`; rates das features são frações → multiplicar por 100).
- Trigger de overlay Nuxt UI TEM que ser elemento nativo (`<button>` direto no slot default do `UPopover`) — componente wrapper quebra o ref do Reka e o clique não abre.
- Não rodar `npx eslint`/`pnpm build` após cada edição no frontend (hooks de commit cobrem); rodar `pnpm test:unit` ao final das tasks de frontend.

---

### Task 1: Helper attach_team_history no momentum-scanner

**Files:**
- Modify: `~/Projetos/momentum-scanner/momentum/features_store.py`
- Test: `~/Projetos/momentum-scanner/tests/momentum/test_features_store.py`

**Interfaces:**
- Consumes: nada (função nova de módulo).
- Produces: `attach_team_history(items: list[dict], features_store, id_key: str = 'id') -> None` (muta cada item adicionando `item['team_history']`) e `extract_team_history(entry: dict | None) -> dict | None`. Tasks 2 e 3 consomem exatamente esses nomes.

- [ ] **Step 1: Write the failing test**

Adicionar ao fim de `tests/momentum/test_features_store.py`:

```python
class _FakeStore:
    def __init__(self, data):
        self._data = data

    def get(self, fixture_id):
        return self._data.get(fixture_id)


def test_attach_team_history_injeta_e_omite_ausentes():
    from momentum.features_store import attach_team_history

    store = _FakeStore({
        'abc123': {
            'home_metrics': {'form5': 'WWWWL', 'points5': 12},
            'away_metrics': {'form5': 'LDLDW', 'points5': 4},
            'h2h': None,
            'odds': {'h': 2.0},
        },
    })
    jogos = [{'id': 'abc123'}, {'id': 'sem-feature'}]
    attach_team_history(jogos, store)

    assert jogos[0]['team_history'] == {
        'home_metrics': {'form5': 'WWWWL', 'points5': 12},
        'away_metrics': {'form5': 'LDLDW', 'points5': 4},
    }  # h2h None fora; odds fora
    assert 'team_history' not in jogos[1]  # sem feature → omitido


def test_attach_team_history_suporta_chave_jogo_id():
    from momentum.features_store import attach_team_history

    store = _FakeStore({'xyz789': {'home_metrics': {'points5': 9},
                                    'away_metrics': {'points5': 7},
                                    'h2h': {'count': 3, 'avg_goals': 2.0}}})
    jogos = [{'jogo_id': 'xyz789'}]
    attach_team_history(jogos, store, id_key='jogo_id')

    assert jogos[0]['team_history']['h2h'] == {'count': 3, 'avg_goals': 2.0}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/Projetos/momentum-scanner && python3 -m pytest tests/momentum/test_features_store.py -k attach_team_history -v`
Expected: FAIL com `ImportError: cannot import name 'attach_team_history'`

- [ ] **Step 3: Write minimal implementation**

Adicionar ao fim de `momentum/features_store.py` (após a classe `FeaturesStore`):

```python
_TEAM_HISTORY_KEYS = ('home_metrics', 'away_metrics', 'h2h')


def extract_team_history(entry: dict | None) -> dict | None:
    """Recorta o subdicionário team_history de uma entry de features.

    Só entram chaves presentes como dict (h2h null/nome errado é descartado).
    Retorna None se nada útil existir — o chamador NÃO injeta team_history.
    """
    if not isinstance(entry, dict):
        return None
    history = {key: entry[key] for key in _TEAM_HISTORY_KEYS if isinstance(entry.get(key), dict)}
    return history or None


def attach_team_history(items: list[dict], features_store, id_key: str = 'id') -> None:
    """Injeta team_history em cada item cruzando pelo id contra o FeaturesStore.

    Muta items in place; item sem feature correspondente fica sem o campo.
    """
    for item in items:
        history = extract_team_history(features_store.get(item.get(id_key, '')))
        if history:
            item['team_history'] = history
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ~/Projetos/momentum-scanner && python3 -m pytest tests/momentum/test_features_store.py -v`
Expected: PASS (todos, incluindo os pré-existentes)

- [ ] **Step 5: Commit**

```bash
cd ~/Projetos/momentum-scanner && git add momentum/features_store.py tests/momentum/test_features_store.py && git commit -m "feat: helper attach_team_history para expor features nos payloads publicos"
```

---

### Task 2: Enriquecer live.json no monitor

**Files:**
- Modify: `~/Projetos/momentum-scanner/momentum/monitor.py` (~linha 944, bloco `if snapshot_server is not None:`)
- Test: `~/Projetos/momentum-scanner/tests/momentum/test_features_store.py` (composição, mesmo arquivo da Task 1)

**Interfaces:**
- Consumes: `attach_team_history(items, features_store)` (Task 1); `build_snapshot(...)` de `momentum/snapshot.py` (existente).
- Produces: payload de `/live.json` cujo cada elemento de `games[]` pode ter `team_history`.

- [ ] **Step 1: Write the failing test** — composição igual à usada no monitor (build_snapshot cria dicts novos `{**g}`, então mutar depois é seguro):

```python
def test_composicao_build_snapshot_mais_attach():
    from datetime import datetime
    from momentum.features_store import attach_team_history
    from momentum.snapshot import build_snapshot

    store = _FakeStore({'abc123': {'home_metrics': {'points5': 12},
                                   'away_metrics': {'points5': 4}}})
    games = [{'id': 'abc123', 'minute': 10}, {'id': 'zzz', 'minute': 20}]
    snap = build_snapshot(games, {}, datetime(2026, 8, 24, 12, 0), version=1)
    attach_team_history(snap['games'], store)

    assert snap['games'][0]['team_history'] == {
        'home_metrics': {'points5': 12}, 'away_metrics': {'points5': 4}}
    assert 'team_history' not in snap['games'][1]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/Projetos/momentum-scanner && python3 -m pytest tests/momentum/test_features_store.py::test_composicao_build_snapshot_mais_attach -v`
Expected: FAIL (`ImportError` ou assertion) — ainda não está ligado ao fluxo real; este teste trava a composição usada no Step 3.

- [ ] **Step 3: Wire no monitor.py**

No bloco de publicação do ciclo principal (~linhas 943–948), trocar:

```python
                if snapshot_server is not None:
                    snapshot_version += 1
                    payload = json.dumps(
                        build_snapshot(store.all(), history.all(), datetime.now(),
                                       version=snapshot_version),
                        ensure_ascii=False,
                    ).encode("utf-8")
                    set_payload(snapshot_server, payload, snapshot_version)
```

por:

```python
                if snapshot_server is not None:
                    snapshot_version += 1
                    snapshot = build_snapshot(store.all(), history.all(), datetime.now(),
                                              version=snapshot_version)
                    attach_team_history(snapshot["games"], features)
                    payload = json.dumps(snapshot, ensure_ascii=False).encode("utf-8")
                    set_payload(snapshot_server, payload, snapshot_version)
```

E adicionar ao imports existente de `monitor.py` (linha 24):

```python
from momentum.features_store import FEATURES_PATH, FeaturesStore, attach_team_history
```

- [ ] **Step 4: Run full suite**

Run: `cd ~/Projetos/momentum-scanner && python3 -m pytest tests/ -q`
Expected: PASS, nenhuma regressão.

- [ ] **Step 5: Commit**

```bash
cd ~/Projetos/momentum-scanner && git add momentum/monitor.py tests/momentum/test_features_store.py && git commit -m "feat: injeta team_history nos jogos do snapshot live.json"
```

---

### Task 3: Enriquecer /report no http_server

**Files:**
- Modify: `~/Projetos/momentum-scanner/momentum/http_server.py::_serve_report` (após `jogos = list((report or {}).values())`)
- Test: `~/Projetos/momentum-scanner/tests/momentum/test_http_server.py`

**Interfaces:**
- Consumes: `attach_team_history(items, features_store, id_key='jogo_id')` (Task 1); `server.evaluate_service.features_store` (atributo existente de `EvaluateService`, ver `momentum/evaluate.py:217-221`).
- Produces: resposta de `/report` com `team_history` em cada jogo que tenha feature.

- [ ] **Step 1: Write the failing test**

Adicionar a `tests/momentum/test_http_server.py`:

```python
def test_serve_report_injeta_team_history():
    from types import SimpleNamespace

    class _Features:
        def get(self, fixture_id):
            if fixture_id == 'abc123':
                return {'home_metrics': {'points5': 12},
                        'away_metrics': {'points5': 4},
                        'h2h': {'count': 3, 'avg_goals': 2.0}}
            return None

    class _Report:
        def get(self, date_iso):
            return {'a': {'jogo_id': 'abc123', 'leitura_geral': 'ok'},
                    'b': {'jogo_id': 'zzz', 'leitura_geral': 'nada'}}

    server, port = _server()
    try:
        server.report_store = _Report()
        server.evaluate_service = SimpleNamespace(features_store=_Features())
        resp, body = _get(port, "/report?date=2026-08-24")
        data = json.loads(body)
        por_id = {j['jogo_id']: j for j in data['jogos']}
        assert resp.status == 200
        assert por_id['abc123']['team_history']['h2h'] == {'count': 3, 'avg_goals': 2.0}
        assert 'team_history' not in por_id['zzz']
    finally:
        server.shutdown()
        server.server_close()


def test_serve_report_sem_features_store_nao_quebra():
    from types import SimpleNamespace

    class _Report:
        def get(self, date_iso):
            return {'a': {'jogo_id': 'abc123'}}

    server, port = _server()
    try:
        server.report_store = _Report()
        server.evaluate_service = SimpleNamespace(features_store=None)
        resp, body = _get(port, "/report?date=2026-08-24")
        assert resp.status == 200
        assert json.loads(body)['jogos'][0] == {'jogo_id': 'abc123'}
    finally:
        server.shutdown()
        server.server_close()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/Projetos/momentum-scanner && python3 -m pytest tests/momentum/test_http_server.py -k serve_report -v`
Expected: FAIL — KeyError `'team_history'` (campo ainda não injetado).

- [ ] **Step 3: Implementar em `_serve_report`**

Em `momentum/http_server.py`, logo após `jogos = list((report or {}).values())` (antes do filtro `game_id`):

```python
        # Histórico pré-live (features do pipeline noturno): join por jogo_id.
        features_store = getattr(getattr(self.server, 'evaluate_service', None),
                                 'features_store', None)
        if features_store is not None:
            from momentum.features_store import attach_team_history
            attach_team_history(jogos, features_store, id_key='jogo_id')
```

- [ ] **Step 4: Run full suite**

Run: `cd ~/Projetos/momentum-scanner && python3 -m pytest tests/ -q`
Expected: PASS, nenhuma regressão.

- [ ] **Step 5: Commit**

```bash
cd ~/Projetos/momentum-scanner && git add momentum/http_server.py tests/momentum/test_http_server.py && git commit -m "feat: /report inclui team_history das features pre-live"
```

---

### Task 4: Componente teamHistoryPopover (frontend, TDD)

**Files:**
- Create: `app/components/teamHistoryPopover.vue`
- Test: `tests/app/components/teamHistoryPopover.spec.ts`

**Interfaces:**
- Consumes: `formatNumber`, `formatPercent` de `~/utils/formatNumber` (auto-import); `UPopover` (Nuxt UI auto-import).
- Produces: componente auto-importado `TeamHistoryPopover` com props `history: Object` (contrato da spec), `home: String`, `away: String`. Tasks 5 usa exatamente esses nomes.

- [ ] **Step 1: Write the failing test**

Criar `tests/app/components/teamHistoryPopover.spec.ts`:

```ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TeamHistoryPopover from '~/components/teamHistoryPopover.vue'

const history = {
  home_metrics: {
    form5: 'LWWWW',
    points5: 12,
    avg_total_goals: 2.3,
    btts_rate: 0.4,
    over25_rate: 0.4,
    ht_scored_rate: 0.4,
  },
  away_metrics: {
    form5: 'WLDLL',
    points5: 4,
    avg_total_goals: 2.4,
    btts_rate: 0.5,
    over25_rate: 0.4,
    ht_scored_rate: 0.2,
  },
  h2h: { count: 3, home_wins: 2, draws: 0, away_wins: 1, avg_goals: 2.0, btts_rate: 0 },
}

async function openPopover(props: Record<string, unknown>) {
  const wrapper = await mountSuspended(TeamHistoryPopover, { props })
  await wrapper.find('button').trigger('click')
  await new Promise((resolve) => setTimeout(resolve, 50))
  return wrapper
}

describe('teamHistoryPopover', () => {
  it('renderiza o botão gatilho', async () => {
    const wrapper = await mountSuspended(TeamHistoryPopover, {
      props: { history, home: 'Lok. Plovdiv', away: 'Arda' },
    })
    expect(wrapper.find('button').text()).toContain('Histórico')
  })

  it('abre popover com métricas espelhadas formatadas', async () => {
    await openPopover({ props: { history, home: 'Lok. Plovdiv', away: 'Arda' } })
    const body = document.body.textContent ?? ''
    expect(body).toContain('12') // pontos casa
    expect(body).toContain('4') // pontos fora
    expect(body).toContain('2.3') // gols/jogo casa
    expect(body).toContain('40%') // BTTS/over/gol 1ºT casa
    expect(body).toContain('20%') // gol 1ºT fora
  })

  it('mostra faixa H2H quando presente', async () => {
    await openPopover({ props: { history, home: 'Lok. Plovdiv', away: 'Arda' } })
    expect(document.body.textContent).toContain('H2H')
    expect(document.body.textContent).toContain('2 × 1')
  })

  it('omite faixa H2H quando ausente', async () => {
    const { h2h: _omitted, ...semH2h } = history
    await openPopover({ props: { history: semH2h, home: 'A', away: 'B' } })
    expect(document.body.textContent).not.toContain('H2H')
  })

  it('omite linhas de métricas ausentes sem quebrar', async () => {
    const parcial = {
      home_metrics: { form5: 'WWW', points5: 9 },
      away_metrics: {},
    }
    await openPopover({ props: { history: parcial, home: 'A', away: 'B' } })
    const body = document.body.textContent ?? ''
    expect(body).toContain('9')
    expect(body).not.toContain('BTTS')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/Projetos/jonebet-frontend && pnpm vitest run tests/app/components/teamHistoryPopover.spec.ts`
Expected: FAIL — componente não existe (erro de resolve).

- [ ] **Step 3: Implementar `app/components/teamHistoryPopover.vue`**

```vue
<template>
  <UPopover :content="{ align: 'end' }">
    <button
      type="button"
      class="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-2xs font-semibold text-zinc-400 transition-colors hover:border-teal-600 hover:text-teal-400"
      title="Histórico dos times (pipeline pré-live)"
    >
      📊 Histórico
    </button>

    <template #content>
      <div class="w-64 p-3 text-xs text-zinc-200">
        <div class="mb-1 flex justify-between text-2xs uppercase tracking-wide text-zinc-500">
          <span>{{ home }} <span class="text-zinc-700">(últ. 10)</span></span>
          <span>{{ away }}</span>
        </div>

        <div v-if="formHome || formAway" class="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 border-b border-zinc-800 py-1.5">
          <span class="flex justify-end gap-0.5">
            <span v-for="(r, i) in formHome" :key="`h${i}`" :class="resultClass(r)" class="flex size-3.5 items-center justify-center rounded-sm text-[8px] font-bold">{{ r }}</span>
          </span>
          <span class="text-2xs uppercase text-zinc-500">forma</span>
          <span class="flex gap-0.5">
            <span v-for="(r, i) in formAway" :key="`a${i}`" :class="resultClass(r)" class="flex size-3.5 items-center justify-center rounded-sm text-[8px] font-bold">{{ r }}</span>
          </span>
        </div>

        <div
          v-for="row in rows"
          :key="row.label"
          class="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 border-b border-zinc-800 py-1.5 last:border-b-0"
        >
          <span class="text-right font-semibold tabular-nums text-zinc-100">{{ row.home }}</span>
          <span class="text-2xs uppercase text-zinc-500">{{ row.label }}</span>
          <span class="font-semibold tabular-nums text-zinc-100">{{ row.away }}</span>
        </div>

        <p v-if="h2hLine" class="mt-2 border-t border-dashed border-zinc-800 pt-2 text-2xs leading-relaxed text-zinc-400">
          <span class="font-bold uppercase tracking-wide text-teal-400">H2H</span>
          ({{ h2h.count }} jogos): {{ h2hLine }}
        </p>
      </div>
    </template>
  </UPopover>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  history: { type: Object, default: null },
  home: { type: String, required: true },
  away: { type: String, required: true },
})

const RESULT_CLASSES = {
  W: 'bg-teal-500/15 text-teal-400',
  D: 'bg-zinc-500/15 text-zinc-400',
  L: 'bg-red-500/15 text-red-400',
}

function resultClass(letter) {
  return RESULT_CLASSES[letter] ?? 'bg-zinc-500/15 text-zinc-400'
}

const formHome = computed(() => String(props.history?.home_metrics?.form5 ?? ''))
const formAway = computed(() => String(props.history?.away_metrics?.form5 ?? ''))

// Rates chegam como frações (0.4) — formatPercent espera valor em percentual.
const rows = computed(() => {
  const hm = props.history?.home_metrics ?? {}
  const am = props.history?.away_metrics ?? {}
  const out = []
  const push = (label, hv, av, fmt) => {
    if (hv == null && av == null) return
    out.push({ label, home: hv == null ? '—' : fmt(hv), away: av == null ? '—' : fmt(av) })
  }
  push('pts últ. 5', hm.points5, am.points5, (v) => formatNumber(v, 0))
  push('gols/jogo', hm.avg_total_goals, am.avg_total_goals, (v) => formatNumber(v, 1))
  push('BTTS', hm.btts_rate, am.btts_rate, (v) => formatPercent(v * 100, 0))
  push('over 2.5', hm.over25_rate, am.over25_rate, (v) => formatPercent(v * 100, 0))
  push('gol no 1ºT', hm.ht_scored_rate, am.ht_scored_rate, (v) => formatPercent(v * 100, 0))
  return out
})

const h2h = computed(() => props.history?.h2h ?? null)
const h2hLine = computed(() => {
  if (!h2h.value) return ''
  const parts = [
    `${props.home} ${h2h.value.home_wins} × ${h2h.value.away_wins} ${props.away}`,
  ]
  if (h2h.value.draws) parts.push(`${h2h.value.draws} empate${h2h.value.draws > 1 ? 's' : ''}`)
  if (h2h.value.avg_goals != null) parts.push(`${formatNumber(h2h.value.avg_goals, 1)} gols/jogo`)
  return parts.join(' · ')
})
</script>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ~/Projetos/jonebet-frontend && pnpm vitest run tests/app/components/teamHistoryPopover.spec.ts`
Expected: PASS (5 testes). Se o portal do `UPopover` não renderizar em happy-dom, abrir o popover via `wrapper.find('button').trigger('click')` + `await nextTick()` duplo antes de ler `document.body`.

- [ ] **Step 5: Commit**

```bash
cd ~/Projetos/jonebet-frontend && git add app/components/teamHistoryPopover.vue tests/app/components/teamHistoryPopover.spec.ts && git commit -m "feat: teamHistoryPopover com resumo de histórico pré-live"
```

---

### Task 5: Integrar nos cards scannerCard e reportGameCard

**Files:**
- Modify: `app/components/scannerCard.vue` (cluster direito do header, linha ~19: `<div class="print-hide flex items-center gap-1.5">`)
- Modify: `app/components/reportGameCard.vue` (lado direito do `<header>`, antes do fechamento em ~linha 69)

**Interfaces:**
- Consumes: `<TeamHistoryPopover :history :home :away>` (auto-import, Task 4). Snapshot tem `game.id/home/away`; relatório tem `game.jogo_id/home/away`.
- Produces: botão 📊 Histórico visível nos dois cards quando `game.team_history` existe.

- [ ] **Step 1: Inserir no scannerCard.vue**

Dentro de `<div class="print-hide flex items-center gap-1.5">` (primeiro filho do cluster):

```html
<TeamHistoryPopover
  v-if="game.team_history"
  :history="game.team_history"
  :home="game.home"
  :away="game.away"
/>
```

- [ ] **Step 2: Inserir no reportGameCard.vue**

No `<header>` (linhas 11–69), como último elemento antes do `</header>`:

```html
<TeamHistoryPopover
  v-if="game.team_history"
  :history="game.team_history"
  :home="game.home"
  :away="game.away"
/>
```

- [ ] **Step 3: Rodar suíte completa do frontend**

Run: `cd ~/Projetos/jonebet-frontend && pnpm test:unit`
Expected: PASS (55 testes pré-existentes + 5 novos).

- [ ] **Step 4: Verificação visual end-to-end**

Proxy local servindo o `live.json` real de produção com um `team_history` de exemplo injetado (padrão `NUXT_PUBLIC_SCANNER_SNAPSHOT_URL` já usado no repo — skill `scanner-snapshot-proxy-preview`), apontando o dev server pra ele e conferindo no browser: botão aparece no card, popover abre com layout espelhado, card sem `team_history` continua igual. Repetir na página daily-report com o `/report` real do dia.

- [ ] **Step 5: Commit**

```bash
cd ~/Projetos/jonebet-frontend && git add app/components/scannerCard.vue app/components/reportGameCard.vue && git commit -m "feat: botão de histórico pré-live nos cards do scanner e relatório"
```

## Deploy (fora do escopo do plano, lembrar ao final)

- momentum-scanner: rebuild/redeploy do container na VPS (skills `momentum-scanner-vps-redeploy`).
- frontend: deploy normal (Vercel).
