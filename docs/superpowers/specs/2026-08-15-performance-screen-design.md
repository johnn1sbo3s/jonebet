# Design — Melhorias na tela de performance dos modelos

- **Data**: 2026-08-15
- **Escopo**: página `app/pages/performance/[[model]].vue` e seus componentes
- **Status**: aprovado em brainstorm (terminal)

## Contexto

Avaliação de design da tela de performance identificou problemas reais no gráfico de acúmulo
(eixo X sem título e com ticks ilegíveis), na linha de anotação teal (sem rótulo), na ausência de
headings semânticos nos cards, e na tabela "Jogos reais" que no mobile exige scroll lateral
(tabela de 784px em viewport de 375px). Este design corrige os quatro pontos e melhora a
paginação no mobile.

O `annotationIndex` da API `/models/{id}/chart` marca o fim do período de validação
(verificado em `~/Projetos/jonebet-api/app/services/model_service.py`: no modo bet,
`min(val_entradas, len(bets))`; no modo day, nº de dias únicos até o último dia de validação).

## Decisões (validadas com o usuário)

1. **Eixo X do gráfico**: manter "por aposta" como padrão; rotular o eixo como "Nº da aposta";
   ticks legíveis espelhando o `useBankrollChartOptions` (cor zinc, máx. 8 labels, sem rotação);
   no modo "por dia", título "Data" e labels formatadas `dd/mm/aa`.
2. **Anotação teal**: label "Início dos jogos reais" junto à linha.
3. **Jogos reais no mobile**: lista de cards abaixo de `md` (768px); tabela mantida em ≥md.
   Layout do card: opção B (2 linhas). Paginação numerada única, com botões maiores no mobile.
4. **Headings semânticos**: `h2` nos títulos de card, `h3` nos sub-blocos internos.

## Mudanças

### 1. `app/composables/useChartOptions.js` — `usePerformanceChartOptions`

A factory passa a aceitar `{ annotationIndex, xAxisTitle, formatTick }` e configura os eixos:

```js
scales: {
  x: {
    beginAtZero: false,
    title: { display: true, text: xAxisTitle, color: ZINC_LABEL },
    ticks: { color: ZINC_TICK, autoSkip: true, maxTicksLimit: 8, maxRotation: 0, minRotation: 0, autoSkipPadding: 16 },
    grid: { color: ZINC_GRID },
  },
  y: {
    beginAtZero: false,
    ticks: { color: ZINC_TICK },
    grid: { color: ZINC_GRID },
  },
}
```

- `xAxisTitle`: `'Nº da aposta'` (modo bet) | `'Data'` (modo day).
- `formatTick` (callback de label do eixo X): identidade no modo bet; `formatDate(v, { style: 'short' })` no modo day.
- Anotação `line1` ganha label:

```js
label: {
  display: true,
  content: 'Início dos jogos reais',
  position: 'start',        // topo da linha vertical
  color: ZINC_LABEL,
  font: { size: 10 },
  xAdjust: 6,               // desloca para a direita da linha
}
```

- `useBankrollChartOptions` e `useStaticLineOptions` não mudam.

### 2. `app/components/performanceChartCard.vue`

- Passa `xAxisTitle` e `formatTick` ao `usePerformanceChartOptions` conforme `chartByDay`.
- Título "Nº da aposta"/"Data" e formatação de data só entram quando há labels (dados carregados).

### 3. `app/components/betsTableCard.vue` — lista no mobile

- Dentro do mesmo `UCard`, abaixo de `md` renderiza uma lista; ≥md mantém a `UTable` (escondida abaixo de md):

```html
<div class="hidden md:block">… UTable atual …</div>
<ul class="flex flex-col gap-3 md:hidden">
  <li v-for="bet in betsItems" :key="`${bet.date}-${bet.home}-${bet.away}-${bet.odds}`">
    <BetsListCard :bet="bet" />
  </li>
</ul>
```

- O payload de bets não tem id único (campos: `date, home, away, odds, profit, model, result` —
  verificado na API) — a chave composta `date-home-away-odds` cobre duplicatas na mesma página.

- Header "Jogos reais" e contador `{{ betsTotal }} jogos` permanecem para os dois layouts.
- Paginação única no rodapé (serve aos dois). Botões maiores no mobile via `:ui` do UPagination
  com variantes responsivas (alvo ≥40px abaixo de md; 32px em ≥md, como hoje).

### 4. `app/components/betsListCard.vue` (novo)

Padrão visual do `dailyBetCard.vue` (grid `[auto_1fr]`/flex, `rounded-2xl border border-zinc-800 bg-zinc-900 p-3`).
Props: `{ bet: Object }`.

- **Linha 1**: `formatDate(bet.date, { style: 'short' })` à esquerda; à direita pill de resultado
  (Green → teal, Red → vermelho, mesmo critério da tabela: `result?.toLowerCase() === 'green'`)
  + lucro `formatUnit(bet.profit)` colorido (teal ≥0 / vermelho <0).
- **Linha 2**: "Casa vs Fora" com `truncate` + `:title` em cada nome (nome completo no hover —
  mesmo padrão do `dailyBetCard`); odd `formatNumber(bet.odds)` à direita em badge
  (`rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1`).

### 5. Headings semânticos (a11y)

Nos 8 títulos de card, trocar `<p class="font-semibold">` por `<h2 class="font-semibold">`:

| Componente | Título |
|---|---|
| `metricsCard.vue` | Métricas de validação / Métricas de jogos reais (via prop `cardTitle`) |
| `performanceChartCard.vue` | Gráfico de acúmulo de capital |
| `statisticalSignificanceCard.vue` | Significância estatística |
| `blockMetricsPanel.vue` | Resultados por blocos de 100 jogos |
| `monthlyResultsList.vue` | Resultados por mês |
| `resultsTablesGrid.vue` | Resultados por dia |
| `betsTableCard.vue` | Jogos reais |

Sub-blocos com `h3`: "Médias" e "Bloco atual" (`blockMetricsCard.vue`, `currentBlockMetricsCard.vue`
— via prop `cardTitle`) e "Histórico" (`blocksHistoryList.vue`).

Classes visuais (font-semibold, cor, tamanho) permanecem idênticas — só muda a tag.
Escopo confirmado por grep: nenhum desses componentes é usado fora da página de performance.

## Fora de escopo

- Hydration mismatch do console — verificação separada, fora desta feature.
- Fade/altura do "Histórico" de blocos — mantém como está (decisão do usuário).
- Estrutura/alturas dos demais blocos da página — mantidas.

## Verificação

- `pnpm test:unit` — 58 testes existentes devem passar (nenhum asserta a tag do heading; conferir
  se algum teste seleciona `p.font-semibold`).
- Checagem visual headless no dev server (porta 3001): desktop 1440px (tabela + eixo legível +
  label da anotação) e mobile 375px (lista de cards + paginação maior + truncamento com `:title`).
- Lint roda via pre-commit (lint-staged).
