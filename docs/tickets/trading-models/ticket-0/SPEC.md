# Spec: Pipeline diurno — enviar resultados (placar + minutos) pra API

## Goal

Fazer o pipeline diurno enviar placar (FT/HT) e minutos dos gols pra collection `fixtures` da jonebet-api, para que o futuro endpoint `/trading-models` possa calcular resultados (GREEN/RED_LIGHT/RED) via join com `daily-bets`.

## Context

Hoje o pipeline noturno (`noite.py`) envia dados pregame (13 colunas) via `DatabaseHandler.update_fixtures()`, dropando FTHG/FTAG/HTHG/HTAG/Goals_H_Minutes. O pipeline diurno (`dia.py`) popula esses campos no CSV via `GamesUpdater` (Flashscore GraphQL), mas **nunca envia à API**. Resultado: a collection `fixtures` no MongoDB nunca tem placar nem minutos — só o CSV local.

Isso é pré-requisito de tudo: sem resultados na API, o endpoint `/trading-models` (Ticket 3) não consegue calcular nada.

## Scope

**In scope:**
- Criar `PATCH /fixtures` (batch, array de {fixture_id, ...campos}) na jonebet-api
- Criar `update_fixtures_results(day)` no `DatabaseHandler.py` (football_models)
- Integrar chamada em `dia.py` (após `_update_results_graphql`)
- **Integração no dia.py é escopo do Ticket 0:** a função `update_fixtures_results()` sem a chamada no pipeline nunca é executada automaticamente. A integração é uma linha de código (`_step(...)`), sem dependências externas. Separar em outro ticket seria artificial.
- Script standalone de backfill para dias 2026-09-01, 2026-09-02, 2026-09-03
- Parse de `Goals_H_Minutes` string → array real antes de enviar

**Out of scope:**
- Lógica de cálculo GREEN/RED (Ticket 3)
- Frontend consumindo resultados (Ticket 4)
- Alterações em `GET /fixtures` ou `GET /daily-bets` (projeção explícita não inclui campos novos — extensão futura)
- Mudar `update_fixtures()` noturno (mantém DELETE+INSERT pregame como está)

## Technical Approach

### 1. API: PATCH /fixtures (batch)

**Arquivo:** `jonebet-api/app/routers/fixtures.py`

Novo endpoint — recebe array de atualizações e faz `bulk_write`:
```python
@router.patch("/fixtures")
async def patch_fixtures(updates: list[dict]):
    """
    Body: [{"fixture_id": "abc", "FTHG": 2, ...}, ...]
    Faz $set em cada documento identificado por `fixture_id`.
    """
    from pymongo import UpdateOne
    ops = []
    for item in updates:
        fid = item.pop("fixture_id")
        ops.append(UpdateOne({"_id": fid}, {"$set": item}))
    if ops:
        result = db.fixtures.bulk_write(ops)
        return {"matched": result.matched_count, "modified": result.modified_count}
    return {"matched": 0, "modified": 0}
```

- Schemaless: cada item pode ter campos diferentes
- `bulk_write` em uma transação — 1 request para N jogos
- Retorna contagem de matched/modified

### 2. DatabaseHandler: update_fixtures_results(day)

**Arquivo:** `football_models/scripts/DatabaseHandler.py` (após `update_fixtures()`)

```python
def update_fixtures_results(self, day: str):
    """Envia placar FT/HT + minutos dos gols pra fixtures collection via PATCH."""
    df = pd.read_csv(BASE_DIR / 'Base_Bookie.csv')
    df = df[(df['Date'] == day) & (df['FTHG'].notna()) & (df['FTHG'] != 0)]
    
    if df.empty:
        return
    
    results = []
    for _, row in df.iterrows():
        fixture_id = row['Fixture ID']
        payload = {
            'FTHG': int(row['FTHG']),
            'FTAG': int(row['FTAG']),
            'HTHG': int(row['HTHG']),
            'HTAG': int(row['HTAG']),
            'Goals_H_Minutes': _parse_goals_minutes(row['Goals_H_Minutes']),
            'Goals_A_Minutes': _parse_goals_minutes(row['Goals_A_Minutes']),
            'C_FT_Odds_H': row['C_FT_Odds_H'],
            'C_FT_Odds_D': row['C_FT_Odds_D'],
            'C_FT_Odds_A': row['C_FT_Odds_A'],
        }
        results.append((fixture_id, payload))
    
    self._request('PATCH', '/fixtures', [{'fixture_id': fid, **payload} for fid, payload in results])
```

**Helper `_parse_goals_minutes`:**
```python
import ast

def _parse_goals_minutes(value) -> list[str]:
    """Parse '["16", "45+2", "67"]' → ["16", "45+2", "67"]. NaN/vazio → []."""
    if pd.isna(value) or value == '' or value == '[]':
        return []
    try:
        parsed = ast.literal_eval(value)
        return [str(m) for m in parsed]
    except (ValueError, SyntaxError):
        return []
```

**Decisões:**
- Filtra por `FTHG.notna() and FTHG != 0` — só envia jogos que já têm resultado
- `fillna(0)` apenas em campos numéricos que podem vir nulos (HTHG/HTAG podem ser 0 legítimo)

### 3. Integração no dia.py

**Arquivo:** `football_models/pipelines/dia.py`

Adicionar após `_update_results_graphql(ontem)`:
```python
_step('Enviar resultados pra API', lambda: dbh.update_fixtures_results(ontem), messenger)
```

Ordem final do dia.py:
1. `FS.update_base` (scrape FootyStats)
2. `_update_results_graphql(ontem)` → GamesUpdater (preenche CSV)
3. **NOVO:** `dbh.update_fixtures_results(ontem)` → PATCH na API
4. `papermill` (métricas)
5. `dbh.update_metrics()` → POST /metrics
6. `dbh.update_bets()` → POST /bets

### 4. Script de backfill

**Arquivo:** `football_models/scripts/backfill_fixtures_results.py`

```python
"""Backfill: envia resultados dos dias 1, 2 e 3/09 pra API."""
from scripts.DatabaseHandler import DatabaseHandler
from utils.constants import API_URL
import sys

def main():
    dbh = DatabaseHandler(API_URL)
    if not dbh.login():
        print('Falha no login')
        sys.exit(1)
    
    for day in ['2026-09-01', '2026-09-02', '2026-09-03']:
        print(f'Backfilling {day}...')
        dbh.update_fixtures_results(day)
        print(f'  {day} OK')

if __name__ == '__main__':
    main()
```

Rodar uma vez após deploy. Não é reprocessamento — só lê CSV e faz PATCH.

## Files Affected

| Repo | File | Change |
|------|------|--------|
| jonebet-api | `app/routers/fixtures.py` | Adicionar `PATCH /fixtures` (bulk com array) |
| football_models | `scripts/DatabaseHandler.py` | Adicionar `update_fixtures_results()` + helper `_parse_goals_minutes()` |
| football_models | `pipelines/dia.py` | Adicionar `_step` com `update_fixtures_results(ontem)` |
| football_models | `scripts/backfill_fixtures_results.py` | Novo script standalone |

## Testes (TDD)

**Stack:** pytest + FakeClient (football_models) / FastAPI TestClient + FakeCollection (jonebet-api)

**Padrões:**
- football_models: mock de `_request` via `unittest.mock.patch.object` (como `test_games_updater_graphql.py`)
- jonebet-api: `TestClient(app)` + `FakeCollection` com `bulk_write` implementado

**Testes necessários:**

| Repo | Teste | O que cobre |
|------|-------|-------------|
| jonebet-api | `test_patch_fixtures_bulk` | PATCH com array atualiza N documentos, retorna contagem |
| jonebet-api | `test_patch_fixtures_empty` | PATCH com array vazio não faz nada |
| football_models | `test_update_fixtures_results` | Lê CSV, filtra por FTHG, chama PATCH com array de uma vez |
| football_models | `test_parse_goals_minutes` | Parse string→array, edge cases (NaN, '[]', malformado) |
| football_models | `test_update_fixtures_results_empty` | Não faz requests se CSV não tem resultados para o dia |

**Gaps atuais:**
- jonebet-api: `FakeCollection` não tem `bulk_write` — precisa implementar
- football_models: zero testes de DatabaseHandler — este será o primeiro

## Decisões

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Coexistência pregame+resultados | PATCH por documento | Preserva pregame do noturno, sem race condition |
| Formato dos minutos | Array real (parse do CSV) | Pronto pro Ticket 3, sem parse downstream |
| Backfill | Script standalone | Não polui pipeline, roda uma vez |
| Endpoint PATCH | `PATCH /fixtures` (bulk com array) | 1 request para N jogos, menos overhead de rede |
| Filtro de envio | `FTHG.notna() and FTHG != 0` | Só envia jogos concluídos |
| Integração no dia.py | Escopo do Ticket 0 | Função sem chamada no pipeline nunca roda; separar seria artificial |

## Risks

| Risco | Mitigação |
|-------|-----------|
| `bulk_write` não implementado no FakeCollection | Implementar antes de testar (~10 linhas) |
| `Fixture_ID` no CSV bate com `_id` no MongoDB | Verificar se `insert_many_or_one` usa `Fixture_ID` como `_id` — se não, ajustar query do PATCH |
| `Goals_H_Minutes` malformado no CSV | `_parse_goals_minutes` faz try/except, fallback para `[]` |
| Pipeline diurno roda sem CSV ter resultado (jogo adiado) | Filtro `FTHG != 0` pula; próxima rodada do dia pega o resultado quando disponível |
