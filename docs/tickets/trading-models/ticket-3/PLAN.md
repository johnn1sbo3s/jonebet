# Trading Models Ticket 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended), superpowers:executing-plans, or unlazy to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dois endpoints GET públicos na jonebet-api (`/trading-models/daily`, `/trading-models/summary`) com settlement lay_0x1 no backend.

**Architecture:** Funções puras em `trading_simulator.py` (réplica de `football_models/.../simulator.py` + `pnl_resultado`, sem pandas); `trading_service.py` faz join `daily-bets` × `fixtures` por `(Date,Home,Away)` e agrupa; router fino delega ao service (mesmo padrão de `daily_bets.py` → `database.get_daily_bets()`).

**Tech Stack:** FastAPI + pymongo (prod); pytest + FakeDB/FakeCollection em `tests/conftest.py` (testes, sem Mongo).

**Repo de implementação:** `/Users/jone/Projetos/jonebet-api` (SPEC e PLAN versionados em `jonebet-frontend/docs/tickets/trading-models/ticket-3/`).

## Global Constraints

- TDD: teste falha primeiro, implementação mínima, teste passa, commit por task.
- GET público, sem `Depends(get_current_user)` (front não manda token).
- Score arrays `[h, a]` inteiros; `null` só em PENDING.
- `goals_home`/`goals_away`: strings originais (`"45+2"` preservado); parse pra int só interno.
- Semana Seg–Dom + mês atual em `America/Sao_Paulo` explícito (nunca UTC do container).
- Escopo `lay_0x1_*` (`Modelo.startswith('lay_0x1_')` em Python, não regex Mongo — FakeDB não suporta regex).
- Não rodar suite completa/lint durante as tasks; verificação final na Task 8.
- Sem commit sem consentimento do usuário (ao final de cada task, parar e pedir confirmação do commit).

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `app/services/trading_simulator.py` (CRIAR) | `tokenize_minutes`, `parse_minutes`, `score_at_minute`, `simulate_match`, `pnl_resultado`, `STAKE`. Puro, sem DB, sem pandas. |
| `app/services/trading_service.py` (CRIAR) | `_settle_range(db, start, end)`, `_settle_bet(bet, fixture)`, `get_daily(db, date)`, `get_summary(db, today=None)`. Único lugar que toca o Mongo. |
| `app/routers/trading_models.py` (CRIAR) | 2 GET finos, `response_model` Pydantic, sem lógica. |
| `app/schemas/responses.py` (EDITAR) | `TradingDailyResponse`, `TradingSummaryResponse` (top-level tipado + `list[dict]`/`dict` passthrough, padrão `DailyBetsEnvelope`). |
| `app/main.py` (EDITAR) | import + `include_router` (2 linhas, padrão linhas 41-60). |
| `tests/conftest.py` (EDITAR) | `find`/`find_one` passam a aceitar `$gte`/`$lte`/`$gt`/`$lt` (aditivo; igualdade exata inalterada). |
| `tests/test_trading_models.py` (CRIAR) | Todos os testes do ticket. |

**Interfaces (contratos entre tasks):**
- `trading_simulator.tokenize_minutes(value: str | list | None) -> list[str]`
- `trading_simulator.parse_minutes(value: str | list | None) -> list[int]`
- `trading_simulator.score_at_minute(goals_h: list[int], goals_a: list[int], minute: int) -> tuple[int, int]`
- `trading_simulator.simulate_match(ht_h: int, ht_a: int, goals_h: list[int], goals_a: list[int]) -> str`
- `trading_simulator.pnl_resultado(result: str, odd: float) -> float`, `trading_simulator.STAKE = 10.0`
- `trading_service.get_daily(db, date: str) -> {"date": str, "daily": [{"model", "model_label", "subtotal", "bets": [...]}]}`
- `trading_service.get_summary(db, today: str | date | None) -> {"week": {"start_date", "end_date", "rows"}, "month": {"year", "month", "rows"}}`
- Bet dict: `{"fixture_id", "home", "away", "time", "odd", "ht_score" | None, "minute_70_score" | None, "ft_score" | None, "goals_home" | None, "goals_away" | None, "result", "profit"}`
- Row dict: `{"model", "model_label", "games", "green", "red_light", "red", "total"}` (só bets resolvidas; PENDING excluído do summary)

---

### Task 1: Operadores de range no FakeDB

**Files:**
- Modify: `/Users/jone/Projetos/jonebet-api/tests/conftest.py:103-113`
- Test: `/Users/jone/Projetos/jonebet-api/tests/test_trading_models.py`

**Interfaces:**
- Consumes: nada (infra de teste existente)
- Produces: `find`/`find_one` com `$gte`/`$lte`/`$gt`/`$lt` pra Task 3+ (queries por período no summary)

Contexto: `FakeCollection.find` hoje só faz `d.get(k) == v` (conftest.py:109-113). O summary precisa `{'Date': {'$gte': s, '$lte': e}}` (ISO compara lexicograficamente). Extensão aditiva — igualdade exata continua igual.

- [ ] **Step 1: Write the failing test**

```python
def test_find_range_operators(client):
    from tests.conftest import FakeDB
    db = FakeDB({'c': [{'Date': '2026-09-01'}, {'Date': '2026-09-03'}, {'Date': '2026-09-05'}]})
    got = db.c.find({'Date': {'$gte': '2026-09-02', '$lte': '2026-09-04'}})
    assert [d['Date'] for d in got] == ['2026-09-03']
    assert db.c.find_one({'Date': {'$gte': '2026-09-04'}}) == {'Date': '2026-09-05'}
    # igualdade exata continua funcionando
    assert db.c.find({'Date': '2026-09-01'}) == [{'Date': '2026-09-01'}]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py::test_find_range_operators -v`
Expected: FAIL (`$gte` dict comparado com `==` não matcha nada → lista vazia)

- [ ] **Step 3: Write minimal implementation**

Em `tests/conftest.py`, adicionar helper e trocar os `all(...)` de `find`/`find_one`:

```python
def _match_query(doc, query):
    for k, v in (query or {}).items():
        if isinstance(v, dict):
            val = doc.get(k)
            for op, operand in v.items():
                if op == '$gte' and not (val is not None and val >= operand):
                    return False
                if op == '$lte' and not (val is not None and val <= operand):
                    return False
                if op == '$gt' and not (val is not None and val > operand):
                    return False
                if op == '$lt' and not (val is not None and val < operand):
                    return False
        elif doc.get(k) != v:
            return False
    return True
```

`find`: `return [d for d in self._docs if _match_query(d, query)]`
`find_one`: `if _match_query(d, query): return d`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py::test_find_range_operators -v`
Expected: PASS

- [ ] **Step 5: Run existing suite for regressions**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_routes.py tests/test_fixtures.py tests/test_metrics.py -q`
Expected: todos passam (mudança aditiva)

- [ ] **Step 6: Commit** (pedir confirmação do usuário antes)

```bash
git add tests/conftest.py tests/test_trading_models.py
git commit -m "test: FakeDB find/find_one com operadores de range"
```

---

### Task 2: `trading_simulator.py` (réplica pura)

**Files:**
- Create: `/Users/jone/Projetos/jonebet-api/app/services/trading_simulator.py`
- Test: `/Users/jone/Projetos/jonebet-api/tests/test_trading_models.py`

**Interfaces:**
- Consumes: nada
- Produces: as 5 funções + `STAKE` (Task 3 usa `tokenize_minutes`, `parse_minutes`, `score_at_minute`, `simulate_match`, `pnl_resultado`)

Réplica de `football_models/scripts/lay_0x1_backtest/simulator.py:14-76` + `lay_0x1_report.py:239-248`, sem pandas. Diferença intencional: `tokenize_minutes` expõe os tokens crus (pro `goals_home`/`goals_away` da resposta); branch de lista aceita `str` e `int` (Ticket 0 gravou arrays de strings no Mongo, ex. `["16", "45+2"]`).

- [ ] **Step 1: Write the failing tests**

```python
from app.services import trading_simulator as sim


def test_parse_minutes_string():
    assert sim.parse_minutes("['16', '45+2']") == [16, 47]


def test_parse_minutes_ticket0_array_form():
    assert sim.parse_minutes(['16', '45+2']) == [16, 47]


def test_parse_minutes_empty():
    assert sim.parse_minutes('[]') == []
    assert sim.parse_minutes(None) == []
    assert sim.parse_minutes([]) == []


def test_tokenize_preserves_extra_time():
    assert sim.tokenize_minutes("['16', '45+2']") == ['16', '45+2']


def test_score_at_minute():
    assert sim.score_at_minute([16, 67], [55], 70) == (2, 1)


def test_simulate_ht_scoreless_is_red_light():
    assert sim.simulate_match(0, 0, [67], [55]) == 'RED_LIGHT'


def test_simulate_70_0x1_is_red():
    assert sim.simulate_match(1, 0, [80], [55]) == 'RED'


def test_simulate_green():
    assert sim.simulate_match(1, 0, [16], [55, 68]) == 'GREEN'


def test_pnl_green():
    assert sim.pnl_resultado('GREEN', 7.5) == 10.0


def test_pnl_red_light():
    assert sim.pnl_resultado('RED_LIGHT', 5.0) == -2.0  # -5% x 10 x (5-1)


def test_pnl_red():
    assert sim.pnl_resultado('RED', 5.0) == -12.0  # -30% x 10 x (5-1)


def test_pnl_unknown_raises():
    import pytest
    with pytest.raises(ValueError):
        sim.pnl_resultado('PENDING', 5.0)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "parse_minutes or tokenize or score_at or simulate or pnl"`
Expected: FAIL (`No module named 'app.services.trading_simulator'`)

- [ ] **Step 3: Write minimal implementation**

```python
"""Lay 0x1 settlement math.

Réplica de football_models/scripts/lay_0x1_backtest/simulator.py
+ lay_0x1_report.py::pnl_resultado. Repos/deploy separados impedem import;
se as regras mudarem lá, replicar aqui (drift documentado na SPEC ticket-3).
"""

STAKE = 10.0


def tokenize_minutes(value):
    """Tokens crus dos minutos, ex. "['16', '45+2']" -> ['16', '45+2']."""
    if value is None:
        return []
    if isinstance(value, list):
        return [str(m) for m in value if m is not None]
    if not isinstance(value, str):
        return []
    s = value.strip()
    if s in ('[]', ''):
        return []
    inner = s.strip('[]')
    if not inner.strip():
        return []
    return [p.strip().strip("'\"") for p in inner.split(',') if p.strip().strip("'\"")]


def _to_int(token):
    try:
        if '+' in token:
            base, extra = token.split('+')
            val = int(base) + int(extra)
        else:
            val = int(token)
        return val if val > 0 else None
    except (ValueError, TypeError):
        return None


def parse_minutes(value):
    """Tokens -> inteiros ordenáveis ('45+2' -> 47, só pra matemática)."""
    return [v for v in (_to_int(t) for t in tokenize_minutes(value)) if v is not None]


def score_at_minute(goals_h, goals_a, minute):
    """Placar acumulado até o minuto."""
    h = sum(1 for m in goals_h if m <= minute)
    a = sum(1 for m in goals_a if m <= minute)
    return (h, a)


def simulate_match(ht_h, ht_a, goals_h, goals_a):
    """'GREEN', 'RED_LIGHT' ou 'RED'. HT vem do dataset, 70' dos minutos."""
    if ht_h == 0 and ht_a == 0:
        return 'RED_LIGHT'
    if score_at_minute(goals_h, goals_a, 70) == (0, 1):
        return 'RED'
    return 'GREEN'


def pnl_resultado(result, odd):
    """Valor em R$ com stake 10."""
    if result == 'GREEN':
        return STAKE
    liability = STAKE * (float(odd) - 1)
    if result == 'RED_LIGHT':
        return -0.05 * liability
    if result == 'RED':
        return -0.30 * liability
    raise ValueError(f'Resultado desconhecido: {result}')
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "parse_minutes or tokenize or score_at or simulate or pnl"`
Expected: 12 PASS

- [ ] **Step 5: Commit** (pedir confirmação do usuário antes)

```bash
git add app/services/trading_simulator.py tests/test_trading_models.py
git commit -m "feat: trading_simulator com settlement lay_0x1"
```

---

### Task 3: `_settle_bet` + `_settle_range` (coração do service)

**Files:**
- Create: `/Users/jone/Projetos/jonebet-api/app/services/trading_service.py`
- Test: `/Users/jone/Projetos/jonebet-api/tests/test_trading_models.py`

**Interfaces:**
- Consumes: Task 2 (`trading_simulator.*`), `database.market_label` (existente, `database.py:70-103`)
- Produces: `_settle_range(db, start, end) -> list[dict]` (Tasks 4-5 agrupam; cada dict já tem `model` = `Modelo` original)

Queries: bets `find({'Date': {'$gte': s, '$lte': e}})` + filtro Python `startswith('lay_0x1_')`; fixtures `find(range, {projection})`. Projection: `Date, Home, Away, Fixture_ID, Time, FTHG, FTAG, HTHG, HTAG, Goals_H_Minutes, Goals_A_Minutes, _id: 0` (FakeDB ignora projection, Mongo real aplica — mesmo padrão de `get_daily_bets`, database.py:153-161).

Regras de `_settle_bet`:
- Sem fixture ou `FTHG`/`FTAG` None → PENDING: scores `None`, `goals_*` `None`, `profit` 0.0
- `fixture_id`: `fixture.get('Fixture_ID') if fixture else bet.get('Fixture_ID')` (padrão database.py:171)
- `time`: `bet.get('Time') or fixture.get('Time') or ''`
- `odd`: `bet.get('Odds')` (lay odd do generator; `resolve_model_odd` retorna None pra lay_0x1 então não usar)
- odd None + GREEN → +10; odd None + RED_* → 0.0 (generator sempre preenche; fallback documentado)
- `ht`: `[int(HTHG or 0), int(HTAG or 0)]`; `minute_70_score`: `list(score_at_minute(gh, ga, 70))`; `ft`: `[int(FTHG), int(FTAG)]`
- `profit`: `round(pnl, 2)`

- [ ] **Step 1: Write the failing tests**

```python
def test_settle_green_bet():
    from tests.conftest import FakeDB
    from app.services import trading_service
    db = FakeDB({
        'daily-bets': [
            {'Date': '2026-09-05', 'Home': 'Fla', 'Away': 'Pal',
             'Modelo': 'lay_0x1_v1', 'Odds': 7.5, 'Fixture_ID': 'f1'},
        ],
        'fixtures': [
            {'Date': '2026-09-05', 'Home': 'Fla', 'Away': 'Pal', 'Fixture_ID': 'f1',
             'Time': '20:00', 'HTHG': 1, 'HTAG': 0, 'FTHG': 2, 'FTAG': 3,
             'Goals_H_Minutes': ['34', '80'], 'Goals_A_Minutes': ['54', '68', '84']},
        ],
    })
    got = trading_service._settle_range(db, '2026-09-05', '2026-09-05')
    assert len(got) == 1
    bet = got[0]
    assert bet['model'] == 'lay_0x1_v1'
    assert bet['ht_score'] == [1, 0]
    assert bet['minute_70_score'] == [1, 2]
    assert bet['ft_score'] == [2, 3]
    assert bet['goals_home'] == ['34', '80']
    assert bet['goals_away'] == ['54', '68', '84']
    assert bet['result'] == 'GREEN'
    assert bet['profit'] == 10.0
    assert bet['time'] == '20:00'


def test_settle_pending_without_fixture():
    from tests.conftest import FakeDB
    from app.services import trading_service
    db = FakeDB({
        'daily-bets': [
            {'Date': '2026-09-05', 'Home': 'A', 'Away': 'B',
             'Modelo': 'lay_0x1_v1', 'Odds': 7.5},
        ],
        'fixtures': [],
    })
    (bet,) = trading_service._settle_range(db, '2026-09-05', '2026-09-05')
    assert bet['result'] == 'PENDING'
    assert bet['ht_score'] is None
    assert bet['ft_score'] is None
    assert bet['goals_home'] is None
    assert bet['profit'] == 0.0


def test_settle_ignores_non_lay0x1():
    from tests.conftest import FakeDB
    from app.services import trading_service
    db = FakeDB({
        'daily-bets': [
            {'Date': '2026-09-05', 'Home': 'C', 'Away': 'D',
             'Modelo': 'back_home_v2', 'Odds': 1.5},
        ],
        'fixtures': [],
    })
    assert trading_service._settle_range(db, '2026-09-05', '2026-09-05') == []


def test_settle_red_bet():
    from tests.conftest import FakeDB
    from app.services import trading_service
    db = FakeDB({
        'daily-bets': [
            {'Date': '2026-09-05', 'Home': 'X', 'Away': 'Y',
             'Modelo': 'lay_0x1_v1', 'Odds': 5.0},
        ],
        'fixtures': [
            {'Date': '2026-09-05', 'Home': 'X', 'Away': 'Y', 'Fixture_ID': 'f9',
             'Time': '16:00', 'HTHG': 1, 'HTAG': 0, 'FTHG': 1, 'FTAG': 1,
             'Goals_H_Minutes': ['80'], 'Goals_A_Minutes': ['55']},
        ],
    })
    (bet,) = trading_service._settle_range(db, '2026-09-05', '2026-09-05')
    # HT 1x0 (não RL); 70': casa 0 (80 > 70), fora 1 -> (0,1) -> RED
    assert bet['minute_70_score'] == [0, 1]
    assert bet['result'] == 'RED'
    assert bet['profit'] == -12.0  # -30% x 10 x (5-1)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "settle"`
Expected: FAIL (módulo não existe)

- [ ] **Step 3: Write minimal implementation**

```python
"""Trading models: join daily-bets x fixtures + settlement lay_0x1."""
from app.services import database
from app.services import trading_simulator as sim

MODEL_PREFIX = 'lay_0x1_'

_FIXTURE_PROJECTION = {
    'Date': 1, 'Home': 1, 'Away': 1, 'Fixture_ID': 1, 'Time': 1,
    'FTHG': 1, 'FTAG': 1, 'HTHG': 1, 'HTAG': 1,
    'Goals_H_Minutes': 1, 'Goals_A_Minutes': 1,
    '_id': 0,
}


def _settle_bet(bet, fixture):
    fixture_id = (fixture or {}).get('Fixture_ID') or bet.get('Fixture_ID')
    time = bet.get('Time') or (fixture or {}).get('Time') or ''
    odd = bet.get('Odds')
    base = {
        'fixture_id': fixture_id,
        'model': bet.get('Modelo'),
        'home': bet.get('Home'),
        'away': bet.get('Away'),
        'time': time,
        'odd': odd,
    }
    if fixture is None or fixture.get('FTHG') is None or fixture.get('FTAG') is None:
        return {**base, 'ht_score': None, 'minute_70_score': None, 'ft_score': None,
                'goals_home': None, 'goals_away': None, 'result': 'PENDING', 'profit': 0.0}
    gh_tokens = sim.tokenize_minutes(fixture.get('Goals_H_Minutes'))
    ga_tokens = sim.tokenize_minutes(fixture.get('Goals_A_Minutes'))
    gh = sim.parse_minutes(gh_tokens)
    ga = sim.parse_minutes(ga_tokens)
    ht = [int(fixture.get('HTHG') or 0), int(fixture.get('HTAG') or 0)]
    m70 = list(sim.score_at_minute(gh, ga, 70))
    ft = [int(fixture['FTHG']), int(fixture['FTAG'])]
    result = sim.simulate_match(ht[0], ht[1], gh, ga)
    if odd is None:
        profit = sim.STAKE if result == 'GREEN' else 0.0
    else:
        profit = sim.pnl_resultado(result, odd)
    return {**base, 'ht_score': ht, 'minute_70_score': m70, 'ft_score': ft,
            'goals_home': gh_tokens, 'goals_away': ga_tokens,
            'result': result, 'profit': round(profit, 2)}


def _settle_range(db, start, end):
    """Bets lay_0x1 liquidadas no período [start, end] (ISO, inclusivo)."""
    bets = db['daily-bets'].find({'Date': {'$gte': start, '$lte': end}})
    bets = [b for b in bets if (b.get('Modelo') or '').startswith(MODEL_PREFIX)]
    fixtures = db['fixtures'].find(
        {'Date': {'$gte': start, '$lte': end}}, _FIXTURE_PROJECTION)

    fixture_map = {(f.get('Date'), f.get('Home'), f.get('Away')): f for f in fixtures}
    return [_settle_bet(b, fixture_map.get((b.get('Date'), b.get('Home'), b.get('Away'))))
            for b in bets]
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "settle"`
Expected: 4 PASS (green, pending, ignores, red)

- [ ] **Step 5: Commit** (pedir confirmação do usuário antes)

```bash
git add app/services/trading_service.py tests/test_trading_models.py
git commit -m "feat: trading_service settle bet x fixture"
```

---

### Task 4: `get_daily` (agrupamento por modelo)

**Files:**
- Modify: `/Users/jone/Projetos/jonebet-api/app/services/trading_service.py`
- Test: `/Users/jone/Projetos/jonebet-api/tests/test_trading_models.py`

**Interfaces:**
- Consumes: Task 3 (`_settle_range`)
- Produces: `get_daily(db, date)` (Task 6, router daily)

Resposta: `{"date", "daily": [{"model", "model_label", "subtotal", "bets"}]}`. `model_label` via `database.market_label` (existente; `'lay_0x1_v1'` → `'0x1'`). `subtotal` = `round(soma profits, 2)`.

- [ ] **Step 1: Write the failing tests**

```python
def test_get_daily_groups_and_subtotal():
    from tests.conftest import FakeDB
    from app.services import trading_service
    db = FakeDB({
        'daily-bets': [
            {'Date': '2026-09-05', 'Home': 'Fla', 'Away': 'Pal',
             'Modelo': 'lay_0x1_v1', 'Odds': 7.5},
            {'Date': '2026-09-05', 'Home': 'Gre', 'Away': 'Int',
             'Modelo': 'lay_0x1_v1', 'Odds': 3.2},
        ],
        'fixtures': [
            {'Date': '2026-09-05', 'Home': 'Fla', 'Away': 'Pal', 'Fixture_ID': 'f1',
             'Time': '20:00', 'HTHG': 1, 'HTAG': 0, 'FTHG': 2, 'FTAG': 3,
             'Goals_H_Minutes': ['34', '80'], 'Goals_A_Minutes': ['54', '68', '84']},
            {'Date': '2026-09-05', 'Home': 'Gre', 'Away': 'Int', 'Fixture_ID': 'f2',
             'Time': '21:30', 'HTHG': 1, 'HTAG': 1, 'FTHG': 1, 'FTAG': 1,
             'Goals_H_Minutes': ['10'], 'Goals_A_Minutes': ['20']},
        ],
    })
    got = trading_service.get_daily(db, '2026-09-05')
    assert got['date'] == '2026-09-05'
    (group,) = got['daily']
    assert group['model'] == 'lay_0x1_v1'
    assert group['model_label'] == '0x1'
    assert len(group['bets']) == 2
    # Fla-Pal GREEN (+10) + Gre-Int GREEN (+10): HT 1x1, 70' (1,1) -> GREEN
    assert group['subtotal'] == 20.0


def test_get_daily_empty():
    from tests.conftest import FakeDB
    from app.services import trading_service
    db = FakeDB({'daily-bets': [], 'fixtures': []})
    assert trading_service.get_daily(db, '2026-09-05') == {'date': '2026-09-05', 'daily': []}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "get_daily"`
Expected: FAIL (`get_daily` não existe)

- [ ] **Step 3: Write minimal implementation**

Append em `trading_service.py`:

```python
def get_daily(db, date):
    """Cards do dia agrupados por modelo."""
    groups = {}
    for bet in _settle_range(db, date, date):
        groups.setdefault(bet['model'], []).append(bet)
    daily = [
        {'model': model,
         'model_label': database.market_label(model),
         'subtotal': round(sum(b['profit'] for b in bets), 2),
         'bets': bets}
        for model, bets in groups.items()
    ]
    return {'date': date, 'daily': daily}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "get_daily"`
Expected: 2 PASS

- [ ] **Step 5: Commit** (pedir confirmação do usuário antes)

```bash
git add app/services/trading_service.py tests/test_trading_models.py
git commit -m "feat: trading_service get_daily agrupado por modelo"
```

---

### Task 5: `get_summary` (semana Seg–Dom + mês)

**Files:**
- Modify: `/Users/jone/Projetos/jonebet-api/app/services/trading_service.py`
- Test: `/Users/jone/Projetos/jonebet-api/tests/test_trading_models.py`

**Interfaces:**
- Consumes: Task 3 (`_settle_range`)
- Produces: `get_summary(db, today=None)` (Task 6, router summary)

Regras: `today` default = data atual em `America/Sao_Paulo` (padrão `database.py:140`); aceita `str`/`date` (testabilidade). `week_start = today - weekday()` (réplica de `inicio_semana`, lay_0x1_report.py:251-255), `week_end = +6 dias`. Mês: dia 1 → `calendar.monthrange`. PENDING excluído das linhas (agregado = só resolvidas). Linha: `games` = nº bets resolvidas; contadores por resultado; `total` = `round(soma, 2)`.

- [ ] **Step 1: Write the failing tests**

```python
def _summary_db():
    from tests.conftest import FakeDB
    return FakeDB({
        'daily-bets': [
            # segunda 31/08 — dentro da semana de 2026-09-05
            {'Date': '2026-08-31', 'Home': 'A', 'Away': 'B',
             'Modelo': 'lay_0x1_v1', 'Odds': 7.5},
            # sábado 05/09 — dentro
            {'Date': '2026-09-05', 'Home': 'C', 'Away': 'D',
             'Modelo': 'lay_0x1_v1', 'Odds': 5.0},
            # domingo anterior 30/08 — fora da semana, fora do mês
            {'Date': '2026-08-30', 'Home': 'E', 'Away': 'F',
             'Modelo': 'lay_0x1_v1', 'Odds': 5.0},
            # PENDING (sem fixture) — visível no daily, fora do summary
            {'Date': '2026-09-05', 'Home': 'G', 'Away': 'H',
             'Modelo': 'lay_0x1_v1', 'Odds': 5.0},
        ],
        'fixtures': [
            {'Date': '2026-08-31', 'Home': 'A', 'Away': 'B', 'Fixture_ID': 'f1',
             'Time': '20:00', 'HTHG': 1, 'HTAG': 0, 'FTHG': 2, 'FTAG': 1,
             'Goals_H_Minutes': ['10', '80'], 'Goals_A_Minutes': ['50']},
            {'Date': '2026-09-05', 'Home': 'C', 'Away': 'D', 'Fixture_ID': 'f2',
             'Time': '18:00', 'HTHG': 0, 'HTAG': 0, 'FTHG': 0, 'FTAG': 1,
             'Goals_H_Minutes': [], 'Goals_A_Minutes': ['60']},
            {'Date': '2026-08-30', 'Home': 'E', 'Away': 'F', 'Fixture_ID': 'f3',
             'Time': '16:00', 'HTHG': 1, 'HTAG': 0, 'FTHG': 1, 'FTAG': 0,
             'Goals_H_Minutes': ['10'], 'Goals_A_Minutes': []},
        ],
    })


def test_get_summary_week_is_mon_to_sun():
    from app.services import trading_service
    got = trading_service.get_summary(_summary_db(), today='2026-09-05')
    assert got['week']['start_date'] == '2026-08-31'
    assert got['week']['end_date'] == '2026-09-06'
    (row,) = got['week']['rows']
    assert row['model'] == 'lay_0x1_v1'
    assert row['games'] == 2  # 31/08 GREEN + 05/09 RED_LIGHT; PENDING e 30/08 fora
    assert row['green'] == 1
    assert row['red_light'] == 1
    assert row['red'] == 0
    # 05/09: HT 0x0 -> RED_LIGHT, odd 5.0 -> -0.05*10*4 = -2.0; 31/08 GREEN +10
    assert row['total'] == 8.0


def test_get_summary_month():
    from app.services import trading_service
    got = trading_service.get_summary(_summary_db(), today='2026-09-05')
    assert got['month'] == {'year': 2026, 'month': 9, 'rows': got['month']['rows']}
    (row,) = got['month']['rows']
    assert row['games'] == 1  # só 05/09; 31/08 e 30/08 são agosto
    assert row['red_light'] == 1
    assert row['total'] == -2.0
```

Checar matemática do teste 1: bet 31/08 — HT 1x0 (não RL); 70': home ≤70: [10] → 1; away ≤70: [50] → 1 → (1,1) → GREEN → +10. Bet 05/09 — HT 0x0 → RED_LIGHT → −0.05×10×(5−1) = −2.0. Total 8.0 ✓. Bet 30/08 fora da semana ✓ (segunda 31/08 é o início). Mês: só 05/09 ✓.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "get_summary"`
Expected: FAIL (`get_summary` não existe)

- [ ] **Step 3: Write minimal implementation**

Append em `trading_service.py`:

```python
import calendar
from datetime import datetime, timedelta
import pytz

SP_TZ = pytz.timezone('America/Sao_Paulo')


def _aggregate(bets):
    groups = {}
    for bet in bets:
        if bet['result'] == 'PENDING':
            continue
        row = groups.setdefault(bet['model'], {
            'model': bet['model'], 'model_label': database.market_label(bet['model']),
            'games': 0, 'green': 0, 'red_light': 0, 'red': 0, 'total': 0.0})
        row['games'] += 1
        if bet['result'] == 'GREEN':
            row['green'] += 1
        elif bet['result'] == 'RED_LIGHT':
            row['red_light'] += 1
        elif bet['result'] == 'RED':
            row['red'] += 1
        row['total'] = round(row['total'] + bet['profit'], 2)
    return list(groups.values())


def get_summary(db, today=None):
    """Semana atual (Seg-Dom) + mês atual, agregados por modelo. Só resolvidas."""
    if today is None:
        today = datetime.now(SP_TZ).date()
    elif isinstance(today, str):
        today = datetime.strptime(today, '%Y-%m-%d').date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    month_start = today.replace(day=1)
    month_end = today.replace(day=calendar.monthrange(today.year, today.month)[1])
    week_bets = _settle_range(db, week_start.isoformat(), week_end.isoformat())
    month_bets = _settle_range(db, month_start.isoformat(), month_end.isoformat())
    return {
        'week': {'start_date': week_start.isoformat(), 'end_date': week_end.isoformat(),
                 'rows': _aggregate(week_bets)},
        'month': {'year': today.year, 'month': today.month,
                  'rows': _aggregate(month_bets)},
    }
```

Nota: imports `calendar`, `datetime`, `timedelta`, `pytz` — colocar no topo do arquivo na primeira edição (a Task 3 criou o arquivo sem eles; esta task adiciona).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "get_summary"`
Expected: 2 PASS

- [ ] **Step 5: Commit** (pedir confirmação do usuário antes)

```bash
git add app/services/trading_service.py tests/test_trading_models.py
git commit -m "feat: trading_service get_summary semanal e mensal"
```

---

### Task 6: Schemas + router + registro

**Files:**
- Modify: `/Users/jone/Projetos/jonebet-api/app/schemas/responses.py`
- Create: `/Users/jone/Projetos/jonebet-api/app/routers/trading_models.py`
- Modify: `/Users/jone/Projetos/jonebet-api/app/main.py:41-60`
- Test: `/Users/jone/Projetos/jonebet-api/tests/test_trading_models.py` (router via TestClient; usa fixtures `client` seedadas inline — ver Task 7)

**Interfaces:**
- Consumes: Tasks 4-5 (`get_daily`, `get_summary`)
- Produces: `GET /trading-models/daily?date=` e `GET /trading-models/summary` (Task 7 testa)

Padrão `DailyBetsEnvelope` (responses.py:40-43): top-level tipado, itens `list[dict]` passthrough. `date` obrigatório (`Query(...)` → 422 se ausente).

- [ ] **Step 1: Write the failing tests**

```python
def test_router_daily_shape():
    from tests.conftest import FakeDB
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.db import get_db
    db = FakeDB({
        'daily-bets': [
            {'Date': '2026-09-05', 'Home': 'Fla', 'Away': 'Pal',
             'Modelo': 'lay_0x1_v1', 'Odds': 7.5},
        ],
        'fixtures': [
            {'Date': '2026-09-05', 'Home': 'Fla', 'Away': 'Pal', 'Fixture_ID': 'f1',
             'Time': '20:00', 'HTHG': 1, 'HTAG': 0, 'FTHG': 2, 'FTAG': 3,
             'Goals_H_Minutes': ['34', '80'], 'Goals_A_Minutes': ['54', '68', '84']},
        ],
    })
    app.dependency_overrides[get_db] = lambda: db
    try:
        r = TestClient(app).get('/trading-models/daily?date=2026-09-05')
    finally:
        app.dependency_overrides.clear()
    assert r.status_code == 200
    body = r.json()
    assert body['date'] == '2026-09-05'
    (group,) = body['daily']
    assert group['model_label'] == '0x1'
    assert group['subtotal'] == 10.0
    (bet,) = group['bets']
    assert bet['ht_score'] == [1, 0]
    assert bet['result'] == 'GREEN'


def test_router_daily_requires_date():
    from tests.conftest import FakeDB
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.db import get_db
    app.dependency_overrides[get_db] = lambda: FakeDB({'daily-bets': [], 'fixtures': []})
    try:
        assert TestClient(app).get('/trading-models/daily').status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_router_summary_shape():
    from tests.conftest import FakeDB
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.db import get_db
    app.dependency_overrides[get_db] = lambda: FakeDB({'daily-bets': [], 'fixtures': []})
    try:
        r = TestClient(app).get('/trading-models/summary')
    finally:
        app.dependency_overrides.clear()
    assert r.status_code == 200
    body = r.json()
    assert 'start_date' in body['week'] and 'rows' in body['week']
    assert 'year' in body['month'] and 'rows' in body['month']
```

Nota: `TestClient(app)` + `dependency_overrides[get_db]` — padrão de `test_fixtures.py` (shared FakeDB). `get_db` importado de `app.core.db`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "router"`
Expected: FAIL (404 — rota não existe)

- [ ] **Step 3: Write minimal implementation**

`app/schemas/responses.py`, append:

```python
class TradingDailyResponse(BaseModel):
    date: str
    daily: list[dict]  # grupos por modelo, bets crus do service — padrão DailyBetsEnvelope


class TradingWeekSummary(BaseModel):
    start_date: str
    end_date: str
    rows: list[dict]


class TradingMonthSummary(BaseModel):
    year: int
    month: int
    rows: list[dict]


class TradingSummaryResponse(BaseModel):
    week: TradingWeekSummary
    month: TradingMonthSummary
```

`app/routers/trading_models.py`, criar:

```python
from fastapi import APIRouter, Depends, Query
from pymongo.database import Database

from app.core.db import get_db
from app.schemas.responses import TradingDailyResponse, TradingSummaryResponse
from app.services import trading_service

router = APIRouter(tags=["trading-models"])


@router.get("/trading-models/daily", response_model=TradingDailyResponse)
def get_trading_daily(
    date: str = Query(...),
    db: Database = Depends(get_db),
):
    return trading_service.get_daily(db, date)


@router.get("/trading-models/summary", response_model=TradingSummaryResponse)
def get_trading_summary(db: Database = Depends(get_db)):
    return trading_service.get_summary(db)
```

`app/main.py`: adicionar `trading_models` no import (ordem alfabética, após `models`) e `trading_models.router` no loop após `models.router`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "router"`
Expected: 3 PASS

- [ ] **Step 5: Commit** (pedir confirmação do usuário antes)

```bash
git add app/schemas/responses.py app/routers/trading_models.py app/main.py tests/test_trading_models.py
git commit -m "feat: endpoints GET trading-models daily e summary"
```

---

### Task 7: Contrato crítico do template (regressão)

**Files:**
- Test: `/Users/jone/Projetos/jonebet-api/tests/test_trading_models.py`

**Interfaces:**
- Consumes: Tasks 3-6 (stack completa)
- Produces: trava de contrato (nenhum código novo; só testes)

Motivo: `tradingModelDayCard.vue` acessa `bet.ht_score[0]` direto — se a API um dia devolver string ou `null` em bet resolvida, o front quebra sem erro de schema (Zod passthrough). Este teste falha se o contrato quebrar.

- [ ] **Step 1: Write the tests**

```python
def test_contract_score_arrays_are_int_pairs():
    from tests.conftest import FakeDB
    from app.services import trading_service
    db = FakeDB({
        'daily-bets': [
            {'Date': '2026-09-05', 'Home': 'Fla', 'Away': 'Pal',
             'Modelo': 'lay_0x1_v1', 'Odds': 7.5},
        ],
        'fixtures': [
            {'Date': '2026-09-05', 'Home': 'Fla', 'Away': 'Pal', 'Fixture_ID': 'f1',
             'Time': '20:00', 'HTHG': 1, 'HTAG': 0, 'FTHG': 2, 'FTAG': 3,
             'Goals_H_Minutes': ['34', '80'], 'Goals_A_Minutes': ['54', '68', '84']},
        ],
    })
    (bet,) = trading_service._settle_range(db, '2026-09-05', '2026-09-05')
    for key in ('ht_score', 'minute_70_score', 'ft_score'):
        assert isinstance(bet[key], list) and len(bet[key]) == 2, key
        assert all(isinstance(v, int) for v in bet[key]), key
    assert bet['result'] in ('GREEN', 'RED_LIGHT', 'RED')
    assert isinstance(bet['profit'], (int, float))
    assert all(isinstance(g, str) for g in bet['goals_home'])
    assert all(isinstance(g, str) for g in bet['goals_away'])


def test_contract_summary_row_names():
    from tests.conftest import FakeDB
    from app.services import trading_service
    db = FakeDB({
        'daily-bets': [
            {'Date': '2026-09-05', 'Home': 'Fla', 'Away': 'Pal',
             'Modelo': 'lay_0x1_v1', 'Odds': 7.5},
        ],
        'fixtures': [
            {'Date': '2026-09-05', 'Home': 'Fla', 'Away': 'Pal', 'Fixture_ID': 'f1',
             'Time': '20:00', 'HTHG': 1, 'HTAG': 0, 'FTHG': 2, 'FTAG': 3,
             'Goals_H_Minutes': ['34'], 'Goals_A_Minutes': ['54']},
        ],
    })
    got = trading_service.get_summary(db, today='2026-09-05')
    (row,) = got['week']['rows']
    # nomes que tradingModelAggTable.vue lê (decisão Problema 1)
    assert set(row) == {'model', 'model_label', 'games', 'green', 'red_light', 'red', 'total'}


def test_contract_pending_nulls_are_intentional():
    # PENDING retorna scores/goals null DE PROPÓSITO (SPEC ticket-3, decisão A
    # problema 3). NÃO "corrigir" no service — Ticket 4 trata com v-if no template.
    from tests.conftest import FakeDB
    from app.services import trading_service
    db = FakeDB({
        'daily-bets': [
            {'Date': '2026-09-05', 'Home': 'A', 'Away': 'B',
             'Modelo': 'lay_0x1_v1', 'Odds': 7.5},
        ],
        'fixtures': [],
    })
    (bet,) = trading_service._settle_range(db, '2026-09-05', '2026-09-05')
    assert bet['result'] == 'PENDING'
    assert bet['ht_score'] is None
    assert bet['minute_70_score'] is None
    assert bet['ft_score'] is None
    assert bet['goals_home'] is None
    assert bet['goals_away'] is None
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/test_trading_models.py -v -k "contract"`


- [ ] **Step 3: Commit** (pedir confirmação do usuário antes)

```bash
git add tests/test_trading_models.py
git commit -m "test: travas de contrato trading-models x template"
```

---

### Task 8: Verificação final

**Files:** nenhum (só comandos)

- [ ] **Step 1: Suite completa da API**

Run: `cd /Users/jone/Projetos/jonebet-api && python -m pytest tests/ -q`
Expected: todos passam (existentes + ~25 novos)

- [ ] **Step 2: Smoke test manual dos endpoints**

```bash
cd /Users/jone/Projetos/jonebet-api && python - <<'EOF'
from fastapi.testclient import TestClient
from tests.conftest import FakeDB
from app.main import app
from app.core.db import get_db
app.dependency_overrides[get_db] = lambda: FakeDB({'daily-bets': [], 'fixtures': []})
c = TestClient(app)
print(c.get('/trading-models/daily?date=2026-09-05').json())
print(c.get('/trading-models/summary').json())
app.dependency_overrides.clear()
EOF
```
Expected: `{'date': '2026-09-05', 'daily': []}` e summary com week/month vazios, sem 500

- [ ] **Step 3: Atualizar TICKETS.md** — Ticket 3 → `🟢 Completo em 2026-09-06` (só após `/review` do usuário)

---

## Self-Review

**1. Spec coverage:**
- `GET /trading-models/daily?date=` → Tasks 3, 4, 6 ✓
- `GET /trading-models/summary` (Seg–Dom + mês, SP_TZ) → Task 5, 6 ✓
- `trading_simulator.py` réplica → Task 2 ✓
- Join `(Date,Home,Away)` → Task 3 ✓
- Filtro `lay_0x1_*` → Task 3 (teste `test_settle_ignores_non_lay0x1`) ✓
- PENDING + scores null → Task 3 ✓
- `goals_home`/`goals_away` strings originais → Tasks 2 (`tokenize`), 3 (teste asserts `['34','80']`) ✓
- `games` + `total` no agregado → Task 5 ✓
- GET público → Task 6 (sem auth; teste não manda token) ✓
- Testes TDD listados na SPEC (simulator, service, router daily/summary, arrays) → Tasks 2-7 ✓

**2. Placeholder scan:** sem TBD/TODO/"similar to"; todo código inline; comandos com cwd absoluto (`/Users/jone/Projetos/jonebet-api`) pois o PLAN é executado fora do repo corrente.

**3. Type consistency:** `tokenize_minutes -> list[str]`, `parse_minutes -> list[int]`, `score_at_minute -> tuple`, `simulate_match -> str`, `pnl -> float`; `_settle_range -> list[dict]` com chave `model`; `get_daily -> {date, daily[]}`; `get_summary(today: str|date|None)`. Router consome `get_daily(db, date: str)` e `get_summary(db)`. Schemas Pydantic espelham os dicts. Consistente.

Gaps intencionais (fora do escopo da SPEC): outros modelos além de `lay_0x1_*`, deploy na VPS, mudanças no front (Ticket 4).
