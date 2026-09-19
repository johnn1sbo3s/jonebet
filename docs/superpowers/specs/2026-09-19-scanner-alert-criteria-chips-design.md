# Design — Redesign do item de alerta do scanner (critérios em chips)

Data: 2026-09-19
Status: aprovado pelo usuário (direção B via visual companion)

## Problema

O item do painel de alertas mostra só jogo e minuto. Os critérios que dispararam
a entrada (odd, pressão, chutes) não aparecem. A primeira tentativa (linha de
texto com negrito no gatilho) ficou feia: tudo colado, negrito gritando,
badge verde redundante com o título.

## Decisão

Direção B do companion: chips UBadge com label apagado + valor branco,
minuto em texto corrido na linha do jogo.

## Layout do item

- Linha 1: título curto (`Gol HT`, text-sm bold zinc-100) + horário do disparo
  à direita (text-xs zinc-500).
- Linha 2: `Palmeiras x Botafogo · 24' 1ºT` (text-sm zinc-400). Minuto em texto
  corrido, sem chip próprio. Badge verde `GHT` removida (redundante com o título).
- Linha 3: chips UBadge `size="sm"`, wrap liberado, gap 6px:
  - neutros (odd, chutes, pernas do OU que NÃO decidiram):
    `color="neutral" variant="soft"`.
  - gatilho (perna do OU que decidiu): `color="primary" variant="soft"`.
  - dentro do chip: label em zinc-400 + valor em zinc-100 (dois spans,
    UBadge não separa label de valor).
  - tudo text-xs. Sem text-2xs (política de tipografia: xs em detalhes,
    sm no demais).
- Gaps verticais de 8px entre as três linhas (hoje tudo colado).

## Regras por tipo de entrada

- `entrada_gol_ht`: chips `odd`, pernas do OU que passaram (`fav5`/`pico`/`soma5`),
  `chutes`. Gatilho = pernas em `dados.gatilhos` (calculado no backend).
  Sem `gatilhos` (alerta antigo): mostra as três pernas, nenhuma em destaque.
- `entrada_ltd`: chips `odd`, `soma10` (gatilho), `chutes`.
- `entrada_fim_jogo`: chips `soma5` (gatilho), `chutes`.
- Sem `dados` (alerta antigo ou regra de momento `regra_*`): linha de chips some.

## Dados (contrato backend → front)

O scanner já inclui em cada notificação de entrada:
`dados: {odd, fav5, pico, soma5, chutes, ...}` + `gatilhos: ["fav5", ...]`.
O front só renderiza — `entryCriteria()` em `app/utils/scanner.js` mantém o
shape `[{key, text, hot}]`; o painel decide cor pelo `hot`.

## Fora de escopo

- Verso do card (continua só título + minuto).
- Toast de alerta novo e rail colapsada (só sigla, sem espaço para chips).
- Sons, badge de não-vistos, ordenação — nada muda.

## Testes

- `entryCriteria`: perna decidida → `hot: true`; sem gatilhos → todas sem hot;
  sem dados → `[]`.
- Painel: item com dados renderiza chips com gatilho em `primary`;
  item sem dados não renderiza a linha.
