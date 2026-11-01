# 01 — Estilo de área no gráfico de momentum, escolhido na tela

**Status:** done

**O que entrega:** a tela do scanner ganha um bloco Visualização com as opções Barras e Área, acima da grade de jogos, e trocar a opção redesenha todos os cards na hora, sem requisição nova. Barras continua sendo o desenho de primeira visita. No estilo de área, cada trecho de minutos dominado por um time vira uma mancha da linha central até o valor daquele minuto — casa acima, fora abaixo — com curva suavizada presa à sua metade, sem nunca atravessar o centro e encerrando no último minuto lido. Os marcadores de gol e chute, e seus popovers, continuam nas mesmas posições nos dois estilos.

**Blocked by:** None (can start immediately)

- [x] A tela do scanner mostra o bloco Visualização com as opções Barras e Área, e a tela abre em Barras
- [x] Trocar para Área redesenha todos os cards de uma vez — favoritos e lista principal — sem qualquer requisição nova
- [x] No estilo de área, cada sequência de minutos consecutivos dominada por um time vira uma banda da linha central até os valores observados, do lado daquele time
- [x] Minuto de empate ou sem medidor corta o trecho: a mancha não atravessa a linha central nem continua por cima de um minuto morto
- [x] A curva passa pelos minutos observados, suavizada e limitada à metade do seu time, sem inventar pico acima do valor real nem vazar para o lado do adversário
- [x] A banda termina no último minuto lido, sem se estender até o fim do painel
- [x] Jogo sem dados mostra o aviso de aguardando dados nos dois estilos; jogo no intervalo mostra só o primeiro painel preenchido; gol nos acréscimos aparece dentro do painel do segundo tempo
- [x] O preenchimento é translúcido: as faixas de fundo e a linha central continuam visíveis por baixo e por cima da mancha
- [x] Os marcadores de gol e chute aparecem nas mesmas posições nos dois estilos e o popover do minuto continua abrindo
- [x] As linhas de pressão, pico e controle mostram os mesmos valores nos dois estilos
- [x] Voltar para Barras devolve exatamente o desenho de hoje
- [x] O gráfico continua anunciado como gráfico de momentum para leitor de tela nos dois estilos
