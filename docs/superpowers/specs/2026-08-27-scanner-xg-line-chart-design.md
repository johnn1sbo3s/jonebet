# Design: Gráfico de linha de evolução de xG no Scanner

**Data:** 2026-08-27
**Status:** Aprovado (brainstorm + visual companion)

## Contexto

O scanner ao vivo (`app/pages/scanner.vue` → `ScannerCard`) hoje mostra o xG dos dois
times **só como valor acumulado atual** (`game.stats.xg = { home, away }`), lado a lado
com shots / big_chances / box_touches. A ideia é adicionar um **gráfico de linha da
evolução do xG ao longo do jogo** para casa e fora, num modal/popover dedicado no card.

### Descoberta-chave (backend já persiste o histórico)

`PersistentSnapshotStore` (`momentum-scanner/momentum/snapshot_store.py`) faz append-only
de um snapshot por jogo a cada `SNAPSHOT_DB_INTERVAL` ciclos em `data/scanner.db`
(tabela `snapshots`). O campo `stats_json` já salva `game.stats` **incluindo o `xg`** no
instante de cada ciclo. Portanto **a série histórica de xG já existe no banco** — só não
há endpoint que a devolva. Não há custo extra de storage para habilitar o gráfico.

### Fonte dos dados (decisão)

- **Histórico (passado):** novo endpoint `/xg-history?game=<id>` lê `scanner.db` e monta
  `{ minute, xg_home, xg_away }[]`.
- **Tempo real (presente):** o `props.game` do `ScannerCard` já é reativo — o long-polling
  do `scanner.vue` atualiza `game.stats.xg` a cada tick. O modal acumula essa amostra num
  array local enquanto aberto.
- As duas fontes se combinam numa série contínua: endpoint = base; amostras ao vivo =
  extrapolação do "agora".

## Arquitetura

```
scanner.db (snapshots.stats_json: xg por ciclo)
        │  lido por
        ▼
[xg_history.py] get_xg_history(match_id, store)  → série dedup por minuto
        │  com cache em memória TTL ~3-5min (server)
        ▼
[http_server.py] GET /xg-history?game=<id>  → { game_id, series: [...] }
        │  fetch (useXgHistory, FRESH_MS 5min, inFlight dedupe)
        ▼
[useXgHistory.js] history + liveSamples(game reativo)
        │
        ▼
[xgLineChart.vue] Chart.js (linha casa teal × fora blue)  ← dentro do
        │                                                 modal do ScannerCard
        ▼
[scannerCard.vue] botão "Evolução de xG" + overlay modal
```

## Backend (`momentum-scanner`)

### 1. `snapshot_store.py` — método de leitura

Adicionar `get_xg_history(match_id)`:
- `SELECT cycle_ts, minute, stats_json FROM snapshots WHERE match_id=? ORDER BY cycle_ts`
- Parseia `stats_json` → `xg = json.loads(...)`. Pega `xg.get('home')` / `xg.get('away')`.
- **Dedup por minuto:** mantém a última amostra de cada `minute` (o ciclo mais recente
  daquele minuto). Retorna `[{ "minute": int, "xg_home": float|None, "xg_away": float|None }]`.
- `xg` nulo (`{home: None}`) ou ausente → amostra ignorada (não quebra a linha).
- Jogo inexistente → lista vazia `[]`.

### 2. `http_server.py` — novo endpoint + cache

- Cache em memória no server: `dict[match_id, {ts, data}]` com TTL 3-5 min (espírito do
  `report_store`). Evita recomputar a agregação do SQLite por usuário.
- Em `do_GET`: `if self.path.startswith('/xg-history'): self._serve_xg_history(); return`
- `_serve_xg_history()`:
  - `game_id` obrigatório (400 se ausente).
  - `store = getattr(self.server, 'snapshot_store', None)`; 404 se `store is None`.
  - Cache hit (dentro do TTL) → devolve `data` direto.
  - Cache miss → `store.get_xg_history(game_id)`; 502 em erro de leitura; 200 com
    `{ "game_id": game_id, "series": [...] }`.
- Wire-up em `start_snapshot_server(...)`: aceitar `snapshot_store=None` e anexar via
  `server.snapshot_store = snapshot_store` (igual `evaluate_service` / `report_store`).

### 3. `monitor.py` — passar o store

Na linha ~957 onde `start_snapshot_server(...)` é chamado, adicionar
`snapshot_store=db_store` (já instanciado como `db_store` no bloco try acima).

## Frontend

### 4. `app/composables/useXgHistory.js` (espelha `useAiEvaluation`)

- Estado em módulo: `byGame = new Map()`, `inFlight = new Map()`, `FRESH_MS = 5*60*1000`.
- `load(id)`: se `inFlight` tem id → junta; se `status==='done'` e fresco → retorna;
  senão `fetchFn(`${base}/xg-history?game=${encodeURIComponent(id)}`)`, guarda `response`,
  marca `fetchedAt`. `fetchFn` injetável (= `$fetch`) para teste.
- `base` derivado de `useRuntimeConfig().public.SCANNER_SNAPSHOT_URL` trocando
  `/live.json` por `/xg-history` (padrão de `evaluateUrl()`).
- `safeParse('scannerXgHistory', data)` no retorno → fallback `{ game_id: null, series: [] }`.
- **Acúmulo ao vivo:** enquanto o modal está aberto, um `watch` externo (no card) empurra
  `{ minute: game.minute, xg_home, xg_away }` num array `liveSamples` (dedup por minuto),
  que é lido pelo chart.

### 5. `app/components/xgLineChart.vue` (Chart.js, padrão do projeto)

- `import { lineChartComponent } from '~/utils/chartSetup'` + `ensureChartSetup()`.
- `<ClientOnly>` em volta do `LineChart` (padrão `performanceChartCard`), com `#fallback`
  de altura reservada.
- Props: `history` (array do endpoint) + `liveSamples` (array reativo do card).
- **Merge:** base = `history`; anexa `liveSamples` cujo `minute` > último minuto do history
  (ou substitui o último se mesmo minuto). Monta `labels` (minutos) + 2 datasets:
  - Casa: `borderColor: '#2dd4bf'`, `backgroundColor: 'rgba(45,212,191,0.14)'`
  - Fora: `borderColor: '#3b82f6'`, `backgroundColor: 'rgba(59,130,246,0.14)'`
  - `pointRadius: 1`, `pointHoverRadius: 7`, `fill: true`, `tension: 0.2` (igual performanceChartCard).
- Eixo X = minuto (`'0'`, `'45'`, `'90'` como ticks); eixo Y = xG (`beginAtZero: true`).
- Cores de grid/ticks/labels conforme `useChartOptions` (`#27272a` / `#a1a1aa` / `#d4d4d8`).
- **Estado vazio:** `history` vazio e sem `liveSamples` → placeholder
  "aguardando dados de xG" (espelha `momentumChart`).

### 6. `app/components/scannerCard.vue` — botão + modal

- **Botão** "Evolução de xG" na frente do card, simétrico a "Análise pré-jogo" / "Avaliar
  com IA" (`UButton block color="primary" variant="soft"`), `@click.stop="openXgHistory"`.
- **Modal overlay** (padrão já usado pros popovers de IA/pré-jogo): `xgOpen` ref, overlay
  `absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-3`, conteúdo
  `rounded-xl border border-zinc-700 bg-zinc-900 p-3` com header (título + botão ✕) e
  `<xgLineChart :history="..." :liveSamples="...">`.
- `openXgHistory()`: `xgOpen=true` + `load(game.id)` (busca histórico) + inicia `watch`
  em `props.game.stats.xg` que empurra em `liveSamples`. Ao fechar (`xgOpen=false`): para
  o `watch`.

### 7. Contrato / schema (`app/utils/schemas.js`)

- `scannerSnapshot` já é `FlexObject` (passthrough) — **nenhuma mudança necessária**.
- Adicionar entrada `scannerXgHistory`:
  ```js
  scannerXgHistory: {
    schema: z.object({ game_id: z.unknown().nullable(), series: FlexArray.default([]) }).passthrough(),
    fallback: { game_id: null, series: [] },
  }
  ```
  (ou `FlexObject` simples — o importante é o `safeParse` nunca quebrar o componente).

## Layout (validado no visual companion)

**Opção B — gráfico + painel de stats**, responsivo:

- **Desktop:** gráfico à esquerda + painel à direita com 3 cards (xG Casa / xG Fora / Diff).
- **Mobile:** gráfico em cima + os **3 cards em uma linha abaixo** do gráfico
  (`grid-cols-3` / `flex` com `gap`).
- Legenda casa (teal) × fora (blue) no topo do gráfico; rodapé com xG atual + "Atualizado
  há Ns" opcional.

## Testes e QA

### Backend (`tests/momentum/`)
- `test_snapshot_store.py`: adicionar `test_get_xg_history_*`:
  - dedup por minuto (2 ciclos mesmo minuto → 1 amostra, a mais recente),
  - `xg` nulo ignorado,
  - jogo inexistente → `[]`.
- `test_http_server.py` (ou existente): `/xg-history` 400 sem `game`, 404 sem store,
  200 com série, 502 em erro de leitude, e comportamento de cache (2 chamadas → 1 leitura
  de DB dentro do TTL).

### Frontend (`tests/app/components/`)
- `xgLineChart.spec.ts` (padrão `performanceChartCard.spec.ts`, ~8 testes):
  - render com 2 datasets (casa/fora),
  - placeholder vazio quando sem dados,
  - merge de `history` + `liveSamples` (live estende o histórico),
  - cores corretas (teal/blue).
- `useXgHistory.spec.ts`: estado em módulo, `FRESH_MS` (2º load não refetch),
  `inFlight` dedupe, fallback em parse inválido.

### Verificação final
- `pnpm test:unit` verde antes de commit.
- **Não** rodar `pnpm build` / eslint / prettier manualmente (auto-run no pre-commit).

## Fora de escopo (YAGNI)

- Zoom/pan no gráfico de xG (o de performance tem; aqui não é necessário).
- Incluir a série no `/live.json` (aumentaria o payload de todos os jogos a cada poll).
- xG esperado vs real, ou projeção — só evolução observada.
- Persistência de `liveSamples` entre recarregamentos (o endpoint já recupera o histórico).
