# Fim da aba Exchange — fatia do frontend

**Status:** ready-for-agent
**Repo:** `frontend`

## Contexto

Esforço cruzado: a API deixa de oferecer rotas de exchange e o frontend deixa de mostrar a aba. A
visão completa está em `jonebet-api/.scratch/betfair-exchange-removal/spec.md`; este documento cobre
só o que este repo entrega, e não reproduz a spec da API.

## Problema

A aba Exchange mostra uma lista permanentemente vazia: a coleção que a alimenta está congelada
desde 2026-10-06, porque a Betfair saiu do Brasil. Duas origens na tela, uma delas morta, fazem o
usuário achar que o produto está quebrado.

## O que este repo entrega

- A tela de jogos passa a ter origem única: bookie.
- Remoção dos itens de aba, do estado de aba selecionada e do evento de troca de origem na listagem.
- Remoção do estado de origem e do parâmetro `source` nas duas chamadas de busca da página de jogos.
- Testes de componente e de página ajustados para o caminho único.

## Aceite

- [ ] A tela não exibe mais "Exchange" nem qualquer seletor de origem
- [ ] Nenhuma requisição a `/fixtures/daily` envia `source`
- [ ] Troca de data e retry continuam buscando e renderizando
- [ ] `npm run test` verde no `jonebet-frontend`

## Fora de escopo

Rotas da API, coleção `fixtures_betfair` e registry de modelos: tudo isso é do repo da API.
