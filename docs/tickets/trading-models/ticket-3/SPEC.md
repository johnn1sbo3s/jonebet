# Spec: Ticket 3 — Endpoint + service na API

**Status:** 🟢 Aprovada em 2026-09-06

## Goal

Criar dois endpoints GET públicos na jonebet-api que devolvem resultados de trading models (daily detalhado + agregados fixos), com cálculo GREEN/RED_LIGHT/RED/PnL no backend.

## Context

Ticket 2 entregou a página `/performance/trading-models` no front com mock data. O mock desliga sozinho quando a API responde 200 (`useTradingModels.js` usa `default: MOCK_DATA` + computed sobre `error`). Ticket 0 garantiu placares + minutos de gols na collection `fixtures` (backfill 01–03/09, pipeline diurno cobre dias seguintes).

Lógica de simulação vive em `football_models/scripts/lay_0x1_backtest/simulator.py` — outro repo, sem import possível; será replicada.

## Scope

In:
- `GET /trading-models/daily?date=YYYY-MM-DD` — cards do dia (bets com scores, resultado, profit, subtotal por modelo)
- `GET /trading-models/summary` — tabelas fixas: semana atual (Seg–Dom) + mês atual, agregados por modelo
- Módulo `trading_simulator.py` com lógica replicada + testes unitários
- Join `daily-bets` × `fixtures` por `(Date, Home, Away)` (mesmo padrão de `get_daily_bets()`)
- Filtro de modelos `lay_0x1_*` (escopo do ticket)

Out:
- Outros modelos de trading (back_home, ltd, etc.) — follow-up
- Mudanças no frontend (Ticket 4) — inclui corrigir mock `bets_count`/`pnl` → `games`/`total` e exibir `PENDING`
- Backfill de minutos fora de 01–03/09

## Technical Approach

Dois endpoints separados porque o datepicker só afeta o daily; semana/mês são seções fixas e não devem esperar o daily.

**`GET /trading-models/daily?date=`**
1. Busca `daily-bets` por `Date` + `Modelo` regex `^lay_0x1_`
2. Busca `fixtures` do mesmo `Date`, monta `fixture_map[(Date,Home,Away)]`
3. Por bet: join → `parse_minutes()` nos minutos → `simulate_match(HTHG, HTAG, gh, ga)` → `score_at_minute(gh, ga, 70)` → `pnl_resultado(result, odd)`
4. Agrupa por `Modelo`; `model_label` via `market_label()` existente; `subtotal` = soma profits
5. Sem fixture/placar → bet com `result: "PENDING"`, scores `null`, `profit: 0` (contrato pro Ticket 4 tratar com `v-if`)

**`GET /trading-models/summary`**
1. Semana atual Seg–Dom + mês atual, calculados em `America/Sao_Paulo` (alinhado ao `SP_TZ` do front)
2. Mesmo join + simulator sobre o período; agrupa por modelo
3. Linhas com `games` + `total` (nomes que `tradingModelAggTable.vue` já lê — decisão Problema 1)

**Resposta daily:**
```json
{
  "date": "2026-09-05",
  "daily": [{
    "model": "lay_0x1", "model_label": "0x1", "subtotal": 10.0,
    "bets": [{
      "fixture_id": 9001, "home": "Flamengo", "away": "Palmeiras",
      "time": "20:00", "odd": 3.4,
      "ht_score": [0, 0], "minute_70_score": [0, 1], "ft_score": [1, 1],
      "goals_home": ["67"], "goals_away": ["55"],
      "result": "GREEN", "profit": 10.0
    }]
  }]
}
```

`goals_home` / `goals_away`: arrays de **strings** com os tokens originais (`["16", "45+2"]`) —
front exibe literal (`45+2'`). Parse pra int acontece só dentro do simulator (`score_at_minute`).
Bet sem gols → `[]`. Bet PENDING → `null`.

**Resposta summary:**
```json
{
  "week": { "start_date": "2026-08-31", "end_date": "2026-09-06",
    "rows": [{ "model": "lay_0x1", "model_label": "0x1", "games": 14,
                "green": 9, "red_light": 2, "red": 3, "total": 45.0 }] },
  "month": { "year": 2026, "month": 9, "rows": [ ... ] }
}
```

**Regras replicadas (`trading_simulator.py`, ~40 linhas):**
- `parse_minutes`: `"['16','45+2']"` → `[16, 47]`; `"[]"` → `[]`; `"90+2"` → `92`
- `simulate_match`: HT 0x0 → `RED_LIGHT`; 70' 0x1 → `RED`; senão `GREEN`
- `pnl_resultado`: GREEN `+10`; RED_LIGHT `−5% × 10 × (odd−1)`; RED `−30% × 10 × (odd−1)`
- Minutos ausentes → lista vazia (default seguro)

## Files Affected

| Arquivo | Ação |
|---|---|
| `app/routers/trading_models.py` | CRIAR — 2 GET públicos, sem auth |
| `app/services/trading_simulator.py` | CRIAR — simulate/parse/score/pnl (puro, sem DB) |
| `app/services/trading_service.py` | CRIAR — `get_daily(db, date)`, `get_summary(db)` |
| `app/main.py` | EDITAR — import + `include_router` (2 linhas) |
| `app/schemas/responses.py` | EDITAR — Pydantic `TradingDailyResponse`, `TradingSummaryResponse` (ou `list[dict]` passthrough seguindo `DailyBetsEnvelope`) |
| `tests/test_trading_models.py` | CRIAR — router + service + simulator |

Reuso: `market_label()` (`database.py`), join dict por `(Date,Home,Away)` (`get_daily_bets`), `resolve_model_odd()` se odd vier nula.

## Testes (TDD)

- Stack: pytest + FakeDB/FakeCollection em `tests/conftest.py` (in-memory, sem Mongo)
- Padrões: fixture `client_with_*` seedando `daily-bets` + `fixtures`; GET público sem auth; shared FakeDB se precisar POST→GET
- Novos testes necessários:
  - simulator puro: HT 0x0→RED_LIGHT, 70' 0x1→RED, GREEN default, `parse_minutes("45+2")`→47, PnL com odd 5.0 (espelhar `football_models/tests/test_lay_0x1_simulator.py`)
  - service: join bet×fixture, bet sem fixture→PENDING, minutos ausentes→GREEN, subtotal soma profits
  - router daily: 200 + shape `{date, daily[]}`, filtro `lay_0x1_*` exclui outros modelos
  - router summary: semana começa segunda/termina domingo (caso de borda: `?date` num domingo vs segunda), mês correto
  - score arrays são `[h, a]` inteiros (contrato do template — regressão crítica)

## Decisions

| Decisão | Motivo |
|---|---|
| Agregado usa `games` + `total` | Nomes que o componente já lê; mock corrigido no Ticket 4 |
| Simulator replicado na API | Repos/deploy separados, sem import; ~40 linhas, risco de drift documentado |
| Bet sem resultado → `PENDING` + scores `null` | Aposta existe mesmo sem placar; esconder confunde |
| Dois endpoints (`daily` + `summary`) | Datepicker só afeta o dia; agregado fixo não espera o daily |
| Semana Seg–Dom (não 7 dias corridos) | Definição do usuário |
| GET público, sem auth | Convenção da API; front não manda token |
| Escopo `lay_0x1_*` | Simulator mapeado é o do lay_0x1; outros modelos são follow-up |

## Risks

- **Scores `null` quebram o template atual** (`bet.ht_score[0]` com null estoura) — mitigado no Ticket 4 com `v-if`; contrato explícito aqui
- **Drift do simulator**: se `football_models` mudar regras/PnL, a cópia na API desatualiza — sem sync automático; documentar nos dois repos
- **Minutos só existem 01–03/09+pipeline**: datas antigas retornam tudo PENDING — comportamento correto, não erro
- **Join por nome de time** (`Home`/`Away` string): divergência de acento/abreviação vira PENDING — risco já aceito no `get_daily_bets()`
- **Fuso da semana/mês**: "atual" calculado no servidor — fixar `America/Sao_Paulo` explícito, nunca UTC do container
