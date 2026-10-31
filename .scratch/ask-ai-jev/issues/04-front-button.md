# 04 — botão "Perguntar à IA" no card do scanner

Repo: `frontend`
**Status:** done

## O que fazer

- Novo `app/composables/useAiAsk.js` espelhando `usePreGameAnalysis`/`useXgHistory` (POST `{game_id, question_id}` no `/ask-ai` do scanner, base de `SCANNER_SNAPSHOT_URL`); entrada `scannerAiAnswer` em `app/utils/schemas.js`.
- Em `app/components/scannerCard.vue`, 3º botão "Perguntar à IA" no grid `:205-227` (ao lado de xG/pré-jogo): abre **dropdown** com as 3 perguntas; ao escolher, chama e exibe modal overlay (padrão xG/pré-jogo).

## Regras (da spec, Q1/Q11/Q12)

- Dropdown desabilita pergunta sem sentido (ex: `gol_1t` após 45'; `gol_20min` mostra "faltam X'" do código).
- Modal: SIM/NÃO/inconclusivo + probabilidade + "sem amostra" (N<8); falha → "não foi possível consultar agora" + retry.
- UI em PT-BR (state em EN fica no backend).

## Testes

Vitest espelhando os specs de componentes existentes (`mountSuspended` + mocks centralizados).

## Comments

## Comments
Implementado, revisado (standards+spec APPROVED) e commitado em 2026-09-20 (TDD + onda de fix + re-review).
