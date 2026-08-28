# Separador de 1º/2º tempo no gráfico de momentum do scanner

## Objetivo

Adicionar uma linha vertical tracejada fina no gráfico de momentum do card do
scanner, separando visualmente o 1º tempo do 2º tempo.

## Decisão de design

**Opção A — linha tracejada no meio do gráfico (aprovada no visual companion).**

- Posição: `x = 320` no viewBox `640x158` do `MomentumChart`.
- A divisão **não** é em 45 barras: o Flashscore normaliza o jogo inteiro
  (90' + acréscimos) num viewBox fixo com `ESTIMATED_TOTAL_MINUTES = 96`
  (48 + 48). O meio do gráfico é o fim do 1º tempo com acréscimo embutido
  (~minuto 48-49), independente de o acréscimo real ser 45+2 ou 45+5.
- A linha só não é "exata por jogo" (45+5 num jogo, 45+2 noutro) — isso
  exigiria o backend expor o minuto do intervalo no snapshot. Fora de escopo
  nesta iteração; a normalização do Flashscore já resolve o caso médio.

## Mudança

`app/components/momentumChart.vue`, dentro do `<svg>` existente:

```svg
<line
  x1="320" y1="0" x2="320" y2="158"
  stroke="#71717a" stroke-width="1" stroke-dasharray="4 4"
  opacity="0.7"
/>
```

- Estilo idêntico ao mockup aprovado (zinc-500, 1px, tracejado 4/4, 70%).
- Sem mudança de API de props; sem mudança de backend.

## Verificação

- Visual: dev server na 3000, card do scanner com gráfico, linha visível no
  meio, sem quebra de layout em mobile (preserveAspectRatio="none" mantém).
- Testes existentes de `scannerCard` não dependem do conteúdo do SVG do
  gráfico (o MomentumChart é testado isoladamente, se houver spec).
