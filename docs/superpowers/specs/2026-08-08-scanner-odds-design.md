# Design: odds pré-live no card do scanner

Data: 2026-08-08 · Repos: jonebet (frontend) + momentum-scanner (backend) · Status: implementado e em produção (v3 final — só pré-live)

## Contexto

O card do scanner (`scannerCard.vue`) mostra times/placar/minuto, gráfico de
momentum e stats — mas nenhuma noção de favorito ou odds. O usuário quer ver as
odds para inferir o favorito de relance (decidiu NÃO exibir favorito explícito:
"não precisamos nem mostrar quem é favorito, só de ter as odds já dá pra saber
olhando").

Dados disponíveis no pipeline (investigação 2026-08-08):

- **Odds pré-live**: no `Base_Bookie.csv` (pipeline football_models, 1xBet.br):
  `FT_Odds_H/D/A` (1X2), `Odds_O25` (Over 2.5), `BTTS_Yes`, `Odds_U25`/`BTTS_No`.
  O momentum-scanner baixa o CSV 1x/dia (~23h30, jogos do dia seguinte) em
  `todays_matches()`.
- **Odds live**: TENTADO via página de comparação de odds do Flashscore
  (rota `#/comparacao-de-odds/comparacao-de-odds`, casa 1xBet.br id 1157 com
  fallback bet365/16 → Betano/574). **ABANDONADO**: o Flashscore não serve a
  seção de odds para IP de datacenter (VPS Contabo na Alemanha recebe versão
  EN sem odds; probe 2026-08-08: rows=0 na VPS vs 13 casas no IP BR). Decisão
  do usuário: remover a linha live e toda a lógica de odds live — fica só o
  pré-live.

## Decisões aprovadas (v3 final — após mock B + remoção do live)

- **Uma linha de odds** entre a linha de times/placar e o gráfico de momentum
  (só pré-live, azul).
- **Badges UBadge** (NuxtUI v4) `variant="soft"`, `size="sm"`, sem borda
  (`bg-{color}/10 text-{color}`), `color="secondary"` (blue), `justify-center`.
- **Mercados**: 1X2 (casa/empate/fora) + **Over 2.5** + **BTTS** — todos do
  CSV pré-live (`FT_Odds_H/D/A`, `Odds_O25`, `BTTS_Yes`).
- **Labels em cima de TODAS as colunas**: Casa / Empate / Fora / O2.5 / BTTS
  (text-2xs zinc-600 uppercase, `font-semibold`, `tracking-wide`) — decisão
  final do usuário (com só uma linha, cabeçalho completo fica legível).
  Labels O2.5/BTTS só renderizam quando o valor existe (null pula).
- **Grid de 5 colunas fixas**: `grid-cols-[1fr_1fr_1fr_0.85fr_0.85fr]`,
  `gap-x-1 gap-y-0.5` (gap vertical reduzido entre label e badge — decisão
  do usuário).
- Sem favorito explícito; altura estimada: **+≈54px** por card.
- Null em qualquer mercado → badge/label pulados (coluna vazia, alinhamento
  mantido pelo grid).

## Contrato do payload (backend → frontend)

Campo `odds` em cada jogo do `live.json` (só prematch — SEM `live`):

```json
"odds": {
  "prematch": { "home": 1.67, "draw": 4.4, "away": 5.5, "over25": 2.18, "btts": 1.83 }
}
```

- Todos os valores `number | null` (null = dado indisponível no CSV).
- `odds` ausente ou tudo null → card sem a seção (jogos sem odds no CSV).

## Implementação backend (momentum-scanner)

1. **`monitor.todays_matches()`**: carrega do CSV `FT_Odds_H/D/A`, `Odds_O25`,
   `BTTS_Yes` e expõe no match dict como `prematch_odds =
   {home, draw, away, over25, btts}` (floats; 0/ausente → null).
2. **`snapshot.build_game()`**: inclui `odds = { prematch: <prematch_odds> }`
   no payload (shape fixo, nulls).
3. **Removido**: `_extract_odds`/`_pick_1x2_odds`/`_status_minute`/
   `_is_live_status`/`ODDS_BOOKMAKER_PRIORITY` do extractor, passo 6 do
   `extract_all`, init script de age-verification do browser e o campo `live`
   do payload (v3, commit d7a90e6).

## Implementação frontend (jonebet)

1. **`app/utils/schemas.js`** (`scannerSnapshot`): schema permissivo
   (`FlexObject` + `FlexArray` de `z.unknown()`) — campo novo passa sem ajuste.
2. **`app/components/scannerCard.vue`**: seção entre o `div` dos times e o
   `<MomentumChart>` — grid 5 colunas, labels em cima de todas as colunas,
   linha de 5 badges azuis (1X2 + O2.5 + BTTS). Nulls pulam label+badge.
3. **Testes** (`tests/app/components/scannerCard.spec.ts`): renderiza 5 badges
   + labels Casa/Empate/Fora/O2.5/BTTS; sem odds → seção ausente; sem
   secundários → labels 1X2 mantidos, O2.5/BTTS pulados.

## Fora de escopo

- Favorito explícito no card (decidido: não mostrar).
- Odds live (decidido: remover — Flashscore bloqueia IP de datacenter).
- Notificações/regras baseadas em odds (mudança de comportamento, outro tema).
