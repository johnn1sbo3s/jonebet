# Ticket 2 — Desenho da Página `/trading-models`

**Status:** 🟢 Aprovada em 2026-09-05

## Objetivo

Esboçar a página de resultados de Trading Models para definir o contrato de JSON com o backend (Ticket 3). Layout baseado no HTML gerado pro Telegram (`resultados_lay0x1.html`).

---

## Layout Aprovado (mockup)

```
┌──────────────────────────────────────────────────────┐
│  📊 Trading Models          [📅 DatePicker]         │
│  Stake 10u · Green +10 · RL −5% · Red −30%          │
├──────────────────────────────────────────────────────┤
│  🔵 DONKEY                    Subtotal: +R$ 10,00    │
│  Basaksehir vs Galatasaray                            │
│  14:00 │ Odd 14.55 │ HT 0x1 · 70' 1x1 · FT 2x3      │
│  🟢 GREEN                                    +R$ 10   │
├──────────────────────────────────────────────────────┤
│  🟢 LUIGI                     Subtotal: -R$ 23,17    │
│  Basaksehir vs Galatasaray                            │
│  14:00 │ Odd 14.55 │ HT 0x1 · 70' 1x1 · FT 2x3      │
│  🟢 GREEN                                    +R$ 10   │
│  ─────────────────────────────────────────────────── │
│  Pau vs Sochaux                                       │
│  15:00 │ Odd 3.40 │ HT 0x0 · 70' 0x0 · FT 0x1        │
│  🔴 RED                                      -R$ 33   │
├──────────────────────────────────────────────────────┤
│  🔴 CRASH                     Subtotal: +R$ 30,00    │
│  Wolfsberger vs LASK                                  │
│  21:00 │ Odd 1.35 │ HT 1x0 · 70' 1x1 · FT 1x3        │
│  🟡 RED_LIGHT                               -R$ 1   │
├──────────────────────────────────────────────────────┤
│  🟣 PACMAN                    Subtotal: +R$ 20,00    │
│  ...                                                  │
├──────────────────────────────────────────────────────┤
│  🟠 SCORPION                  Subtotal: +R$ 10,00    │
│  ...                                                  │
├──────────────────────────────────────────────────────┤
│  📅 Semana (31/08 a 04/09)                           │
│  ┌────────┬──────┬───┬────┬───┬────────┐            │
│  │ Modelo │ Jogs │ G │ RL │ R │ Total  │            │
│  ├────────┼──────┼───┼────┼───┼────────┤            │
│  │ Crash  │  4   │ 3 │  0 │ 1 │ -R$ 5  │            │
│  │ Donkey │  5   │ 2 │  3 │ 0 │ +R$ 3  │            │
│  │ Luigi  │ 15   │ 7 │  6 │ 2 │ -R$ 42 │            │
│  │ Pacman │ 11   │10 │  0 │ 1 │ +R$ 64 │            │
│  │ Scorpion│ 3   │ 3 │  0 │ 0 │ +R$ 30 │            │
│  ├────────┼──────┴───┴────┴───┼────────┤            │
│  │ TOTAL                     │ +R$ 49 │            │
│  └────────────────────────────┴────────┘            │
├──────────────────────────────────────────────────────┤
│  📆 Setembro 2026                                    │
│  [mesma tabela agregada]                             │
├──────────────────────────────────────────────────────┤
│  Gerado automaticamente · jonebet.xyz                │
└──────────────────────────────────────────────────────┘
```

---

## JSON Contract (pra API retornar)

### GET `/trading-models?date=YYYY-MM-DD`

```jsonc
{
  "date": "2026-09-04",
  "stake": 10.0,           // stake unit (fixo 10u por enquanto)
  "daily": [
    {
      "model": "donkey",
      "model_label": "Donkey",
      "subtotal": 10.00,
      "bets": [
        {
          "fixture_id": "...",
          "time": "14:00",
          "home": "Basaksehir",
          "away": "Galatasaray",
          "league": "...",
          "odd": 14.55,
          "ht_score": [0, 1],
          "minute_70_score": [1, 1],
          "ft_score": [2, 3],
          "goals_home_minutes": ["34"],
          "goals_away_minutes": ["54", "68", "84"],
          "result": "GREEN",       // "GREEN" | "RED_LIGHT" | "RED"
          "profit": 10.00,
          "liability": 0
        }
      ]
    }
    // ... crash, luigi, pacman, scorpion
  ],
  "weekly": {
    "start_date": "2026-08-31",
    "end_date": "2026-09-04",
    "rows": [
      { "model": "crash", "games": 4, "green": 3, "red_light": 0, "red": 1, "total": -5.54 }
      // ...
    ],
    "total": 49.32
  },
  "monthly": {
    "year": 2026,
    "month": 9,
    "rows": [ /* mesmo formato */ ],
    "total": 49.32
  }
}
```

**Regras de negócio no backend:**
- `result`: GREEN (HT 0x0 → GREEN_LIGHT), 70' 0x1 → RED (30% liability), senão → RED_LIGHT (5% liability)
- `profit`: GREEN +stake, RED_LIGHT −5% liability, RED −30% liability
- Semana: segunda a domingo contendo a data
- Mês: 1º ao último dia do mês da data

---

## Arquivos Novos

| Arquivo | Papel |
|---------|-------|
| `app/pages/trading-models.vue` | Página principal (layout + DatePicker + renderiza seções) |
| `app/composables/useTradingModels.js` | Composable com useFetch + cache + safeParse |
| `app/components/tradingModelDayCard.vue` | Card de 1 modelo no dia (badge + subtotal + lista de jogos) |
| `app/components/tradingModelAggTable.vue` | Tabela agregada (semana/mês) com linhas por modelo |

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `app/layouts/default.vue` | Adicionar item "Trading Models" no navItems |
| `app/utils/schemas.js` | Adicionar `tradingModelsList` (daily) + `tradingModelAgg` (semana/mês) |
| `app/utils/enums.js` | Adicionar `TRADING_MODEL_BADGE` (cores) + `TRADING_MODEL_RESULT` |
| `docs/tickets/trading-models/TICKETS.md` | Atualizar status do Ticket 2 |

---

## Componentes Reutilizáveis

Do frontend existente:
- `DatePicker.vue` — seleção de data (v-model, maxValue)
- `DataErrorCard.vue` — estado de erro/vazio
- `BetsTableCard.vue` — padrão UTable com sticky thead
- `formatNumber.js` → `formatUnit` pra profit, `formatNumber` pra odds
- `timezone.js` → `formatDate` pra exibir datas

Do HTML do Telegram (visual):
- `.badge.scorpion/.donkey/.crash/.pacman/.luigi` → cores por sub-modelo
- `.res-green/.res-redl/.res-red` → badges de resultado
- `.pnl-pos/.pnl-neg` → cor do P&L

---

## Testes (TDD)

Stack: Vitest 4.1.10 + happy-dom + @nuxt/test-utils 4.0.3

### Novos specs:

| Spec | O que testa |
|------|-------------|
| `tests/app/components/tradingModelDayCard.spec.ts` | Badge do modelo, subtotal formatado, cores de resultado |
| `tests/app/components/tradingModelAggTable.spec.ts` | Linhas da tabela, total em destaque |
| `tests/app/composables/useTradingModels.spec.ts` | Fetch + cache + safeParse, fallback em erro |
| `tests/app/pages/trading-models.spec.ts` | Renderização geral, DatePicker change |

### Padrão:
- `// @vitest-environment nuxt`
- `mountSuspended()` de `@nuxt/test-utils/runtime`
- Mock do composable `useTradingModels` no `test.setup.ts` (seguir padrão dos outros)
- Assertions: `wrapper.text().toContain('Donkey')`, `.classes().toContain('pnl-pos')`

---

## Decisões

| Decisão | Motivo |
|---------|--------|
| Layout espelha HTML do Telegram | Usuário já validou visual, reduz fricção de design |
| Seção por modelo (não tabela única) | Espirito do Telegram, facilita ver subtotal por sub-modelo |
| DatePicker no header (não segmented) | Troca o dia sem navegar, semanas/meses são derivados |
| Tabelas agregadas fixas no final | Usuário pediu: semana e mês visíveis sempre |
| Badge colorido por sub-modelo | Mantém consistência visual com Telegram |
| `result` como string enum | Mapeia 1:1 com simulador (GREEN/RED_LIGHT/RED) |

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| API ainda não existe (Ticket 3) | Frontend mocka dados reais via composable; contrato já definido |
| Formato de `goals_home_minutes` incerto | Zod schema é passthrough; fallback `[]` se vazio |
| Semana "rolante" vs "calendário" | Padrão: semana da data até 6 dias antes (seg-sex ou dom-sab) — definir no Ticket 3 |

---

## Aceitação

- [ ] Página `/trading-models` renderiza com DatePicker
- [ ] Cada sub-modelo (crash/donkey/luigi/pacman/scorpion) tem seu card com subtotal
- [ ] Resultados exibem badge colorido (🟢 GREEN / 🟡 RED_LIGHT / 🔴 RED)
- [ ] Tabelas agregadas Semana e Mês no final
- [ ] DatePicker muda o dia e recarrega a primeira seção
- [ ] Mobile: cards empilhados, tabelas com scroll horizontal
