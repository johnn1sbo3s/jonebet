# Histórico dos times nos cards (scanner + relatório do dia)

**Data:** 2026-08-24
**Status:** Aprovado em brainstorming (opção A, popover no header, enriquecimento no momentum-scanner)

## Problema

As features de histórico dos times geradas pelo pipeline noturno
(`football_models/data/features_prelive/features_prelive_YYYY-MM-DD.json`) hoje só chegam à IA
(relatório pré-live via `analises_ia` e avaliação ao vivo via `/evaluate`). O usuário final não as vê:
o card do scanner mostra só estado ao vivo e o card do relatório mostra só a leitura da IA.

## Solução

O momentum-scanner passa a incluir `team_history` em cada jogo que já serve; o frontend exibe esse
bloco num popover acionado por um botão no header dos dois cards.

### Contrato de dados

Cada jogo em `/report` (array `jogos[]`) e em `live.json` (array `games[]`) ganha o campo opcional:

```json
"team_history": {
  "home_metrics": { "form5": "LWWWW", "points5": 12, "avg_total_goals": 2.3,
                     "btts_rate": 0.4, "over25_rate": 0.4, "ht_scored_rate": 0.4, "...": "~20 campos" },
  "away_metrics": { "...": "idem" },
  "h2h": { "count": 3, "home_wins": 2, "draws": 0, "away_wins": 1,
            "avg_goals": 2.0, "btts_rate": 0.0 } | null
}
```

- Valores vêm inteiros do `FeaturesStore.get(fixture_id)` (dicts `home_metrics`, `away_metrics`,
  `h2h` do JSON de features). O front seleciona os ~6 campos que exibe.
- Jogo sem feature correspondente → campo **omitido** (nunca `null` no nível do jogo).

### Backend — momentum-scanner

1. **Snapshot (`live.json`)** — `momentum/monitor.py`: onde o payload é serializado antes de
   `set_payload` (~linha 947), para cada `game` do snapshot fazer
   `game["team_history"] = extrair(features_store.get(game["id"]))`. O `FeaturesStore` já é
   instanciado ali (linha 882).
2. **Relatório (`/report`)** — `momentum/http_server.py::_serve_report`: após `report_store.get(date)`,
   cruzar cada item de `jogos[]` por `fixture_id` com o mesmo `features_store` (acessível via
   `evaluate_service.features_store`; se necessário, passar `features_store` explícito em
   `start_snapshot_server`).
3. Nenhuma mudança no pipeline noturno nem nos JSONs persistidos.

### Frontend — jonebet-frontend

4. **Componente novo `app/components/teamHistoryPopover.vue`**
   - Props: `history` (objeto acima), `home`, `away`.
   - Trigger: `<button>` **nativo** "📊 Histórico" dentro do `UPopover` (regra do repo: trigger de
     overlay Nuxt UI tem que ser elemento nativo — componente wrapper quebra o ref do Reka e o
     clique não abre).
   - Conteúdo (layout espelhado aprovado — opção A), linhas casa | métrica | visitante:
     | Linha | Campo home | Campo away |
     |---|---|---|
     | Forma | `home_metrics.form5` (letras W/D/L coloridas: teal/zinc/red) | `away_metrics.form5` |
     | Pts últ. 5 | `points5` | `points5` |
     | Gols/jogo | `avg_total_goals` | `avg_total_goals` |
     | BTTS | `btts_rate` | `btts_rate` |
     | Over 2.5 | `over25_rate` | `over25_rate` |
     | Gol no 1ºT | `ht_scored_rate` | `ht_scored_rate` |
   - Faixa H2H no rodapé quando `history.h2h` não-nulo: `casa N × M fora · empates · gols/jogo · BTTS%`.
   - Formatação: `formatPercent`/`formatNumber` de `app/utils/formatNumber.js`.
   - Guards: métrica ausente → linha omitida.
5. **`scannerCard.vue`** — botão no cluster direito do header (linha ~19, junto aos ícones
   existentes): `<TeamHistoryPopover v-if="game.team_history" ... />`.
6. **`reportGameCard.vue`** — botão na direita do `<header>` (linhas 11–69, junto do popover de
   modelos): mesma condição.
7. Zero mudança em composables/schemas/páginas: schemas são `FlexObject.passthrough()`, o campo
   novo flui sozinho.

## Erros

- `team_history` ausente → botão não renderiza (comportamento atual preservado).
- `h2h: null` → faixa escondida, resto do popover normal.
- Objeto parcialmente malformado → template só acessa campos com guards (`v-if` por linha); sem
  throw.

## Testes

- Unitário novo `tests/app/components/teamHistoryPopover.spec.ts`: renderiza valores formatados,
  cores de W/D/L, esconde faixa H2H nula, esconde linhas de campos ausentes. Padrão
  `mountSuspended` + mocks centrais.
- Verificação visual end-to-end: proxy local injetando `team_history` num `live.json` real
  (padrão `NUXT_PUBLIC_SCANNER_SNAPSHOT_URL` já usado no repo) + `/report` real do dia.
