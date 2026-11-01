# Workflow — image-opcao-mudar

**Mode:** feature
**Spec:** approved · 2026-10-31
**Tickets:** approved · 2026-10-31
**Started:** 2026-10-31 · feat/image-opcao-mudar

## Decisões fechadas (grill, rodada 1)

- **Q1 (a)** — A área espelhada guarda a regra da barra: uma banda por minuto, da linha central até o valor do minuto, preenchida do lado do time que dominou. Não são duas séries simultâneas nem área de saldo.
- **Q2 (i)** — Um controle único na tela do scanner, valendo para todos os cards de uma vez. Sem controle por card.
- **Q3** — Barras continuam sendo o padrão no primeiro acesso; área entra como escolha explícita.
- **Q4** — A escolha sobrevive ao recarregar, lembrada no navegador; armazenamento bloqueado cai para "vale nesta sessão".
- **Q5** — Escopo é só o scanner; o relatório de amanhã não tem esse gráfico e não ganha um.
- **Q6 (i)** — Marcadores de gol e chute continuam visíveis sobre o estilo de área, mesma posição e mesmo eixo de tempo.
- **Q7** — Termo canônico: **gráfico de momentum**. O controle se chama **estilo do gráfico**, com os valores **Barras** e **Área**.

## Decisões fechadas (grill, rodada 2)

- **Q8 (b)** — Borda da área em curva suavizada passando pelos minutos observados, não segmentos retos.
- **Q9 (b)** — Duas manchas independentes por tempo: a de cima nunca cruza a linha central, a de baixo também não; quando o domínio troca, as bandas pinçam no centro em vez de riscar a diagonal.
- **Q10 (a)** — Preenchimento translúcido por cima das faixas cinza, que continuam visíveis; sem gradiente escondendo a altura.
- **Q11 (a)** — Sem interação por minuto nesta versão; paridade com a barra, e o hover da faixa fica dos marcadores de gol e chute.
- **Q12 (a)** — Troca de estilo instantânea, sem animação de morph.
- **Q13 (a)** — Bloco "Visualização" acima da grade, espelhando o bloco que o relatório de amanhã já usa.

## Protótipo

- Pergunta respondida no protótipo: como fica a área e o seletor. Vencedora: **variante A — cristas com borda** (curva suavizada, preenchimento a 40%, borda traçada em 1,5).
- Descartadas: **B — silhueta contínua** e **C — gradiente com fita**.
