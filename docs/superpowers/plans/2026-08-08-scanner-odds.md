# Odds pré-live + live no card do scanner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Revisão v2 (2026-08-08, pós-mock B — aplicada ANTES da execução final)

O usuário aprovou o **mock B** e redefiniu dois pontos do escopo:

1. **Over 2.5 e BTTS só na linha pré-live** (fonte CSV). A linha live mostra
   apenas 1X2 — `over25`/`btts` do live ficam sempre `null` no payload e o
   frontend não renderiza badges secundárias na linha verde. O extractor NÃO
   extrai mais esses mercados ao vivo.
2. **Odds live erradas no site real**: o regex no body da página do jogo
   pegava o bloco errado (odds próximas das pré-live, não as ao vivo). A
   correção: `_extract_odds` **navega para a página de comparação de odds**
   do Flashscore (`#/comparacao-de-odds/comparacao-de-odds`) e extrai as odds
   1X2 da casa **1xBet.br (id 1157)**, com fallback **bet365 (16)** →
   **Betano.br (574)** — seleção via `_pick_1x2_odds(blocks, priority)` sobre
   os blocos `div.odds` (logo + células com `data-analytics-bookmaker-id`).
3. **Frontend = opção B**: grid de 5 colunas
   `grid-cols-[1fr_1fr_1fr_0.85fr_0.85fr]`, labels `O2.5`/`BTTS` em cima das
   colunas 4-5 (text-2xs zinc-600 uppercase, só quando o valor existe), badges
   com `justify-center` e números puros. Nada de `flex-1`/`flex-0.72`/prefixo
   dentro do badge (era o que apertava "BTTS 1.83" e desregulava a grid).

O spec (`docs/superpowers/specs/2026-08-08-scanner-odds-design.md`) é a fonte
de verdade; as tasks abaixo foram executadas conforme o v2 (TDD: teste →
falha → implementação → suíte completa verde).

**Goal:** Adicionar duas linhas de odds (pré-live azul + live verde, badges UBadge soft) no `scannerCard.vue`, entre os times e o gráfico de momentum.

**Architecture:** Dois repos. Backend `momentum-scanner` expõe o campo `odds` por jogo no `live.json` (pré-live do CSV `Base_Bookie.csv` via `todays_matches`/`build_game`; live do DOM do Flashscore via `_extract_odds`, hoje extraído mas descartado). Frontend `jonebet` renderiza o campo com `<UBadge>` do NuxtUI v4. Contrato definido nas Tasks 1–3; frontend (Tasks 4–5) só consome.

**Tech Stack:** Python 3.12 (momentum-scanner: Playwright/Camoufox, pytest, uv), Nuxt 4 + Vue 3 + NuxtUI v4 + Vitest (jonebet).

## Global Constraints

- Contrato do payload (imutável após Task 3): `game.odds = { prematch: {home, draw, away, over25, btts}, live: {home, draw, away, over25, btts} }` — todos `number | null`; `odds` SEMPRE presente no `build_game` (shape fixo com nulls).
- Backend: `_extract_odds` mantém o shape atual `{source, minute, market, outcome, odds}` — só muda `source`/`minute` e ganha mercado BTTS.
- Frontend: UBadge `variant="soft"` `size="sm"`, pré-live `color="secondary"` (blue), live `color="success"` (green). Sem borda, sem cabeçalhos, sem labels de linha.
- Sem favorito explícito no card (decisão do usuário).
- jonebet: sem TypeScript, sem semicolons, prettier 120 col, `text-2xs`/escala de fonte do repo (não usar `text-[10px]` no source; o size sm do UBadge vem do theme interno).
- Testes backend: `uv run pytest <file> -q` em `/Users/jone/Projetos/momentum-scanner`. Testes frontend: `pnpm vitest run tests/app/components/scannerCard.spec.ts` em `/Users/jone/Projetos/jonebet`.
- Commits frequentes por task, mensagens em pt-BR padrão do repo.

---

### Task 1: `todays_matches()` carrega odds pré-live do CSV

**Files:**
- Modify: `/Users/jone/Projetos/momentum-scanner/momentum/monitor.py` (função `todays_matches`, ~linha 107)
- Test: `/Users/jone/Projetos/momentum-scanner/tests/momentum/test_monitor_fetch.py` (novo teste no final do arquivo)

**Interfaces:**
- Produces: match dict ganha chave `prematch_odds: {home: float|None, draw: float|None, away: float|None, over25: float|None, btts: float|None}`. Consumido pela Task 3 (`build_game`).

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao final de `tests/momentum/test_monitor_fetch.py`:

```python
import csv

from momentum import monitor


def _write_csv(path, rows):
    fieldnames = [
        "Fixture ID", "Date", "Time", "Home", "Away", "League",
        "FT_Odds_H", "FT_Odds_D", "FT_Odds_A", "Odds_O25", "Odds_U25",
        "BTTS_Yes", "BTTS_No", "HTHG", "HTAG", "FTHG", "FTAG",
        "C_FT_Odds_H", "C_FT_Odds_D", "C_FT_Odds_A",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def test_todays_matches_prematch_odds(tmp_path, monkeypatch):
    from datetime import date

    hoje = date.today().isoformat()
    path = tmp_path / "Base_Bookie.csv"
    _write_csv(path, [
        {
            "Fixture ID": "abc123", "Date": hoje, "Time": "20:00",
            "Home": "Casa", "Away": "Fora", "League": "Brasileirão",
            "FT_Odds_H": "1.67", "FT_Odds_D": "4.4", "FT_Odds_A": "5.5",
            "Odds_O25": "2.18", "Odds_U25": "1.65",
            "BTTS_Yes": "1.83", "BTTS_No": "1.9",
        },
        {
            "Fixture ID": "sem_odds", "Date": hoje, "Time": "21:00",
            "Home": "A", "Away": "B", "League": "L",
            "FT_Odds_H": "0", "FT_Odds_D": "", "FT_Odds_A": "0",
            "Odds_O25": "0", "Odds_U25": "",
            "BTTS_Yes": "", "BTTS_No": "",
        },
    ])
    monkeypatch.setattr(monitor, "BASE_BOOKIE_PATH", path)
    matches = monitor.todays_matches()
    assert matches[0]["prematch_odds"] == {
        "home": 1.67, "draw": 4.4, "away": 5.5, "over25": 2.18, "btts": 1.83,
    }
    # favorito continua derivado (menor odd de casa/fora)
    assert matches[0]["home_fav"] is True
    assert matches[1]["prematch_odds"] == {
        "home": None, "draw": None, "away": None, "over25": None, "btts": None,
    }
    assert matches[1]["home_fav"] is None
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd /Users/jone/Projetos/momentum-scanner && uv run pytest tests/momentum/test_monitor_fetch.py::test_todays_matches_prematch_odds -q`
Expected: FAIL — `KeyError: 'prematch_odds'`

- [ ] **Step 3: Implementar**

Em `momentum/monitor.py`, adicionar helper antes de `todays_matches`:

```python
def _odds_float(raw: str | None) -> float | None:
    """Célula do CSV (odds) -> float; 0/vazio/inválido -> None."""
    try:
        v = float(raw or 0)
    except ValueError:
        return None
    return v if v > 0 else None
```

Substituir o bloco de leitura de odds dentro de `todays_matches`:

```python
            try:
                ho = float(row.get("FT_Odds_H") or 0)
                ao = float(row.get("FT_Odds_A") or 0)
            except ValueError:
                ho = ao = 0.0
            fav = None if (ho <= 0 or ao <= 0) else (ho < ao)
            matches.append({
                "id": fid,
                "time": (row.get("Time") or "").strip(),
                "league": (row.get("League") or "").strip(),
                "home": (row.get("Home") or "").strip(),
                "away": (row.get("Away") or "").strip(),
                "home_fav": fav,
                "date": today,
            })
```

por:

```python
            ho = _odds_float(row.get("FT_Odds_H"))
            ao = _odds_float(row.get("FT_Odds_A"))
            fav = None if (ho is None or ao is None) else (ho < ao)
            matches.append({
                "id": fid,
                "time": (row.get("Time") or "").strip(),
                "league": (row.get("League") or "").strip(),
                "home": (row.get("Home") or "").strip(),
                "away": (row.get("Away") or "").strip(),
                "home_fav": fav,
                "prematch_odds": {
                    "home": ho,
                    "draw": _odds_float(row.get("FT_Odds_D")),
                    "away": ao,
                    "over25": _odds_float(row.get("Odds_O25")),
                    "btts": _odds_float(row.get("BTTS_Yes")),
                },
                "date": today,
            })
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd /Users/jone/Projetos/momentum-scanner && uv run pytest tests/momentum/test_monitor_fetch.py -q`
Expected: PASS (todos os testes do arquivo, incluindo o novo)

- [ ] **Step 5: Commit**

```bash
cd /Users/jone/Projetos/momentum-scanner
git add momentum/monitor.py tests/momentum/test_monitor_fetch.py
git commit -m "feat: expor odds pré-live do CSV no match (prematch_odds)"
```

---

### Task 2: `_extract_odds()` rotula live e extrai BTTS

**Files:**
- Modify: `/Users/jone/Projetos/momentum-scanner/momentum/extractor.py` (helpers puros + `_extract_odds` + chamada em `extract_all`)
- Test: `/Users/jone/Projetos/momentum-scanner/tests/momentum/test_extractor.py` (adicionar no final)

**Interfaces:**
- Consumes: nada de Task 1 (função pura sobre texto).
- Produces: `_extract_odds(status: str | None = None) -> list[dict]` — `source` = `"live"` quando o status indica jogo em andamento (`65'`, `Intervalo`, `Half time`), senão `"prematch"`; `minute` = minuto do relógio quando live, `0` quando prematch. Mercados: `1X2` (Home/Draw/Away), `Over/Under` (Over 2.5/Under 2.5), `BTTS` (Yes/No). Consumido pela Task 3.

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao final de `tests/momentum/test_extractor.py`:

```python
from momentum.extractor import _is_live_status, _parse_odds_body


def test_is_live_status():
    assert _is_live_status("65'") is True
    assert _is_live_status("45+2'") is True
    assert _is_live_status("Intervalo") is True
    assert _is_live_status("Half time") is True
    assert _is_live_status("Encerrado") is False
    assert _is_live_status("") is False
    assert _is_live_status(None) is False


def test_parse_odds_body_1x2_e_ou():
    body = "Home 1.67 Draw 4.4 Away 5.5 Over 2.5 2.18 Under 2.5 1.65"
    odds = _parse_odds_body(body, source="live", minute=65)
    assert {"source": "live", "minute": 65, "market": "1X2", "outcome": "Home", "odds": 1.67} in odds
    assert {"source": "live", "minute": 65, "market": "1X2", "outcome": "Away", "odds": 5.5} in odds
    assert {"source": "live", "minute": 65, "market": "Over/Under", "outcome": "Over 2.5", "odds": 2.18} in odds


def test_parse_odds_body_btts():
    body = "Both teams to score 1.83 1.9"
    odds = _parse_odds_body(body)
    assert {"source": "prematch", "minute": 0, "market": "BTTS", "outcome": "Yes", "odds": 1.83} in odds
    assert {"source": "prematch", "minute": 0, "market": "BTTS", "outcome": "No", "odds": 1.9} in odds


def test_parse_odds_body_vazio():
    assert _parse_odds_body("nada de odds aqui") == []
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd /Users/jone/Projetos/momentum-scanner && uv run pytest tests/momentum/test_extractor.py -q`
Expected: FAIL — `ImportError: cannot import name '_parse_odds_body'`

- [ ] **Step 3: Implementar**

Em `momentum/extractor.py`, adicionar após `_parse_score_text`:

```python
_STATUS_MINUTE_RE = re.compile(r"(\d+)(?:\+(\d+))?'")


def _status_minute(status: str | None) -> int | None:
    """Minuto do relógio do Flashscore: '65\\'' -> 65; '45+2\\'' -> 47.

    Exige o apóstrofo do relógio (mesma regra do monitor); horários de
    kickoff tipo '20:00' não viram minuto.
    """
    m = _STATUS_MINUTE_RE.fullmatch((status or "").strip())
    if not m:
        return None
    return int(m.group(1)) + int(m.group(2) or 0)


def _is_live_status(status: str | None) -> bool:
    """Jogo em andamento? (minuto no relógio, intervalo/1º-2º tempo)."""
    s = (status or "").lower()
    return _status_minute(s) is not None or any(k in s for k in ("interval", "half"))


def _parse_odds_body(body: str, source: str = "prematch", minute: int = 0) -> list[dict]:
    """Extrai odds do body text da página do jogo (função pura, testável).

    Mercados: 1X2 (Home/Draw/Away), Over/Under 2.5 e BTTS
    ('Both teams to score'). Retorna lista vazia quando o DOM não expõe
    odds (ex.: partidas finalizadas — Flashscore remove o bloco).
    """
    odds: list[dict] = []
    m = re.search(r"Home\s*([\d.]+)\s*Draw\s*([\d.]+)\s*Away\s*([\d.]+)", body, re.IGNORECASE)
    if m:
        for outcome, val in zip(("Home", "Draw", "Away"), m.groups()):
            odds.append({"source": source, "minute": minute, "market": "1X2", "outcome": outcome, "odds": float(val)})
    m = re.search(r"Over\s*2\.5\s*([\d.]+)\s*Under\s*2\.5\s*([\d.]+)", body, re.IGNORECASE)
    if m:
        odds.append({"source": source, "minute": minute, "market": "Over/Under", "outcome": "Over 2.5", "odds": float(m.group(1))})
        odds.append({"source": source, "minute": minute, "market": "Over/Under", "outcome": "Under 2.5", "odds": float(m.group(2))})
    m = re.search(r"Both\s*teams\s*to\s*score\s*([\d.]+)\s*([\d.]+)", body, re.IGNORECASE)
    if m:
        odds.append({"source": source, "minute": minute, "market": "BTTS", "outcome": "Yes", "odds": float(m.group(1))})
        odds.append({"source": source, "minute": minute, "market": "BTTS", "outcome": "No", "odds": float(m.group(2))})
    return odds
```

Substituir o corpo de `_extract_odds` (docstring mantém o contexto, atualizar a primeira frase) por:

```python
    def _extract_odds(self, status: str | None = None) -> list[dict]:
        """Lê odds do body da página (bloco pré-jogo ou ao vivo).

        Jogo ao vivo -> source='live' e minute do relógio; caso contrário
        source='prematch', minute=0. Partidas finalizadas: o Flashscore
        REMOVE as odds (probe 2026-08-05) — lista vazia.
        """
        try:
            body = self.page.locator("body").inner_text()
        except Exception:
            return []
        is_live = _is_live_status(status)
        return _parse_odds_body(
            body,
            source="live" if is_live else "prematch",
            minute=_status_minute(status) if is_live else 0,
        )
```

E na chamada em `extract_all` (passo 6), passar o status já extraído:

```python
        # 6. Odds (bloco pré-jogo ou ao vivo; vazio em partidas finalizadas)
        result["odds"] = self._extract_odds(result["match"].get("status"))
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd /Users/jone/Projetos/momentum-scanner && uv run pytest tests/momentum/test_extractor.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/jone/Projetos/momentum-scanner
git add momentum/extractor.py tests/momentum/test_extractor.py
git commit -m "feat: odds live com minuto do relógio e mercado BTTS no extractor"
```

---

### Task 3: `build_game()` expõe o campo `odds` no snapshot

**Files:**
- Modify: `/Users/jone/Projetos/momentum-scanner/momentum/snapshot.py`
- Test: `/Users/jone/Projetos/momentum-scanner/tests/momentum/test_snapshot.py`

**Interfaces:**
- Consumes: `match["prematch_odds"]` (Task 1), `data["odds"]` do extractor (Task 2).
- Produces: `build_game` retorna dict com `odds = {prematch: {home, draw, away, over25, btts}, live: {home, draw, away, over25, btts}}` — shape fixo, todos `number | None`. Consumido pelo frontend (Task 4).

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao final de `tests/momentum/test_snapshot.py`:

```python
def _match_com_odds():
    return {
        "id": "m1", "league": "Brasileirão", "home": "Casa", "away": "Fora",
        "prematch_odds": {"home": 1.67, "draw": 4.4, "away": 5.5, "over25": 2.18, "btts": 1.83},
    }


def test_build_game_odds_prematch_e_live():
    data = _data(
        odds=[
            {"source": "live", "minute": 65, "market": "1X2", "outcome": "Home", "odds": 1.7},
            {"source": "live", "minute": 65, "market": "1X2", "outcome": "Draw", "odds": 3.75},
            {"source": "live", "minute": 65, "market": "1X2", "outcome": "Away", "odds": 5.6},
            {"source": "live", "minute": 65, "market": "Over/Under", "outcome": "Over 2.5", "odds": 2.15},
            {"source": "live", "minute": 65, "market": "BTTS", "outcome": "Yes", "odds": 2.22},
        ]
    )
    game = build_game(data, _match_com_odds(), 65)
    assert game["odds"] == {
        "prematch": {"home": 1.67, "draw": 4.4, "away": 5.5, "over25": 2.18, "btts": 1.83},
        "live": {"home": 1.7, "draw": 3.75, "away": 5.6, "over25": 2.15, "btts": 2.22},
    }


def test_build_game_odds_sem_dados_tudo_null():
    game = build_game(_data(), _match(), 65)
    assert game["odds"] == {
        "prematch": {"home": None, "draw": None, "away": None, "over25": None, "btts": None},
        "live": {"home": None, "draw": None, "away": None, "over25": None, "btts": None},
    }


def test_build_game_odds_ignora_outras_fontes():
    data = _data(
        odds=[
            {"source": "prematch", "minute": 0, "market": "1X2", "outcome": "Home", "odds": 9.9},
        ]
    )
    game = build_game(data, _match(), 65)
    assert game["odds"]["live"] == {"home": None, "draw": None, "away": None, "over25": None, "btts": None}
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd /Users/jone/Projetos/momentum-scanner && uv run pytest tests/momentum/test_snapshot.py -q`
Expected: FAIL — `KeyError: 'odds'`

- [ ] **Step 3: Implementar**

Em `momentum/snapshot.py`, adicionar helper antes de `build_game`:

```python
def _odds_from_list(odds: list[dict] | None, source: str) -> dict:
    """Mapeia a lista do extractor para o shape {home, draw, away, over25, btts}.

    Ignora entradas de outras fontes e mercados não usados no card.
    """
    out = {"home": None, "draw": None, "away": None, "over25": None, "btts": None}
    for o in odds or []:
        if o.get("source") != source:
            continue
        if o.get("market") == "1X2":
            key = {"Home": "home", "Draw": "draw", "Away": "away"}.get(o.get("outcome"))
        elif o.get("market") == "Over/Under" and o.get("outcome") == "Over 2.5":
            key = "over25"
        elif o.get("market") == "BTTS" and o.get("outcome") == "Yes":
            key = "btts"
        else:
            key = None
        if key:
            out[key] = o.get("odds")
    return out
```

E no dict retornado por `build_game`, adicionar o campo (após `"stats"`):

```python
        "odds": {
            "prematch": {
                "home": (match.get("prematch_odds") or {}).get("home"),
                "draw": (match.get("prematch_odds") or {}).get("draw"),
                "away": (match.get("prematch_odds") or {}).get("away"),
                "over25": (match.get("prematch_odds") or {}).get("over25"),
                "btts": (match.get("prematch_odds") or {}).get("btts"),
            },
            "live": _odds_from_list(data.get("odds"), "live"),
        },
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd /Users/jone/Projetos/momentum-scanner && uv run pytest tests/momentum/test_snapshot.py -q`
Expected: PASS

- [ ] **Step 5: Suíte completa do backend**

Run: `cd /Users/jone/Projetos/momentum-scanner && uv run pytest -q`
Expected: PASS (156 + 8 novos testes)

- [ ] **Step 6: Commit**

```bash
cd /Users/jone/Projetos/momentum-scanner
git add momentum/snapshot.py tests/momentum/test_snapshot.py
git commit -m "feat: expor odds prematch/live no payload do snapshot"
```

---

### Task 4: seção de odds no `scannerCard.vue`

**Files:**
- Modify: `/Users/jone/Projetos/jonebet/app/components/scannerCard.vue` (template + script)
- Test: `/Users/jone/Projetos/jonebet/tests/app/components/scannerCard.spec.ts` (adicionar casos)

**Interfaces:**
- Consumes: `game.odds = {prematch: {...}, live: {...}}` (Task 3). Shape fixo, valores `number | null`.
- Produces: seção renderizada entre a linha de times e o `<MomentumChart>`, somente quando há ≥1 valor não-null.

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao final de `tests/app/components/scannerCard.spec.ts` (dentro do `describe`):

```ts
it('renderiza odds pré-live e live quando presentes', async () => {
  const wrapper = await mountSuspended(ScannerCard, {
    props: {
      game: {
        ...game(),
        odds: {
          prematch: { home: 1.67, draw: 4.4, away: 5.5, over25: 2.18, btts: 1.83 },
          live: { home: 1.7, draw: 3.75, away: 5.6, over25: 2.15, btts: 2.22 },
        },
      },
    },
  })
  expect(wrapper.text()).toContain('1.67')
  expect(wrapper.text()).toContain('O 2.18')
  expect(wrapper.text()).toContain('BTTS 1.83')
  expect(wrapper.text()).toContain('O 2.15')
  expect(wrapper.text()).toContain('BTTS 2.22')
})

it('sem odds não renderiza a seção', async () => {
  const wrapper = await mountSuspended(ScannerCard, { props: { game: game() } })
  expect(wrapper.text()).not.toContain('BTTS')
})

it('odds nulos pulam os badges', async () => {
  const wrapper = await mountSuspended(ScannerCard, {
    props: {
      game: {
        ...game(),
        odds: {
          prematch: { home: 1.67, draw: null, away: null, over25: null, btts: null },
          live: {},
        },
      },
    },
  })
  expect(wrapper.text()).toContain('1.67')
  expect(wrapper.text()).not.toContain('BTTS')
  expect(wrapper.text()).not.toContain('O 2.18')
})
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd /Users/jone/Projetos/jonebet && pnpm vitest run tests/app/components/scannerCard.spec.ts`
Expected: FAIL — os 3 novos testes falham (texto não contém as odds)

- [ ] **Step 3: Implementar**

No `<script setup>` de `scannerCard.vue`, após `statRows`:

```js
const odds = computed(() => props.game.odds || {})
const prematch = computed(() => odds.value.prematch || {})
const live = computed(() => odds.value.live || {})

const hasAnyOdds = (o) => [o.home, o.draw, o.away, o.over25, o.btts].some((v) => v != null)
const hasOdds = computed(() => hasAnyOdds(prematch.value) || hasAnyOdds(live.value))
const hasPrematch = computed(() => hasAnyOdds(prematch.value))
const hasLive = computed(() => hasAnyOdds(live.value))

function majorOdds(o) {
  return [o.home, o.draw, o.away].filter((v) => v != null)
}

function minorOdds(o) {
  const cells = []
  if (o.over25 != null) cells.push('O ' + o.over25)
  if (o.btts != null) cells.push('BTTS ' + o.btts)
  return cells
}
```

No template, entre o `div` da linha de times (que fecha após o badge de minuto) e o `<MomentumChart>`:

```vue
        <div v-if="hasOdds" class="mb-2.5 flex flex-col gap-1">
          <div v-if="hasPrematch" class="flex items-center gap-1">
            <UBadge
              v-for="(o, i) in majorOdds(prematch)"
              :key="'pm' + i"
              color="secondary"
              variant="soft"
              size="sm"
              class="flex-1 justify-center"
              >{{ o }}</UBadge
            >

            <span v-if="minorOdds(prematch).length" class="text-xs text-zinc-600">·</span>

            <UBadge
              v-for="(o, i) in minorOdds(prematch)"
              :key="'pm-min' + i"
              color="secondary"
              variant="soft"
              size="sm"
              class="flex-[0.72] justify-center"
              >{{ o }}</UBadge
            >
          </div>

          <div v-if="hasLive" class="flex items-center gap-1">
            <UBadge
              v-for="(o, i) in majorOdds(live)"
              :key="'lv' + i"
              color="success"
              variant="soft"
              size="sm"
              class="flex-1 justify-center"
              >{{ o }}</UBadge
            >

            <span v-if="minorOdds(live).length" class="text-xs text-zinc-600">·</span>

            <UBadge
              v-for="(o, i) in minorOdds(live)"
              :key="'lv-min' + i"
              color="success"
              variant="soft"
              size="sm"
              class="flex-[0.72] justify-center"
              >{{ o }}</UBadge
            >
          </div>
        </div>
```

Nota: `minorOdds(prematch).length` é chamado 2x — ok para 5 células; se quiser, computar antes. `flex-[0.72]` é valor arbitrário de flex, não de font-size — não é barrado pelo `check-arbitrary-values.cjs` (que só rejeita font-size).

- [ ] **Step 4: Rodar para ver passar**

Run: `cd /Users/jone/Projetos/jonebet && pnpm vitest run tests/app/components/scannerCard.spec.ts`
Expected: PASS (4 existentes + 3 novos)

- [ ] **Step 5: Verificação visual (dev server)**

Run: `cd /Users/jone/Projetos/jonebet && pnpm run dev` (porta 3000 ou fallback), abrir `http://localhost:3000/scanner` no browser, conferir:
- Cards ao vivo com odds: duas linhas de badges (azul em cima, verde embaixo), 1X2 + `O x.xx` + `BTTS x.xx`.
- Cards sem `odds` (se houver) ou encerrados: seção ausente ou só pré-live.
- 375px (mobile): badges não estouram o card.

Expected: sem overflow, sem truncamento, cores secondary/success visíveis.

- [ ] **Step 6: Commit**

```bash
cd /Users/jone/Projetos/jonebet
git add app/components/scannerCard.vue tests/app/components/scannerCard.spec.ts
git commit -m "feat: odds pré-live e live no card do scanner (UBadge soft)"
```

---

### Task 5: deploy do backend + verificação end-to-end

**Files:**
- Deploy: VPS Contabo (johnn1sbo3s@45.92.10.252) — seguir skill `momentum-scanner-vps-redeploy`
- Verify: `https://scanner.jonebet.xyz/live.json` + tela `/scanner` do jonebet

**Interfaces:**
- Consumes: Tasks 1–4. Requer o usuário aprovar o visual em dev (Step 5 da Task 4) antes de rodar.

- [ ] **Step 1: Confirmar aprovação do usuário**

Perguntar ao usuário se o visual em `http://localhost:3000/scanner` está aprovado (decisão de gate: o deploy na VPS atualiza o snapshot público consumido pelo site).

- [ ] **Step 2: Redeploy do container**

Seguir a skill `momentum-scanner-vps-redeploy` (git pull, docker build, replace container, verificar heartbeat/watchdog).

- [ ] **Step 3: Verificar payload real**

Run: `curl -s https://scanner.jonebet.xyz/live.json | jq '.games[0].odds'`
Expected: objeto com `prematch` e `live` (valores number ou null)

- [ ] **Step 4: Verificar a tela**

Abrir `https://jonebet.vercel.app/scanner` (ou domínio real) no browser, conferir que os cards mostram as duas linhas de odds com dados reais.

- [ ] **Step 5: Commit final (se houve ajustes de verificação)**

Se a verificação real revelar ajustes (ex.: regex BTTS do DOM ao vivo não bate), criar commit de fix no repo correspondente com teste do texto real capturado.

---

## Self-Review

**Spec coverage:**
- Contrato `odds` prematch/live → Tasks 1+2+3 (backend), Task 4 (frontend). ✓
- `todays_matches` carrega FT_Odds_D/Odds_O25/BTTS_Yes → Task 1. ✓
- `_extract_odds` source live + minute atual → Task 2. ✓
- BTTS live com fallback null (probe) → Task 2 (`_parse_odds_body` retorna só o que o DOM tem; se o texto real do Flashscore diferir, Step 5 da Task 5 captura o texto real e ajusta). ✓
- UBadge soft secondary/success, 1X2 + O + BTTS, nulls pulam badges → Task 4. ✓
- Sem favorito explícito → respeitado em todo o plano. ✓
- Schema zod: nenhuma mudança necessária (FlexObject/FlexArray permissivos, verificado 2026-08-08). ✓

**Placeholder scan:** nenhum "TBD"/"TODO"; todos os passos têm código ou comando exato. O único passo aberto é o probe do DOM real (Step 5 Task 5), com procedimento definido.

**Type consistency:** `prematch_odds` (Task 1) consumido em Task 3 como `match.get("prematch_odds")`; `data["odds"]` (Task 2) consumido em Task 3 via `_odds_from_list(data.get("odds"), "live")`; shape do payload idêntico entre Task 3 (backend) e Task 4 (frontend): `{home, draw, away, over25, btts}`.
