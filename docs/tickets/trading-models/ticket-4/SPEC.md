**Status:** 🟢 Aprovada em 2026-09-06

# Spec: Ticket 4 — Frontend wire up trading-models

## Goal

Trocar o mock de `useTradingModels.js` pelos dois endpoints reais (`GET /trading-models/daily?date=` + `GET /trading-models/summary`), tratando PENDING, nomes reais de modelo e erros visíveis.

## Context

Ticket 2 entregou a página `/performance/trading-models` com `MOCK_DATA` (composable sempre cai no mock porque `/trading-models` não existe). Ticket 3 entregou e deployou os endpoints reais na `api.jonebet.xyz` (verificado com dados de produção: `lay_0x1_scorpion`, `RED_LIGHT`, `goals_away: ["53","90+10"]`).

Divergências mock × real encontradas pelos scouts:
- Mock: 1 modelo `lay_0x1` + rows `back_home/lay_goleada_home/ltd/lay_away` com `bets_count/pnl/roi`. Real: só `lay_0x1_*` (scorpion/donkey/crash/pacman/luigi), rows com `games/green/red_light/red/total`. AggTable já lê `games/total` — hoje renderiza vazio.
- Mock: chaves `daily/weekly/monthly`. Real: `daily` no endpoint daily; `week/month` no summary.
- Mock bets sem `goals_home/goals_away`, sem PENDING. Template quebra (`bet.ht_score[0]` com null) em 3 pontos.
- `TRADING_MODEL_BADGE` com chaves curtas (`donkey`) não bate com nomes reais (`lay_0x1_donkey`) — badge cai no default.
- `TRADING_MODEL_RESULT` sem entrada PENDING.
- Erro engolido (`error: computed(() => null)`) — pane real seria invisível.

## Scope

In:
- `useTradingModels.js`: dois `useFetch` (daily com `?date=`, summary chave fixa), deletar `MOCK_DATA` + fallback, expor erro real
- `TradingModelsContent.vue`: ler `daily/week/month` (renomear `weekly→week`, `monthly→month`), `DataErrorCard` pra erro (default) e dia vazio ("Sem apostas neste dia")
- `tradingModelDayCard.vue`: `v-if` nos 3 scores com fallback "—", badge PENDING, exibir `goals_home/goals_away` literal (`45+2'`)
- `enums.js`: `TRADING_MODEL_BADGE` com nomes completos (`lay_0x1_scorpion`…), label derivado do sufixo (fallback `model_label` da API); `TRADING_MODEL_RESULT` + PENDING cinza
- `schemas.js`: quebrar `tradingModelsList` em `tradingDaily` + `tradingSummary`
- Atualizar `tests/app/utils/schemas-trading-models.spec.ts` (quebra: asserts da forma antiga)

Out:
- Outros modelos de trading (back_home, ltd…) — follow-up, API nem retorna
- Mudança de layout/visual — página já aprovada no Ticket 2
- `app/pages/performance/trading-models.vue` — shell, sem mudança

## Technical Approach

Composable único, dois fetches (decisão Problema 3):
```js
// daily: query reativa { date }, watch [dateRef], cacheKey `tm-daily-${date}`
useFetch(`${api}/trading-models/daily`, { query, watch: [dateRef], ... })
// summary: sem query, chave fixa, busca 1x (cache segura nas trocas de data)
useFetch(`${api}/trading-models/summary`, { key: 'trading-models-summary', ... })
```
Ambos com `safeParse` no `onResponse` (padrão `useDailyBets` em `useModelApi.js:148`) + LRU próprio. Sem `default` mock; `error` exposto.

Retorno: `{ daily: computed, summary: computed, pending, error, refresh }`. Content combina: cards do `daily.daily[]`, tabelas de `summary.week/summary.month`.

PENDING (decisão Problema 4): linha visível, scores com `v-if="bet.ht_score"` senão "—", badge PENDING, gols omitidos quando `null`, literais quando array (`v-for` + `'`).

## Files Affected

| Arquivo | Ação |
|---|---|
| `app/composables/useTradingModels.js` | REWRITE — dual fetch, deleta MOCK_DATA, expõe erro |
| `app/components/TradingModelsContent.vue` | EDITAR — week/month, DataErrorCard erro + vazio, skeleton por seção |
| `app/components/tradingModelDayCard.vue` | EDITAR — guards null, PENDING, goals_* |
| `app/components/tradingModelAggTable.vue` | NENHUMA — já lê `games/total` (mock errado que some) |
| `app/components/tradingModelsSkeleton.vue` | CRIAR — skeleton cards + tabelas (espelha `performancePageSkeleton.vue`) |
| `app/utils/schemas.js` | EDITAR — split `tradingDaily` + `tradingSummary` |
| `app/utils/enums.js` | EDITAR — BADGE nomes completos, RESULT + PENDING |
| `tests/app/utils/schemas-trading-models.spec.ts` | EDITAR — asserts nova forma |
| `tests/app/composables/useTradingModels.spec.ts` | CRIAR — dual fetch, erro, reatividade de data |
| `tests/app/components/tradingModelDayCard.spec.ts` | CRIAR?/EDITAR — PENDING (scores null → "—"), goals literais |

## Testes (TDD)

- Stack: Vitest + happy-dom + `@nuxt/test-utils` (`mountSuspended`, `// @vitest-environment nuxt`)
- Composable: `vi.stubGlobal('useFetch', …)` (usa `useFetch` direto, sem injeção); casos: daily manda `?date=`, summary sem query, erro exposto (sem mock), troca de data refaz só daily
- DayCard: bet PENDING renderiza "—" sem estourar; `goals_away: ["45+2"]` exibe literal; badge PENDING com classe cinza
- Schema: `safeParse('tradingDaily')` e `('tradingSummary')` aceitam forma real, fallback em mismatch
- Página contra produção após deploy do front (verificação visual, sem teste)

## Decisions

| Decisão | Motivo |
|---|---|
| BADGE com nomes completos da API, label do sufixo + fallback | Chaves curtas nunca batem; `model_label` ("0x1") não serve pra "Scorpion" |
| Deletar mock, erro via DataErrorCard | Mock esconderia pane real; card serve erro (default) e vazio (custom) |
| Um composable, dois useFetch, summary chave fixa | Padrão 1 composable/domínio; summary buscado 1x, cache segura |
| Loading com skeleton por seção, sem spinner | Padrão do site (`USkeleton`); cards com `dailyPending`, tabelas com `summaryPending` |
| PENDING visível com "—" | Aposta existe mesmo sem placar (contrato ticket 3) |
| Split de schema daily/summary | Um endpoint ≠ outro; schema monolítico mente a forma |

## Risks

- **Dia sem apostas retorna `daily: []`** — não é erro; Content mostra empty state, não DataErrorCard de erro
- **Datas antigas (pre-01/09) vêm tudo PENDING** — minutos não existem; comportamento correto, não bug
- **Summary "atual" vem do servidor (SP_TZ)** — front não calcula semana/mês, só exibe
- **`useFetch` duplo = 2 loadings** — skeleton por seção: `tradingModelsSkeleton.vue` nos cards enquanto `dailyPending`, nas tabelas enquanto `summaryPending`; summary rápido após 1º load via cache
