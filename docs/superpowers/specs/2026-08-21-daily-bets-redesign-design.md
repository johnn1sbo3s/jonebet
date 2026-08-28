# Design — Redesign da tela "Apostas do dia"

**Data:** 2026-08-21
**Status:** aguardando revisão
**Origem:** avaliação de design da tela `daily-bets` (achados: mês em inglês, label "Goleada Casa" cortado, data repetida nos 79 cards, 3 linhas de filtro no mobile, lista longa sem pontos de apoio)

## Objetivo

Melhorar a varredura da lista de apostas do dia agrupando por horário de início, eliminando redundâncias (data repetida) e defeitos de layout (label cortado, filtro quebrado em 3 linhas no mobile), e adicionar navegação de volta ao topo.

Fora de escopo: mudanças de API/backend, paginação/scroll infinito, outros componentes além dos listados.

## Decisões aprovadas pelo usuário

| # | Decisão | Escolha |
|---|---------|---------|
| 1 | Label "Goleada Casa" | Renomear para **"Goleada H"** |
| 2 | Selo de data repetido | **Remover** o badge de data do card (resolve também o mês em inglês — achado 1) |
| 3 | Contagem de apostas | Alinhada à **direita**, na mesma linha dos filtros |
| 4 | Agrupamento | Por horário; painéis com chip de horário estilo caixinha de odd; **formato linha única "15:00"** |
| 5 | Voltar ao topo | Botão flutuante, aparece **após ~1 tela de scroll** |

## Mudanças por arquivo

### 1. `app/pages/daily-bets.vue`

**Contagem à direita:** a contagem sai da esquerda e vai para a mesma linha dos filtros (`justify-between` já existe). Layout da linha:

```
[DatePicker] [USelectMenu modelos] ······ [79 apostas]
```

Mobile (1 linha): os três elementos dividem a linha — DatePicker fixo, USelectMenu `flex-1`, contagem compacta à direita. Sem wrap em 390px (mockup validado).

**Agrupamento por horário:** substituir a `<ul>` plana por grupos computados:

```js
const groupedBets = computed(() => {
  const groups = new Map()
  for (const bet of bets.value) {
    if (!groups.has(bet.Time)) groups.set(bet.Time, [])
    groups.get(bet.Time).push(bet)
  }
  return [...groups.entries()].map(([time, items]) => ({ time, items }))
})
```

Template:

```vue
<template v-for="group in groupedBets" :key="group.time">
  <div class="sticky top-N z-10 ...">
    <span class="chip teal">15:00</span>  <!-- estilo dailyBetCard odd box hot -->
    <span class="count">{{ group.items.length }} apostas</span>
  </div>
  <ul>
    <li v-for="bet in group.items"><DailyBetCard :bet="bet" /></li>
  </ul>
</template>
```

O cabeçalho do grupo é sticky (fica preso no topo enquanto o grupo rola), com fundo sólido zinc-950/blurred pra não vazar cards por trás.

### 2. `app/components/dailyBetCard.vue`

- **Remover** coluna do badge de data (grid `auto 1fr` vira bloco único).
- Remover import do Luxon/computeds de data.
- Card mantém: linha modelo + link externo; linha times + caixas de odds.
- A caixa destacada continua recebendo `bet.Market` — a renomeação acontece antes, na página.

### 3. Mapeamento "Goleada Casa" → "Goleada H"

Na página, após receber as apostas, normalizar `Market`:

```js
// app/utils/enums.js
export const MARKET_LABELS = Object.freeze({
  'Goleada Casa': 'Goleada H',
})
```

```js
// página, no computed bets:
Market: MARKET_LABELS[item.Market] ?? item.Market ?? null,
```

Se novos labels longos aparecerem, entram na tabela (padrão enums.js: matar string mágica espalhada).

### 4. Novo componente `app/components/backToTop.vue`

- `<button>` fixo, canto inferior direito (`fixed bottom-6 right-6`), círculo 44px, `bg-zinc-800 border-zinc-700`, ícone `i-lucide-arrow-up`.
- Aparece quando `window.scrollY > innerHeight` (~1 tela), some acima disso.
- Transição opacity+scale 200ms ease-out (aparece de scale 0.95→1, nunca de 0).
- Click → `window.scrollTo({ top: 0, behavior: 'smooth' })`.
- Listener de scroll com `{ passive: true }`, removido no unmount.
- `aria-label="Voltar ao topo"`.

## Estilo do painel de grupo

Espelha a caixinha de odd destacada do card (DNA visual aprovado):

| Elemento | Valor |
|---|---|
| Container pill | `rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 inline-flex gap-2` |
| Hora | `text-sm font-bold text-teal-400` ("15:00", uma linha) |
| Contagem | `text-xs text-zinc-500` ("13 apostas") |
| Sticky | `sticky top-[Npx] z-10 w-fit` + backdrop blur leve |

N = altura do header do site (medir no dev server e usar valor fixo).

## Dados / edge cases

- Ordenação dos grupos segue a ordem da API (já vem ordenada por Time). Sem reordenação local.
- Filtro por modelo ativo: grupos recalculam; grupo só aparece se tiver ≥1 aposta.
- Dia sem apostas: `DataErrorCard` atual (sem grupos), comportamento inalterado.
- `pending`: skeletons como hoje.
- Horários duplicados entre dias diferentes não ocorrem (tela é single-date).

## Testes

Atualizar `tests/app/components/dailyBetCard.spec.ts`:
- Remover teste do badge de data ("Jun"/"21").
- Adicionar: card NÃO renderiza texto de data.
- Manter demais (modelo+hora, times, odds H/D/A, classes, market box on/off).

Novo spec para a página é opcional (projeto não tem page-level tests); validação visual via dev server + medição DOM headless:
- Grupos sticky visíveis e na ordem cronológica.
- Chip com hora correta e contagem certa por grupo.
- Botão voltar ao topo: invisível no topo, visível após scrollY > viewport, volta ao topo no click.
- Mobile 390px: filtros em uma linha, contagem à direita sem wrap.
- "Goleada H" renderiza completo (sem clip: `scrollWidth <= clientWidth`) na caixa teal.

## Mockups aprovados

- Desktop: `/tmp/mock-daily-bets.html` → http://localhost:8377/mock-daily-bets.html
- Mobile: `/tmp/mock-daily-bets-mobile.html` → http://localhost:8377/mock-daily-bets-mobile.html
