# Perguntar à IA — fatia do frontend

**Status:** done (implementado, revisado e commitado em 2026-09-20)
**Repo:** `frontend`

## Contexto

Esforço cruzado: o scanner responde a pergunta, o frontend pergunta e exibe. A visão completa do
esforço está em `momentum-scanner/.scratch/ask-ai-jev/spec.md`; este documento cobre só o que este
repo entrega, e não reproduz a spec do scanner.

Esta fatia foi substituída por `ask-ai-v2` (payload por similares, probabilidade pura no lugar de
SIM/NÃO/inconclusivo). Ela fica como registro do que o frontend já entregou.

## O que este repo entrega

- Composável que chama `POST /ask-ai` do scanner com `{game_id, question_id}`, usando a base de
  `SCANNER_SNAPSHOT_URL`, no mesmo padrão dos composáveis de pré-jogo e xG.
- Terceiro botão "Perguntar à IA" no card do scanner, ao lado de xG e pré-jogo.
- Dropdown com as três perguntas; cada pergunta sem sentido no momento do jogo fica desabilitada.
- Modal de resposta no padrão do xG: veredito, probabilidade e aviso de amostra insuficiente.
- Falha de rede mostra mensagem com retry, nunca um veredito inventado.
- Interface em português; o estado da conversa permanece em inglês, no backend.

## Aceite

- [x] Botão abre o dropdown com as três perguntas e desabilita as sem sentido para o minuto atual
- [x] Escolher uma pergunta abre o modal e mostra a resposta do scanner
- [x] Falha de rede exibe "não foi possível consultar agora" com retry
- [x] Testes de componente em Vitest cobrindo dropdown, modal, desabilitação e falha

## Fora de escopo

Regra de negócio da resposta, montagem do payload e persistência da pergunta: tudo isso é do scanner.
