# Escolha do estilo do gráfico de momentum no scanner

**Status:** ready-for-agent

## Problem Statement

O gráfico de momentum de cada card do scanner ao vivo só existe em uma forma: barras espelhadas, uma por minuto, nascendo da linha central. Quem varre uma tela cheia de cards para decidir onde olhar lê a disputa de pressão devagar, porque cada minuto é um traço fino separado do vizinho — a forma de relevo contínuo, que mostra a pressão como uma mancha, é mais rápida de bater o olho, mas hoje não existe na tela e o usuário não tem como escolhê-la.

## Solution

A tela do scanner ganha um bloco **Visualização** com o controle **Barras | Área**, acima da grade de jogos. A escolha vale para todos os cards de uma vez, é lembrada no navegador entre visitas e barras continua sendo o padrão de quem nunca escolheu.

No estilo **área**, o gráfico desenha a mesma informação da barra em forma de mancha: uma banda por minuto, da linha central até o valor, preenchida do lado do time que dominou aquele minuto — casa acima, fora abaixo — com curva suavizada e sem nunca atravessar a linha central. Os marcadores de gol e chute continuam sobrepostos, na mesma posição e no mesmo eixo de tempo.

## User Stories

1. Como usuário do scanner, quero escolher entre barras e área, para que eu leia a pressão no formato em que eu penso mais rápido.
2. Como usuário do scanner, quero que a escolha valha para todos os cards ao mesmo tempo, para que eu não precise configurar jogo por jogo.
3. Como usuário do scanner, quero que a escolha sobreviva ao recarregar a página, para que minha preferência não volte ao padrão a cada visita.
4. Como usuário do scanner, quero que a primeira visita mostre barras, para que a tela não mude sozinha para quem já a conhece.
5. Como usuário do scanner, quero o controle num bloco chamado **Visualização**, para que eu distinga uma escolha de desenho de um filtro de jogos.
6. Como usuário do scanner, quero ver o estilo de área preenchido do lado do time que dominou cada minuto, para que a altura da mancha diga "quantos mais" e o lado diga "quem".
7. Como usuário do scanner, quero que a mancha nunca atravesse a linha central, para que a troca de domínio apareça como pinçamento no centro e não como um risco diagonal confuso.
8. Como usuário do scanner, quero que a mancha chegue até a linha central nos minutos de domínio do adversário, sem sombra do outro lado, para que cada metade continue contando a história de um time só.
9. Como usuário do scanner, quero que a curva passe pelos minutos observados sem inventar picos, para que uma pressão de 0,4 continue parecendo 0,4.
10. Como usuário do scanner, quero ver os marcadores de gol e chute sobrepostos à mancha, para que eu ligue a pressão às finalizações no mesmo lugar.
11. Como usuário do scanner, quero que os marcadores fiquem na mesma posição nos dois estilos, para que trocar de estilo não mude onde o gol está.
12. Como usuário do scanner, quero que o popover dos marcadores continue abrindo em ambos os estilos, para que eu leia o minuto sem trocar de visualização.
13. Como usuário do scanner, quero que as faixas cinza de fundo continuem visíveis por baixo da mancha, para que eu ainda consiga comparar alturas com a escala.
14. Como usuário do scanner, quero que os dois tempos continuem em painéis separados por um vão também no estilo de área, para que a pausa do jogo não vire pressão contínua.
15. Como usuário do scanner, quero que o segundo tempo siga posicionado no painel da direita, para que os minutos continuem na ordem em que o jogo aconteceu.
16. Como usuário do scanner, quero a mesma cor por time nos dois estilos, para que trocar de estilo não mude quem é quem.
17. Como usuário do scanner, quero que a troca de estilo seja instantânea, para que comparar as duas formas não custe espera.
18. Como usuário do scanner, quero que jogos sem dados continuem mostrando o aviso de aguardando dados, para que um estilo novo não invente gráfico vazio.
19. Como usuário do scanner, quero que um jogo no intervalo mostre só o primeiro tempo preenchido, para que a mancha não se estenda por um tempo que ainda não aconteceu.
20. Como usuário do scanner, quero que gol nos acréscimos apareça dentro do painel do segundo tempo, para que o fim da mancha não escape do gráfico.
21. Como usuário do scanner, quero que a mancha termine no último minuto lido, para que a pressão não se prolongue até o fim do painel sem dado.
22. Como usuário do scanner, quero que o seletor apareça também no celular, para que a preferência não exista só no desktop.
23. Como usuário de leitor de tela, quero que o gráfico continue anunciado como gráfico de momentum, para que a troca de estilo não mude o que ele afirma.
24. Como usuário de leitor de tela, quero que o controle tenha rótulo lido em palavras, para que eu saiba que estou escolhendo a forma do gráfico.
25. Como usuário com o armazenamento do navegador bloqueado, quero que a tela funcione e a escolha valha nesta sessão, para que a preferência não vire erro.
26. Como usuário do relatório de amanhã, quero que a tela continue sem seletor de estilo, para que a preferência do scanner não insinue um gráfico que não existe lá.
27. Como usuário do scanner, quero que as linhas de pressão, pico e controle continuem com os mesmos valores, para que a mudança seja só de desenho.
28. Como usuário do scanner, quero que trocar de estilo não emita requisição, para que a mudança não mexa no ciclo de dados nem na idade do dado.

## Implementation Decisions

- **O gráfico ganha um estilo.** O desenho de momentum passa a aceitar um estilo — `barras` (padrão) ou `area` — mantendo as props atuais de barras, gols, chutes e notificações. Nenhum consumidor atual além do card do scanner depende desse desenho, então o padrão preserva o comportamento de hoje.
- **Mesma moldura, mesmos eixos.** Painéis por tempo, vão entre eles, ticks, fundos, faixas e linha central continuam iguais nos dois estilos; a área troca apenas a camada de valor. O eixo de tempo é comum aos marcadores, então nada neles se move.
- **A área é feita de trechos de domínio.** Cada sequência de minutos consecutivos dominada pelo mesmo time vira uma banda: nasce na linha central na borda do trecho, sobe até os valores observados e volta à central na borda seguinte. Minutos de empate (0 x 0) ou de ausência de medidor não geram banda e cortam o trecho, para que a mancha não atravesse um minuto morto.
- **A curva é suavizada, presa à sua metade.** O traçado é suave entre os minutos observados, com a curva limitada a não ultrapassar a linha central nem a borda do painel, de modo que uma amplitude alta nunca vaze para o lado do adversário nem invente picos acima do valor real.
- **Preenchimento discreto destaca a altura.** Preenchimento translúcido por cima das faixas de fundo, com a borda superior marcada na cor do time; a linha central é redesenhada por cima da mancha, para continuar sendo a fronteira visível.
- **O estilo é estado da tela, não do card.** A tela do scanner guarda um único estado de estilo, aplicado a todos os cards renderizados — favoritos e lista principal — e o card apenas repassa o valor ao desenho.
- **Bloco Visualização.** O controle entra num bloco próprio com o título **Visualização**, acima da grade, espelhando o bloco de mesmo título que o relatório de amanhã já usa; as opções são **Barras** e **Área**, no controle segmentado que a tela já utiliza.
- **Persistência com degradação.** O estado é lido no cliente ao montar, com o valor padrão `barras`, e gravado a cada mudança numa chave própria do scanner seguindo o padrão de nomes já usado pela tela. Leitura e escrita ficam protegidas contra armazenamento bloqueado, caindo para "vale nesta sessão" sem erro visível.
- **Sem interação nova no minuto.** O estilo de área não ganha hover nem tooltip por minuto: a única interação da faixa continua sendo o popover dos marcadores de gol e chute.
- **Sem animação na troca.** Alternar o estilo redesenha na hora; não há transição entre barra e mancha.
- **Sem mudança de contrato de dados.** O snapshot ao vivo continua entregando a mesma lista de barras; a mudança é inteiramente de desenho.

## Testing Decisions

Um bom teste aqui só olha o que o usuário observa: dado um conjunto de minutos, a tela mostra uma banda por trecho de domínio, do lado certo, sem cruzar a linha central, com o preenchimento limitado ao valor; os marcadores continuam presentes e posicionados pelo mesmo eixo. A implementação — como o traçado é construído, quantos nós o caminho tem, nomes de curvas — não é alvo de teste.

Dois seams, ambos já existentes; nenhum módulo novo é criado:

1. **Desenho do gráfico** — o componente do gráfico recebe barras e o estilo e renderiza o SVG. É o seam mais alto para as regras de desenho, porque é onde a informação deixa de ser dado e vira forma observável. Cobre: banda por trecho, lado por time, corte no empate, limite da linha central, curva sem vazamento, fim no último minuto lido, painel do segundo tempo, ausência de banda com dado vazio, marcadores preservados nos dois estilos, nome acessível.
2. **Tela do scanner** — a página é o seam para a fiação do controle: um único seletor no bloco Visualização muda todos os cards, o padrão na primeira visita é barras, a preferência é lida e gravada no navegador, e com armazenamento bloqueado a tela monta e a escolha vale na sessão.

Prior art direto: a spec do gráfico já testa geometria, painéis, ticks e trilhas de marcadores montando o componente; a spec do relatório de amanhã já testa a preferência de visualização indo e voltando do armazenamento; a spec do scanner já testa a tela com armazenamento bloqueado. Nenhum cenário novo precisa de harness novo.

## Out of Scope

- O card do relatório de amanhã, que não desenha gráfico de momentum e não ganha seletor.
- Controle de estilo por card.
- Hover, tooltip ou qualquer leitura por minuto no estilo de área.
- Animação de transição entre os estilos.
- Mudanças no scanner de backend, no contrato do snapshot ou nas métricas de pressão, pico e controle.
- Migração do desenho para a biblioteca de gráficos usada no resto do app.
- Qualquer mudança na barra de ações, no bloco de status ou nos filtros existentes do card.

## Further Notes

- As decisões de projeto estão registradas no estado do trabalho desta feature, e o vocabulário canônico está no `GLOSSARY.md` do repositório: o desenho se chama **gráfico de momentum**, a escolha se chama **estilo do gráfico** e os dois estilos são **bar style** e **mirrored area**.
- Dois ADRs registram o porquê das escolhas menos óbvias: o estilo ser escolha da tela e não do jogo, e a área espelhar a regra da barra em vez de plotar duas séries.
- A forma exata da mancha foi escolhida em protótipo: cristas suavizadas com preenchimento a 40% e borda traçada. As variantes descartadas eram uma silhueta contínua e uma versão com gradiente e fita de domínio.
