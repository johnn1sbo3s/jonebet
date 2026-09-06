# Trading Models — Tickets

> Feature: página de resultados de modelos de trading (tipo lay_0x1 com sub-modelos crash/donkey/luigi/pacman/scorpion).

---

## Status dos tickets

| Marcador           | Significado                         |
| ------------------ | ----------------------------------- |
| 🔴 Não iniciado    | Ainda não começou                   |
| 🟡 Em planejamento | Planning rodando                    |
| 🟡 Spec aprovada   | Planning aprovado, aguardando solve |
| 🟢 Completo        | Implementação concluída             |

---

## Ticket 0 — Pipeline diurno: enviar resultados (placar + minutos) pra API

**Status:** 🟢 Concluído em 2026-09-05

### Objetivo

Adicionar ao pipeline diurno o envio dos resultados dos jogos (placar HT/FT + minutos dos gols) pra API.

### Ações realizadas

- [x] Criar `PATCH /fixtures` batch na jonebet-api (bulk_write por Fixture_ID)
- [x] Criar `update_fixtures_results(day)` no DatabaseHandler.py
- [x] Criar `scripts/goals_parser.py` pra parsear CSV string → array
- [x] Adicionar `_step("Enviar resultados pra API")` em `dia.py`
- [x] Criar `scripts/backfill_fixtures_results.py` pra dias 01, 02, 03/09
- [x] Backfill executado: 129 jogos enviados pra API
- [x] Deploy da API na VPS
- [x] 16 testes passando nos 2 repos

### Decisões

- **PATCH batch em vez de individual**: 1 request/dia em vez de ~20
- **Query por `Fixture_ID` (não `_id`)**: MongoDB usa ObjectId automático; `Fixture_ID` é o campo de negócio
- **`FTHG.notna()` sem `!= 0`**: empate 0x0 é resultado válido
- **`json=` kwarg no `_request`**: função só aceita 2 args posicionais
- **DatabaseHandler é módulo de funções, não classe**: `import scripts.DatabaseHandler as dbh`

---

## Ticket 1 — Pipeline diurno: incluir minutos dos gols (consolidado no Ticket 0)

**Status:** 🟢 Concluído (consolidado no Ticket 0)

### Objetivo

Quando o pipeline diurno atualiza placares dos jogos via `update_fixtures()`, precisa incluir `Goals_H_Minutes` e `Goals_A_Minutes` no payload enviado à API. Também precisa backfill dos dias 2 e 3/09.

### Decisões

- Minutos e placares são enviados **separadamente** (PATCH em vez de mudar POST /fixtures noturno)
- `update_fixtures_results()` lê CSV e envia todos os campos via PATCH
- Backfill script standalone, não polui pipeline diurno

---

## Ticket 2 — Desenho da página (front)

**Status:** 🟢 Concluído em 2026-09-05

### Objetivo

Esboçar a página `/trading-models` para definir o contrato de JSON com o backend.

### Notas

- Página com DatePicker (componente existente do projeto)
- Cards de resumo por sub-modelo (crash, donkey, luigi, pacman, Scorpion)
- Tabela detalhada com filtro por sub-modelo
- Colunas: Hora, Jogo, Odd, HT, 70', FT, Gols casa, Gols fora, Resultado, R$
- DatePicker usa Luxon `America/Sao_Paulo` pra evitar problema UTC (9pm BRT)
- Usa `useTradingModels` composable com cache + safeParse
- 19 testes unitários passando

### Decisões

- Layout espelha HTML do Telegram (validado pelo usuário)
- Seção por modelo (não tabela única) — espírito do Telegram
- Tabelas agregadas fixas no final (semana e mês)
- Badge colorido por sub-modelo (TRADING_MODEL_BADGE)
- Resultado enum string (GREEN/RED_LIGHT/RED) mapeia simulador

---

## Ticket 3 — Endpoint + service na API

**Status:** 🟢 Completo em 2026-09-06

### Objetivo

Criar endpoint `/trading-models/:model` que:

1. Busca apostas do modelo na collection `daily-bets` (filtrando por `lay_0x1_*`)
2. Faz join com `fixtures` por `(Date, Home, Away)` para obter minutos dos gols
3. Calcula GREEN/RED_LIGHT/RED via lógica do simulator
4. Retorna JSON estruturado pro frontend

### Descobertas

- Collection `daily-bets` tem: Date, Home, Away, FT_Odds_H/D/A, Modelo, Odds
- Collection `fixtures` **já tem** (após Ticket 0): Date, Home, Away, FTHG, FTAG, HTHG, HTAG, Goals_H_Minutes, Goals_A_Minutes, C_FT_Odds_H/D/A
- Join: `(Date, Home, Away)`
- Modelos: `lay_0x1_scorpion`, `lay_0x1_donkey`, `lay_0x1_crash`, `lay_0x1_pacman`, `lay_0x1_luigi`
- Simulator: lógica em `scripts/lay_0x1_backtest/simulator.py` (GREEN/RED_LIGHT/RED + PnL)

### Ações necessárias

- [ ] Investigar estrutura da jonebet-api (collections, serviços, routers)
- [ ] Criar router `/trading-models`
- [ ] Criar service com lógica do simulator (ou replicar)
- [ ] Retornar JSON no formato definido no Ticket 2

---

## Ticket 4 — Frontend: wire up

**Status:** 🟢 Completo em 2026-09-06

### Objetivo

Implementar a página `/trading-models` no jonebet-frontend consumindo o endpoint.

### Ações necessárias

- [ ] Wire up endpoint real (substituir mock)
- [ ] Testar contra API de produção

---

## Decisões

| Data  | Decisão                                         | Motivo                                                             |
| ----- | ----------------------------------------------- | ------------------------------------------------------------------ |
| 04/09 | Minutos dos gols vão na collection `fixtures`   | Já é onde ficam dados do jogo                                      |
| 04/09 | Endpoint genérico `/trading-models/:model`      | Permite expandir no futuro                                         |
| 04/09 | Cálculo feito na API, não no front              | Lógica do simulator roda no backend                                |
| 05/09 | Simulator: sem factory (YAGNI)                  | 3 funções de 15 linhas; lay_0x2+ é incerto                         |
| 05/09 | Ticket 0 criado: envio de resultados            | Descobrimos que API NUNCA recebeu placar                           |
| 05/09 | Reutilizar POST /fixtures                       | É passthrough, não precisa de nova rota                            |
| 05/09 | Workflow com 3 fases (discovery/planning/solve) | Separa problema, planejamento e execução                           |
| 05/09 | Discovery define TICKETS.md                     | Permite discutir o problema antes de planejar                      |
| 05/09 | Planning gera SPEC.md por ticket                | Cada ticket tem sua spec aprovada                                  |
| 05/09 | Revisores condicionais no plano                 | 1-3 reviewers baseado no escopo                                    |
| 05/09 | TDD sempre                                      | Testes antes de implementar                                        |
| 05/09 | PATCH batch em vez de individual                | 1 request/dia em vez de ~20                                        |
| 05/09 | Query por `Fixture_ID` (não `_id`)              | MongoDB usa ObjectId automático; `Fixture_ID` é o campo de negócio |
| 05/09 | `FTHG.notna()` sem `!= 0`                       | Empate 0x0 é resultado válido                                      |
| 05/09 | DatabaseHandler é módulo de funções             | `import scripts.DatabaseHandler as dbh`                            |
| 05/09 | Backfill: script standalone                     | Não polui pipeline, roda uma vez                                   |
| 05/09 | DatePicker usa SP_TZ (não UTC)                  | Evita mostrar dia errado após 9pm BRT                              |
