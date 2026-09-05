# Plan: Pipeline diurno — enviar resultados (placar + minutos) pra API

## Goal

Fazer o pipeline diurno enviar placar (FT/HT) e minutos dos gols pra collection `fixtures` da jonebet-api, para que o futuro endpoint `/trading-models` possa calcular resultados (GREEN/RED_LIGHT/RED) via join com `daily-bets`.

## Scope

**In scope:**
- Criar `PATCH /fixtures` (batch, array de {Fixture_ID, ...campos}) na jonebet-api
- Criar `update_fixtures_results(day)` no `DatabaseHandler.py` (football_models)
- Integrar chamada em `dia.py` (após `_update_results_graphql`)
- Script standalone de backfill para dias 2026-09-01, 2026-09-02, 2026-09-03
- Parse de `Goals_H_Minutes` string → array real antes de enviar

**Out of scope:**
- Lógica de cálculo GREEN/RED (Ticket 3)
- Frontend consumindo resultados (Ticket 4)
- Alterações em `GET /fixtures` ou `GET /daily-bets`
- Mudar `update_fixtures()` noturno

## Architecture

```
dia.py (football_models)
  → _update_results_graphql(ontem)  # já existe, preenche CSV
  → dbh.update_fixtures_results(ontem)  # NOVO: PATCH /fixtures
      ↓
  PATCH /fixtures (jonebet-api)
      ↓
  bulk_write([UpdateOne({Fixture_ID: fid}, {$set: campos})])
      ↓
  MongoDB fixtures collection
```

## Tasks (TDD)

### Task 1: FakeCollection.bulk_write (jonebet-api)

**Files:**
- Modify: `jonebet-api/tests/conftest.py:141-147` (após `update_one`)
- Test: `jonebet-api/tests/test_fixtures.py` (novo)

- [ ] **Step 1: Write the failing test**

```python
# tests/test_fixtures.py
def test_patch_fixtures_bulk(client):
    """PATCH /fixtures com array atualiza N documentos."""
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    
    # Setup: criar 2 fixtures
    client.post("/fixtures", json=[
        {"Fixture_ID": "abc", "Date": "2026-09-01", "Home": "A", "Away": "B"},
        {"Fixture_ID": "def", "Date": "2026-09-01", "Home": "C", "Away": "D"},
    ])
    
    # PATCH atualiza os 2
    resp = client.patch("/fixtures", json=[
        {"Fixture_ID": "abc", "FTHG": 2, "FTAG": 1},
        {"Fixture_ID": "def", "FTHG": 0, "FTAG": 3},
    ])
    
    assert resp.status_code == 200
    assert resp.json()["matched"] == 2
    assert resp.json()["modified"] == 2
    
    # Verificar se atualizou
    fixtures = client.get("/fixtures?date=2026-09-01").json()
    assert fixtures[0]["FTHG"] == 2
    assert fixtures[1]["FTAG"] == 3


def test_patch_fixtures_empty(client):
    """PATCH /fixtures com array vazio não faz nada."""
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    resp = client.patch("/fixtures", json=[])
    
    assert resp.status_code == 200
    assert resp.json()["matched"] == 0
    assert resp.json()["modified"] == 0
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd ~/Projetos/jonebet-api && pytest tests/test_fixtures.py -v`
Expected: FAIL (FakeCollection não tem `bulk_write`)

- [ ] **Step 3: Implement bulk_write in FakeCollection**

```python
# tests/conftest.py — adicionar método em FakeCollection
def bulk_write(self, ops):
    """Execute a list of pymongo UpdateOne-like operations."""
    from collections import namedtuple
    Result = namedtuple('BulkWriteResult', ['matched_count', 'modified_count'])
    
    matched = 0
    modified = 0
    for op in ops:
        # pymongo UpdateOne tem ._filter e ._doc
        query = op._filter
        update = op._doc
        for d in self._docs:
            if all(d.get(k) == v for k, v in query.items()):
                if '$set' in update:
                    d.update(update['$set'])
                matched += 1
                modified += 1
                break
    return Result(matched, modified)
```

- [ ] **Step 4: Run test to verify it passes**
Run: `cd ~/Projetos/jonebet-api && pytest tests/test_fixtures.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
cd ~/Projetos/jonebet-api
git add tests/conftest.py tests/test_fixtures.py
git commit -m "test: add FakeCollection.bulk_write + PATCH /fixtures tests"
```

---

### Task 2: PATCH /fixtures endpoint (jonebet-api)

**Files:**
- Modify: `jonebet-api/app/routers/fixtures.py:33-36` (após POST /fixtures)

- [ ] **Step 1: Write the failing test** (já feito no Task 1)

- [ ] **Step 2: Run test to verify it fails**
Run: `cd ~/Projetos/jonebet-api && pytest tests/test_fixtures.py::test_patch_fixtures_bulk -v`
Expected: FAIL (endpoint PATCH não existe)

- [ ] **Step 3: Implement PATCH /fixtures**

```python
# app/routers/fixtures.py — adicionar após POST /fixtures
@router.patch("/fixtures", dependencies=[Depends(get_current_user)])
def patch_fixtures(updates: list[dict], db: Database = Depends(get_db)):
    from pymongo import UpdateOne
    ops = []
    for item in updates:
        fid = item.pop("Fixture_ID")
        ops.append(UpdateOne({"Fixture_ID": fid}, {"$set": item}))
    if ops:
        result = db.fixtures.bulk_write(ops)
        return {"matched": result.matched_count, "modified": result.modified_count}
    return {"matched": 0, "modified": 0}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `cd ~/Projetos/jonebet-api && pytest tests/test_fixtures.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
cd ~/Projetos/jonebet-api
git add app/routers/fixtures.py
git commit -m "feat: add PATCH /fixtures for batch result updates"
```

---

### Task 3: _parse_goals_minutes helper (football_models)

**Files:**
- Create: `football_models/scripts/goals_parser.py` (novo, módulo de parsing)
- Test: `football_models/tests/test_goals_parser.py` (novo)

- [ ] **Step 1: Write the failing test**

```python
# tests/test_goals_parser.py
import pandas as pd
import pytest
from scripts.goals_parser import parse_goals_minutes


def test_parse_goals_minutes_normal():
    assert parse_goals_minutes("['16', '45+2', '67']") == ["16", "45+2", "67"]


def test_parse_goals_minutes_empty_string():
    assert parse_goals_minutes("") == []


def test_parse_goals_minutes_empty_array():
    assert parse_goals_minutes("[]") == []


def test_parse_goals_minutes_nan():
    assert parse_goals_minutes(pd.NA) == []
    assert parse_goals_minutes(float('nan')) == []


def test_parse_goals_minutes_malformed():
    assert parse_goals_minutes("not a list") == []
    assert parse_goals_minutes("['16', broken") == []


def test_parse_goals_minutes_single():
    assert parse_goals_minutes("['90+3']") == ["90+3"]
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd ~/Projetos/football_models && pytest tests/test_goals_parser.py -v`
Expected: FAIL (módulo não existe)

- [ ] **Step 3: Implement parse_goals_minutes**

```python
# scripts/goals_parser.py
import ast

import pandas as pd


def parse_goals_minutes(value) -> list[str]:
    """Parse '["16", "45+2", "67"]' → ["16", "45+2", "67"]. NaN/vazio → []."""
    if pd.isna(value) or value == '' or value == '[]':
        return []
    try:
        parsed = ast.literal_eval(value)
        return [str(m) for m in parsed]
    except (ValueError, SyntaxError):
        return []
```

- [ ] **Step 4: Run test to verify it passes**
Run: `cd ~/Projetos/football_models && pytest tests/test_goals_parser.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
cd ~/Projetos/football_models
git add scripts/goals_parser.py tests/test_goals_parser.py
git commit -m "feat: add parse_goals_minutes helper for CSV string parsing"
```

---

### Task 4: update_fixtures_results (football_models)

**Files:**
- Modify: `football_models/scripts/DatabaseHandler.py:101-135` (após update_fixtures)
- Test: `football_models/tests/test_update_fixtures_results.py` (novo)

- [ ] **Step 1: Write the failing test**

```python
# tests/test_update_fixtures_results.py
import os
import tempfile
from unittest.mock import patch, MagicMock

import pandas as pd
import pytest

from scripts.DatabaseHandler import update_fixtures_results


@pytest.fixture
def sample_csv(tmp_path):
    """Cria CSV de teste com resultados."""
    csv_data = """Fixture ID,Date,Time,League,Home,Away,FTHG,FTAG,HTHG,HTAG,Goals_H_Minutes,Goals_A_Minutes,C_FT_Odds_H,C_FT_Odds_D,C_FT_Odds_A,FT_Odds_H,FT_Odds_D,FT_Odds_A,Odds_O25,Odds_U25,BTTS_Yes,BTTS_No
abc123,2026-09-01,15:00,Brasileirao,Flamengo,Palmeiras,2,1,1,0,"['16', '45+2']","['67']",1.85,3.40,4.20,1.90,3.50,4.00,1.70,2.10,1.65,2.20
def456,2026-09-01,17:00,Brasileirao,Corinthians,Santos,0,0,0,0,"[]","[]",2.10,3.20,3.50,2.15,3.25,3.40,1.80,2.00,1.75,2.05
ghi789,2026-09-02,15:00,Brasileirao,Gremio,Cruzeiro,3,2,2,1,"['10', '33', '90+1']","['55', '78']",1.95,3.30,3.80,2.00,3.35,3.60,1.75,2.05,1.70,2.10"""
    
    csv_path = tmp_path / "Base_Bookie.csv"
    csv_path.write_text(csv_data)
    return csv_path


def test_update_fixtures_results_calls_patch_with_array(sample_csv, tmp_path):
    """update_fixtures_results lê CSV e chama PATCH com array de uma vez."""
    with patch('scripts.DatabaseHandler._request') as mock_request, \
         patch('scripts.DatabaseHandler.pd.read_csv', return_value=pd.read_csv(sample_csv)):
        
        mock_request.return_value = MagicMock(status_code=200)
        update_fixtures_results('2026-09-01')
        
        # Deve ter chamado _request 1 vez (PATCH com array)
        assert mock_request.call_count == 1
        call_args = mock_request.call_args
        
        # method, endpoint, data
        assert call_args[0][0] == 'PATCH'
        assert call_args[0][1] == '/fixtures'
        
        # Data está em json= kwarg
        data = call_args[1]['json']
        assert isinstance(data, list)
        assert len(data) == 3  # abc123, def456, ghi789
        
        # Verificar Fixture_ID e campos
        assert data[0]['Fixture_ID'] == 'abc123'
        assert data[0]['FTHG'] == 2
        assert data[0]['FTAG'] == 1
        assert data[0]['Goals_H_Minutes'] == ['16', '45+2']
        assert data[0]['Goals_A_Minutes'] == ['67']
        
        assert data[1]['Fixture_ID'] == 'def456'
        assert data[1]['FTHG'] == 0
        assert data[1]['Goals_H_Minutes'] == []


def test_update_fixtures_results_empty_day():
    """update_fixtures_results não faz requests se não há resultados."""
    with patch('scripts.DatabaseHandler._request') as mock_request:
        update_fixtures_results('2026-09-99')  # dia sem jogos
        mock_request.assert_not_called()
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd ~/Projetos/football_models && pytest tests/test_update_fixtures_results.py -v`
Expected: FAIL (função não existe)

- [ ] **Step 3: Implement update_fixtures_results**

```python
# scripts/DatabaseHandler.py — adicionar após update_fixtures()
def update_fixtures_results(day):
    """Envia placar FT/HT + minutos dos gols pra fixtures collection via PATCH."""
    from scripts.goals_parser import parse_goals_minutes
    
    local_base_df = pd.read_csv("data/Base_Bookie.csv")
    local_base_df = local_base_df.query("Date == @day").reset_index(drop=True)
    
    if local_base_df.empty:
        print(f"Sem jogos para o dia {day}.\n")
        return
    
    local_base_df.rename(columns={"Fixture ID": "Fixture_ID"}, inplace=True)
    
    # Filtrar apenas jogos com resultado (FTHG não nulo = jogo concluído)
    # FTHG.notna() é suficiente — FTHG=0 é empate 0x0, resultado válido
    results_df = local_base_df[local_base_df['FTHG'].notna()].copy()
    
    if results_df.empty:
        print(f"Sem resultados para o dia {day}.\n")
        return
    
    results = []
    for _, row in results_df.iterrows():
        fixture_id = row['Fixture_ID']
        payload = {
            'FTHG': int(row['FTHG']),
            'FTAG': int(row['FTAG']),
            'HTHG': int(row['HTHG']),
            'HTAG': int(row['HTAG']),
            'Goals_H_Minutes': parse_goals_minutes(row['Goals_H_Minutes']),
            'Goals_A_Minutes': parse_goals_minutes(row['Goals_A_Minutes']),
            'C_FT_Odds_H': row['C_FT_Odds_H'],
            'C_FT_Odds_D': row['C_FT_Odds_D'],
            'C_FT_Odds_A': row['C_FT_Odds_A'],
        }
        results.append((fixture_id, payload))
    
    if results:
        _request('PATCH', '/fixtures', json=[{'Fixture_ID': fid, **payload} for fid, payload in results])
        print(f"Resultados de {len(results)} jogos atualizados para {day}.\n")
```

- [ ] **Step 4: Run test to verify it passes**
Run: `cd ~/Projetos/football_models && pytest tests/test_update_fixtures_results.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
cd ~/Projetos/football_models
git add scripts/DatabaseHandler.py
git commit -m "feat: add update_fixtures_results to push scores to API"
```

---

### Task 5: Integração no dia.py (football_models)

**Files:**
- Modify: `football_models/pipelines/dia.py:77` (após _update_results_graphql)

- [ ] **Step 1: Write the failing test**

```python
# tests/test_dia_integration.py
from unittest.mock import patch, MagicMock

import pytest


def test_dia_pipeline_calls_update_fixtures_results():
    """Pipeline diurno chama update_fixtures_results após _update_results_graphql."""
    with patch('pipelines.dia.dbh') as mock_dbh, \
         patch('pipelines.dia.FS') as mock_fs, \
         patch('pipelines.dia._update_results_graphql') as mock_graphql, \
         patch('pipelines.dia.papermill') as mock_papermill, \
         patch('pipelines.dia.send_daily_lay0x1_results') as mock_lay0x1:
        
        from pipelines.dia import run
        from utils.telegram_messenger import TelegramMessenger
        
        messenger = MagicMock(spec=TelegramMessenger)
        repo = MagicMock()
        
        run(messenger, repo)
        
        # Verificar se update_fixtures_results foi chamado
        mock_dbh.update_fixtures_results.assert_called_once()
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd ~/Projetos/football_models && pytest tests/test_dia_integration.py -v`
Expected: FAIL (dia.py não chama update_fixtures_results)

- [ ] **Step 3: Add _step call in dia.py**

```python
# pipelines/dia.py — adicionar após linha 77
_step("Enviar resultados pra API", lambda: dbh.update_fixtures_results(ontem), messenger)
```

- [ ] **Step 4: Run test to verify it passes**
Run: `cd ~/Projetos/football_models && pytest tests/test_dia_integration.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
cd ~/Projetos/football_models
git add pipelines/dia.py
git commit -m "feat: integrate update_fixtures_results into daytime pipeline"
```

---

### Task 6: Script de backfill (football_models)

**Files:**
- Create: `football_models/scripts/backfill_fixtures_results.py` (novo)

- [ ] **Step 1: Write the failing test**

```python
# tests/test_backfill_fixtures_results.py
from unittest.mock import patch, MagicMock

import pytest


def test_backfill_runs_for_3_days():
    """Backfill roda para 2026-09-01, 2026-09-02, 2026-09-03."""
    with patch('scripts.backfill_fixtures_results.dbh') as mock_dbh:
        mock_dbh.login.return_value = True
        
        from scripts.backfill_fixtures_results import main
        main()
        
        # Deve ter chamado update_fixtures_results 3 vezes
        assert mock_dbh.update_fixtures_results.call_count == 3
        calls = [call[0][0] for call in mock_dbh.update_fixtures_results.call_args_list]
        assert calls == ['2026-09-01', '2026-09-02', '2026-09-03']


def test_backfill_exits_on_login_failure():
    """Backfill sai se login falhar."""
    with patch('scripts.backfill_fixtures_results.dbh') as mock_dbh:
        mock_dbh.login.return_value = False
        
        from scripts.backfill_fixtures_results import main
        
        with pytest.raises(SystemExit):
            main()
```

- [ ] **Step 2: Run test to verify it fails**
Run: `cd ~/Projetos/football_models && pytest tests/test_backfill_fixtures_results.py -v`
Expected: FAIL (script não existe)

- [ ] **Step 3: Implement backfill script**

```python
# scripts/backfill_fixtures_results.py
"""Backfill: envia resultados dos dias 1, 2 e 3/09 pra API."""
import sys

import scripts.DatabaseHandler as dbh


def main():
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

- [ ] **Step 4: Run test to verify it passes**
Run: `cd ~/Projetos/football_models && pytest tests/test_backfill_fixtures_results.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
cd ~/Projetos/football_models
git add scripts/backfill_fixtures_results.py
git commit -m "feat: add backfill script for days 01-03/09"
```

---

## Execution Order

1. Task 1 (FakeCollection.bulk_write) — prerequisite for Task 2
2. Task 2 (PATCH /fixtures endpoint)
3. Task 3 (_parse_goals_minutes) — independent, can run parallel with 1-2
4. Task 4 (update_fixtures_results) — depends on Task 3
5. Task 5 (dia.py integration) — depends on Task 4
6. Task 6 (backfill script) — depends on Task 4

## Test Commands

```bash
# jonebet-api
cd ~/Projetos/jonebet-api
pytest tests/test_fixtures.py -v

# football_models
cd ~/Projetos/football_models
pytest tests/test_goals_parser.py tests/test_update_fixtures_results.py tests/test_dia_integration.py tests/test_backfill_fixtures_results.py -v
```

## Decisions

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| PATCH batch | Array com `bulk_write` | 1 request/dia em vez de ~20 |
| Parse minutos | `ast.literal_eval` | String do CSV → array real |
| Módulo parsing | `scripts/goals_parser.py` separado | Reutilizável, testável isoladamente |
| Filtro envio | `FTHG.notna()` (sem `!= 0`) | Empate 0x0 é resultado válido, não pode ser pulado |
| Backfill | Script standalone com `import scripts.DatabaseHandler as dbh` | Segue padrão de dia.py e noite.py (DatabaseHandler é módulo de funções, não classe) |
| Query PATCH | `Fixture_ID` (não `_id`) | MongoDB usa `Fixture_ID` como campo identificador, `_id` é ObjectId automático |
| Chamada `_request` | Com `json=` kwarg | `_request(method, endpoint, **kwargs)` só aceita 2 args posicionais |

## Risks

| Risco | Mitigação |
|-------|-----------|
| `Fixture_ID` no CSV bate com campo no MongoDB | Confirmado: `insert_many_or_one` preserva `Fixture_ID` como campo do documento |
| `Goals_H_Minutes` malformado no CSV | `parse_goals_minutes` faz try/except, fallback para `[]` |
| Pipeline diurno roda sem CSV ter resultado | Filtro `FTHG.notna()` pula; próxima rodada pega quando disponível |
| `UpdateOne` mock no FakeCollection | Implementar compatível com `._filter` e `._doc` |
