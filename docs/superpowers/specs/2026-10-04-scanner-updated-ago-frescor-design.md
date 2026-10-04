# Bloco de status do scanner — largura estável e leitura de frescor

O bloco de status do topo da tela `/scanner` — a bolinha que pisca e a idade do dado (`Atualizado há
M:SS`) — muda de largura a cada segundo, e como a fonte é proporcional, até dentro do mesmo
`M:SS` cada dígito ocupa uma largura diferente. O container do header é `justify-between`, então a
borda direita do bloco fica fixa e o crescimento invade a esquerda: a bolinha dança dentro do
próprio bloco e o botão "Relatório de amanhã" é empurrado na mesma hora. No celular o problema é
pior, porque a linha dos botões já está cheia e o bloco não cabe. A decisão central é reservar
largura fixa no bloco inteiro, medida no pior caso, e trocar os quatro estados dentro dela; no
celular o bloco desce para uma linha própria. O offline deixa de ser texto e passa a ser cor da
bolinha. Comparação lado a lado em
[`updated-ago-frescor-scanner-visual.html`](./updated-ago-frescor-scanner-visual.html).

## Terms

**Idade do dado** — tempo decorrido desde o `generated_at` do snapshot, renderizado como `há M:SS`.
Evitar: "última atualização", "atualizado há" (é o rótulo atual, ambíguo entre "quando o front
atualizou" e "de quando é o dado"), "sync".

**Bloco de status** — o elemento que contém a bolinha viva, a idade do dado e o sinal de offline.
Evitar: "header" (é o PageHeader inteiro), "toolbar".

**Largura reservada** — a largura fixa do bloco, igual à do pior caso entre os quatro estados.
Evitar: "largura fixa" sem dizer de quê (a do bloco, não a do texto), "placeholder".

**Ciclo do scanner** — a emissão de um novo snapshot, que zera a idade do dado. Evitar: "refresh",
"reload" (recarregar a página é outra coisa).

**Offline** — o estado sem conexão de rede, sinalizado pela cor da bolinha. Evitar: "erro de rede"
(não é erro), "desconectado" como rótulo visível (o texto sai de cena).

## Why

O usuário lê esse número para saber se os dados que aparecem nos gráficos dos jogos ainda valem:
"eu vejo esse número pra entender se os dados que eu estou vendo nos gráficos dos jogos estão
atualizados, se tiver muito tempo eu sei que pode tá tudo atrasado e o jogo já mudou". O limiar
prático que ele dá é de cerca de **1min20s** — abaixo disso ele confia, acima disso suspeita.

O que ele não pediu: um contador de segundos existindo. O que ele pediu foi que a contagem
continue rolando, porque "me parece menos erro" do que a interface declarar que o dado está velho.
Ou seja, o problema nunca foi a informação, foi a caixa: um elemento variável de largura dentro de
uma linha cheia.

Dois problemas de layout foram apontados de imediato e ambos vêm da mesma causa. O primeiro é o
tremor contínuo da bolinha e do botão de relatório ao lado. O segundo é o celular, que ele pediu
para ser tratado de verdade e não só com número tabular.

## Locked decisions

### q1 — A largura reservada é do bloco inteiro, não do texto (B)

**Decisão:** o bloco de status tem largura fixa, igual à do pior caso entre os quatro estados, e
os estados trocam dentro dela. `font-variant-numeric: tabular-nums` entra junto, mas é o
complemento e não o mecanismo: sozinho ele não fecha nem a virada `9:59` → `10:00` nem os três
estados que não são número.

**Por que cada perdedora perdeu:**

- **A — reservar largura só no span da idade do dado.** Fecha a variação entre dígitos, mas não
  fecha o esqueleto de carregamento, nem a string vazia do primeiro estado, nem a troca entre eles.
  O bloco continua tendo quatro larguras; só uma delas para de variar.
- **C — só `tabular-nums`, sem `min-width`.** É a mais barata de implementar, e a única que
  continua errada no instante da virada de minuto, que é justamente quando o usuário está mais
  inclinedado a olhar o número.

**Medição:** o pior caso é o rótulo "Atualizado" mais `há 100:00` (3 dígitos de minuto, o maior
antes de virar quatro). No browser, com a fonte do app, isso cabe em **136px** de bloco —
`w-[8.5rem]` — com o slot da idade em `w-[6ch]`. Confirmado em 2026-10-04: a largura do bloco e a
borda esquerda dele ficaram constantes por 12s, atravessando um reset real de snapshot.

**Reversibilidade:** alta. É largura e fonte; desfazer é remover duas declarações.

### q4 — O reset anima com deslocamento vertical curto (B)

**Decisão:** quando chega snapshot novo e a idade do dado cai (de `há 1:20` para `há 0:03`), o
número antigo sai subindo e o novo entra de baixo, com deslocamento vertical curto (~200ms,
ease-out). A animação acontece **dentro** da caixa reservada — nada ao redor se move. Não há
contagem intermediária dos segundos.

**Por que cada perdedora perdeu:**

- **A — aceitar o salto sem animação.** Era a recomendação inicial, e ela está errada: o salto é
  o sinal, mas ele não precisa ser um solavanco para ser lido. O deslocamento curto mantém o
  instante legível e tira o susto, sem custar nada, porque a caixa já está travada por q1.
- **C — trocar o número por um piscar único da bolinha.** Tira a informação do lugar onde o
  usuário está olhando e põe numa bolinha de 8px. O usuário disse explicitamente que o número é o
  que ele lê.

**Por que a versão óbvia da suavização foi rejeitada dentro de B:** contar os segundos um a um
durante a descida (1:20 → 1:19 → … → 0:03) são 77 passos em cerca de 2 segundos. Vira ruído, borra
o número e atrasa justamente a leitura que importa. A suavização que compensa é o deslocamento
do texto, não a contagem.

**Reversibilidade:** baixa. É o único item aqui que introduz estado de animação no componente, e
animação que entra em header é difícil de remover depois sem virar revisão visual.

## Routine choices

- **q2 — No celular o bloco desce para linha própria (A).** Abaixo de `sm` o bloco de status fica
  em uma linha dedicada, abaixo dos dois botões de relatório, ocupando a largura toda. As outras
  duas (encolher na linha dos botões, ou subir para a linha do título ao lado do badge de jogos)
  foram descartadas por serem piores: na primeira a largura que precisa sobrar é exatamente a que
  não sobra, e na segunda o status divide a linha com o badge de jogos, que tem prioridade maior.
- **q3 — Offline vira cor da bolinha, sem texto (A + nota do usuário).** O rótulo `· sem conexão`
  sai do span e o sinal passa a ser exclusivamente a cor laranja da bolinha. A idade do dado
  continua aparecendo quando offline — é justamente quando ela mais importa, porque é ela que
  diz se os gráficos ainda são confiáveis. A alternativa de esconder a idade quando offline foi
  descartada por apagar a informação num instante em que ela é crítica.
- **q5 — A bolinha continua pulsando quando offline (A).** Só a cor muda. Pulsar devagar (C) seria
  um terceiro estado que ninguém lê sem ser explicado, e parar de pulsar (B) faz a bolinha parecer
  quebrada em vez de dados velhos.
- **q6 — Sem skeleton no primeiro carregamento (B).** A página já tem um `ScannerSkeleton` inteiro
  cobrindo o primeiro carregamento, então um segundo esqueleto dentro do header é ruído duplicado.
  O bloco fica vazio na largura reservada até o primeiro snapshot chegar.
- **O botão "Relatório de amanhã" fica como está.** Discutido e deliberadamente fora do escopo:
  o comportamento de aparecer e sumir sozinho já foi consertado no commit `9c164d8` (2026-10-03),
  está no `master`, e a decisão foi mantê-lo com regra de relógio (`hour >= 23` em São Paulo) em vez
  de passar a consultar se o relatório realmente tem dado. Ele permanece como a terceira fonte de
  movimento na linha, e a largura reservada de q1 é justamente o que impede que isso afete o
  bloco de status.

## Verified facts

Levantados lendo o código, não perguntados ao usuário:

- `formatUpdatedAgo` (`app/utils/scanner.js:19`) devolve `há ${minutes}:${segundos com 2 dígitos}`
  e é reescrito por um `setInterval(tick, 1000)` em `app/pages/scanner.vue:595`.
- O bloco (`app/pages/scanner.vue:33-47`) contém, nesta ordem: a bolinha com `animate-ping`, um
  `USkeleton h-3 w-28` quando `loading && !snapshot`, o span da idade do dado, e o span
  `· sem conexão` quando offline.
- O container (`app/pages/scanner.vue:16`) é
  `flex w-full items-center justify-between gap-3 … sm:ml-auto sm:w-auto sm:justify-end` — a borda
  direita do bloco é ancorada, então qualquer crescimento invade a direção dos botões.
- `PageHeader` (`app/components/PageHeader.vue:2`) é `flex flex-wrap items-center justify-between`,
  com o slot `right` renderizado como irmão do bloco do título. Abaixo de `sm` o `flex-wrap`
  empilha, e é aí que os três itens disputam a mesma linha.
- O polling (`app/pages/scanner.vue:548`) faz `await sleep(10_000)` depois de aplicar uma versão
  nova do snapshot, ou seja, o reset do contador acontece na cadência do scanner, não a cada
  segundo — o tremor contínuo vem do `M:SS` contando, e o solavanco vem desse reset.
- A fonte do app é proporcional, então `1` e `0` têm larguras diferentes mesmo com o mesmo número
  de caracteres.
- O `Relatório de amanhã` é governado por `hasTomorrowReport`
  (`app/pages/scanner.vue:274`), `DateTime.now().setZone(SP_TZ).hour >= 23`, reativo ao `clockTick`
  que o `tick` de 1s incrementa.

## Risks

- **A largura reservada é um número, e números envelhecem mal.** Se o rótulo mudar ("Atualizado há"
  para outra palavra) ou a fonte mudar, os 130px deixam de ser o pior caso e o tremor volta
  silenciosamente. Mitigação: derivar a largura do pior caso real em vez de confiar no número, ou
  deixar o cálculo explícito e coberto por teste.
- **A animação do reset precisa respeitar `prefers-reduced-motion`.** Um deslocamento de 200ms é
  exatamente o tipo de movimento que a preferência existe para suprimir, e um header pisando é
  perturbador para quem pediu isso.
- **A bolinha laranja precisa de contraste suficiente em fundo escuro.** `teal-400` é o valor atual;
  laranja em `zinc-900` costuma precisar de um tom mais claro do que o escolhido no instinto,
  e a escolha tem que ser verificada, não presumida.
- **O offline vira dependente de uma cor só.** Eliminar o texto `· sem conexão` torna o sinal
  ilegível para quem não distingue laranja de teal. Resolvido na implementação: a bolinha é
  `aria-hidden` e o estado continua disponível em texto para leitor de tela, num `span.sr-only`
  que muda a cada segundo — por isso **sem `aria-live`**, que viraria um fluxo de anúncio
  ininterrupto. O que sobra é a cor como único canal visual, e isso foi decisão do usuário.
- **Reserva de largura em linha cheia no celular.** Bloco vazio na largura reservada durante o
  primeiro carregamento, mais uma linha dedicada, deixa o header mais alto do que é hoje. É o custo
  aceito de q2.

## Deferred

- **Passar o "Relatório de amanhã" a consultar se o relatório existe, em vez de usar o relógio.**
  Deliberadamente adiado: o usuário confirmou que a decisão é manter a regra de relógio. Reabre se
  a mentira de "botão que aponta para relatório inexistente" incomodar de novo, ou se o relatório
  passar a ser gerado em horário imprevisível.
- **Reservar espaço também para o "Relatório de amanhã"**, para que o botão entre e saia sem mover
  nada. Reabre se o tremor dele na virada das 23h ficar visível a ponto de incomodar — hoje é a
  única fonte de movimento restante na linha.

## Open threads

- Nenhum ponto de discussão terminou sem decisão. O comportamento do reset foi discutido em
  thread dentro de q4 e resolvido ali: a versão da contagem intermediária foi levantada e
  rejeitada.
