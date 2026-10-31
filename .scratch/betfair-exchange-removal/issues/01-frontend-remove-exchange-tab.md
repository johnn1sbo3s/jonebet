# 01 — A tela de jogos perde a aba Exchange

Repo: `frontend`
Status: `ready-for-agent`
Spec: `.scratch/betfair-exchange-removal/spec.md`

## Objetivo

A aba Exchange mostra uma lista permanentemente vazia (a coleção que a alimenta está
congelada em 2026-10-06). A tela passa a ter uma origem só: bookie.

## Escopo

- `app/components/fixturesList.vue`: remover `tabItems` (Exchange/bookie), o
  `selectedTab`, o emit `source-change` e qualquer marcação de abas no template; a lista
  renderiza direto a origem única.
- `app/pages/fixtures.vue`: remover o ref `source`, a função `onSourceChange`, o handler de
  `source-change` no template e o parâmetro `source` das duas chamadas
  (`useFetch` inicial e `fetchDaily`).
- `tests/app/components/fixturesList.spec.ts`: remover as asserções de aba/troca de origem.
- `tests/app/pages/fixtures.spec.ts`: reescrever o teste "erro na troca de origem também
  aparece" para o caminho único — o erro de `fetchDaily` disparado pela retry ou pela troca
  de data continua aparecendo; o gatilho deixa de ser `source-change`.

## Aceite

- [ ] A tela não exibe mais "Exchange" nem qualquer seletor de origem
- [ ] Nenhuma requisição a `/fixtures/daily` envia `source`
- [ ] Troca de data e retry continuam buscando e renderizando
- [ ] `npm run test` verde no `jonebet-frontend`
