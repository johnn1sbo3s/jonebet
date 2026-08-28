# Design: tela "Scanner" (jogos ao vivo com momentum, stats e notificações)

Data: 2026-08-07 · Repo: jonebet (DataPlay Bets) · Status: aprovado pelo usuário (jone) em 2026-08-07

## Contexto

A tela consome o snapshot do scanner (VPS) — contrato do payload definido e de
propriedade do spec do backend:
`momentum-scanner/docs/superpowers/specs/2026-08-07-live-snapshot-api-design.md`
(endpoint `GET https://scanner.jonebet.xyz/live.json`). Este spec NÃO redefine o
schema; apenas o consome. Dados: jogos ao vivo do último ciclo do scanner, com
`momentum` (barras 0–1 por minuto), `stats` (5 métricas, null quando ausente),
`notifications` (histórico por jogo) e `flashscore_url`.

Interação aprovada nos mockups (visual companion, `scanner-layout-v3..v8`):

- Ordenação vem pronta do backend (minuto crescente = kickoff mais recente no topo).
- Cards com notificação nos últimos 5 minutos ganham **borda teal + glow que
  respira** (keyframe próprio; `animate-ping` foi testado e descartado).
- Clique no card **vira em 3D** e mostra o verso com o histórico de notificações
  (regra, minuto do jogo, horário).
- Polling simples a cada 60s (long polling descartado: dado muda a cada ~90s e o
  site passa por serverless do Vercel).

## Tela (comportamento)

### Header
`PageHeader` (padrão do repo) com título **"Scanner ao vivo"** à esquerda; slot
direito com: dot teal pulsante + `atualizado há Xs` (derivado de `generated_at`,
tick de 1s) + `· N jogos`. Em erro de fetch mantendo dado antigo, o texto mostra
`sem conexão` discretamente.

### Grade
`grid-cols-[repeat(auto-fit,minmax(320px,1fr))]` — 3 colunas em tela larga, 2 em
média, 1 no celular, sem breakpoints manuais. Primeiro load: skeleton no padrão
do repo (`fixturesListSkeleton`).

### Card (frente)
1. Linha topo: liga (uppercase, zinc-500) à esquerda; à direita o botão **copiar**
   (ícone lucide copy; feedback "✓" teal por 2s via `navigator.clipboard`) e o botão
   **"Flashscore ↗"** (texto + ícone arrow-up-right; `target="_blank"`).
2. Times + placar + minuto: casa branco, placar em negrito, fora zinc-400, chip
   teal com o minuto (`65'`) à direita.
3. **Gráfico de momentum** (`momentumChart.vue`): SVG `viewBox="0 0 640 124"`,
   linha central em `y=62`, barras de até 56px — casa para cima em teal
   (`#2dd4bf`), fora para baixo em azul (`#3b82f6`), largura 5, arredondadas;
   ticks de minuto em 15/30/45/60/75/90 com rótulos; `preserveAspectRatio="none"`
   (ocupa a largura do card). `momentum: []` → placeholder "aguardando dados do
   gráfico".
4. **Stats em barras de força** (5 linhas, estilo Flashscore): valor casa esquerda,
   rótulo central uppercase (zinc-500, 10px), valor fora direita; barra de 5px
   abaixo, segmento teal = casa / azul = fora, largura proporcional à soma.
   Total ≤ 0 → barra vazia (só o trilho); valor `null` → `—`.
5. **Glow**: `notifications[0].at` (mais recente) dentro de 5 minutos do relógio
   do navegador → borda teal + `animation` de glow respirando (~2.6s ease-in-out,
   keyframe no `<style scoped>` do componente; 8 linhas). O glow não anima o verso.

### Card (verso — flip)
Clique no card alterna `flipped` (CSS 3D: `perspective` no wrapper,
`transform-style: preserve-3d`, `backface-visibility: hidden`, `rotateY(180deg)`
0.55s). Botões da frente e do verso com `@click.stop`. Verso: título "Notificações"
(ícone sino) + botão "← Voltar"; lista de `notifications` (mais recente primeiro):
ícone sino, `label`, chip com o minuto do jogo, horário (`at` formatado HH:MM);
vazio → "Sem notificações neste jogo ainda". Estado `flipped` por jogo (Set de ids).

### Estados vazios / erro
- `games: []` → mensagem central "Nenhum jogo ao vivo agora" (auto-refresh segue).
- 1º load com erro → componente de erro no padrão do repo (`dataErrorCard`).
- Erro em fetch posterior → mantém último dado + indicador "sem conexão".

## Mudanças por arquivo

- `nuxt.config.ts` — `runtimeConfig.public.SCANNER_SNAPSHOT_URL` (default
  `https://scanner.jonebet.xyz/live.json`; override via
  `NUXT_PUBLIC_SCANNER_SNAPSHOT_URL` — permite apontar para um JSON local em dev).
- `app/pages/scanner.vue` (novo) — `PageHeader` + fetch/polling + grade. Fetch:
  `$fetch` no `onMounted` e `setInterval` 60s; pular se houver fetch em voo;
  atualização silenciosa (não troca loading); `generated_at` em ref para o tick.
- `app/components/scannerCard.vue` (novo) — card frente/verso (flip, glow, ações,
  histórico). Janela de glow como função pura exportada (`isRecentNotification(notif, now, windowMin=5)`) para teste unitário.
- `app/components/momentumChart.vue` (novo) — SVG puro: props `bars`, renderiza
  conforme geometria acima.
- `app/components/scannerSkeleton.vue` (novo) — skeleton no padrão do repo.
- `app/layouts/default.vue` — item de navegação **Scanner** (ícone
  `i-lucide-activity`) no array `navItems` (cobre desktop, right e body).

Idioma: app é pt-BR hardcoded (sem i18n) — literais diretos, seguindo as páginas
existentes.

## Verificação

- `pnpm lint` e `pnpm build` verdes.
- Unit (vitest): `isRecentNotification` (fronteira dos 5 min, sem notificações).
- Navegação manual com `NUXT_PUBLIC_SCANNER_SNAPSHOT_URL` apontando para um JSON
  local de exemplo (mesmos dados do mockup): glow, flip, copiar, link, ordenação,
  estados vazios, responsividade (3/2/1 colunas redimensionando a janela).

## Fora de escopo

- Tela de detalhe ao clicar na aba Bookie (evolução futura; o mesmo snapshot serve).
- Filtros, favoritos, autenticação.
- SSE/WebSocket (se um dia quiser atualização instantânea, é evolução separada).
