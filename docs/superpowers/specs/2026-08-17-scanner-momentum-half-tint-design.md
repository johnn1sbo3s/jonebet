# Divisor 1º/2º tempo com painéis flexíveis no gráfico de momentum do scanner

## Objetivo

Duas mudanças no gráfico de momentum do card do scanner (`MomentumChart`):

1. **Fundo tintado por tempo** (decisão D1, visual companion 2026-08-17):
   substituir a linha vertical tracejada que divide 1º e 2º tempo por fundos
   tintados — 1º tempo em zinc-950 (afundado), 2º tempo em zinc-800 (elevado).
2. **Painéis flexíveis**: a largura de cada painel passa a ser proporcional à
   duração real do tempo (45' + acréscimo), em vez de 50 slots fixos — um
   tempo com mais acréscimo tem mais barras e ocupa mais largura. Em jogos ao
   vivo (tempo em andamento), o painel usa mínimo de 45 slots até o acréscimo
   real passar disso (divisor estável durante o jogo).

## Contexto

O `MomentumChart` (`app/components/momentumChart.vue`) usa dois painéis dentro
do viewBox `640x158`: o 1º tempo à esquerda, o 2º tempo à direita com minuto
relativo recomeçando em 1 (46' → 1). Hoje cada painel tem `PANEL_W = 320`
fixo e `STEP = 320/50` (50 slots por tempo), então 45+2 e 45+5 ocupam o mesmo
espaço e o divisor fica sempre no meio.

O dado real (`live.json`) já carrega o minuto contínuo com acréscimo por barra
(`{minute, half, home, away}`) e por gol (`{minute, stoppage_time, team, half}`)
— observado 1ºT chegando a 47 e 50 em jogos diferentes. Sem mudança de backend.

O card real (`scannerCard.vue`) tem `bg-zinc-900` (`#18181b`); os tons tintados
precisam ser distintos do card para cada painel ter identidade própria.

## Decisão de design

**Opção D1 — fundo tintado por tempo, sem linha.**

**Painéis flexíveis — largura proporcional à duração real, mínimo 45 ao vivo:**

- `h1Len = clamp(max(45, maxMinuteH1), 50)` — maior minuto observado no 1ºT
- `h2Len = clamp(max(45, maxRelMinuteH2), 50)` — maior minuto relativo (minute−45) no 2ºT
- `STEP = 640 / (h1Len + h2Len)` — passo único, densidade uniforme entre painéis
- `W1 = h1Len * STEP`, `W2 = h2Len * STEP` — divisor em `x = W1`
- Jogo ao vivo: o tempo em andamento ainda não passou de 45+ → painel fica em
  45 slots (placeholder) e o divisor não anda a cada minuto; quando o
  acréscimo real ultrapassa 45, o painel cresce até 50.
- Sem `half` (snapshot antigo na janela de deploy): mapeamento legado contínuo
  no painel 1, `h2Len = 45`.

No SVG, atrás de tudo (barras, linha base, gols, ticks):

- 1º tempo: `<rect x="0" y="0" width="W1" height="158" fill="#09090b" />`
  (zinc-950 — mais escuro que o card, painel "afundado")
- 2º tempo: `<rect x="W1" y="0" width="W2" height="158" fill="#27272a" />`
  (zinc-800 — mais claro que o card, painel "elevado")

Remover a linha vertical tracejada existente:

```svg
<line x1="320" y1="0" x2="320" y2="158" stroke="#71717a" stroke-width="1" stroke-dasharray="4 4" opacity="0.7" />
```

## Mudanças

### `app/components/momentumChart.vue`

1. Calcular `h1Len`, `h2Len`, `STEP`, `W1`, `W2` a partir das props `bars`
   (e `goals`) antes do template (ou como funções usadas no template).
2. Adicionar os dois `<rect>` de fundo imediatamente após a abertura do
   `<svg>` (antes da linha base `y=55`), com larguras `W1`/`W2`.
3. Remover a `<line>` tracejada em `x=320`.
4. `barX`/`tickX`/`panelMinute`: trocar o painel fixo `320` por `W1`
   (start do 2º painel) e o `STEP` fixo pelo calculado. Manter o clamp de
   minuto relativo em 50.
5. Adicionar `class="momentum-bar"` aos `<rect>` de barra (v-for), para os
   testes filtram barras por classe em vez de índice.

Nenhuma outra alteração: props, ticks (15/30/45 e 50/75/90), gols e
placeholder sem dados ficam intactos. Sem mudança de backend.

### `tests/app/components/momentumChart.spec.ts`

Os testes atuais contam `rect` e usam índices posicionais, que deslocam com
os 2 rects de fundo e com larguras flexíveis. Ajustes:

- Barras: trocar `wrapper.findAll('rect')` por
  `wrapper.findAll('rect.momentum-bar')` nos testes que asserem barras.
- Posições com dados simétricos (1 barra em cada tempo, máximos ≤ 45):
  `W1 = 320` (45+45) — asserções existentes de x=0/x=320/cx=322.5
  continuam válidas.
- Posições assimétricas: recalcular valores esperados com a fórmula
  (ex.: só 2ºT no minuto 96 → `h1Len=45, h2Len=50, STEP=640/95≈6.7368`,
  `W1≈303.16`).
- Teste novo: assert dos dois rects de fundo — `fill` `#09090b` com
  `x=0 width=W1` e `#27272a` com `x=W1 width=W2`.
- Teste novo: painéis flexíveis — jogo com 1ºT até 47' e 2ºT até 50' →
  divisor (x do 2º rect de fundo) ≈ `640*47/97` ≈ 310.1; jogo com acréscimos
  iguais → divisor em 320.

## Verificação

- Visual: dev server, card do scanner com gráfico — painel 1ºT mais escuro
  que o card, 2ºT mais claro, divisor na posição proporcional à duração real,
  sem linha tracejada.
- Testes: `pnpm test:unit` verde (spec do momentumChart atualizado).

## Fora de escopo

- Labels "1ºT"/"2ºT" no gráfico (opção E descartada na conversa).
- Mudança no backend (minuto exato do intervalo por jogo já vem no dado).
