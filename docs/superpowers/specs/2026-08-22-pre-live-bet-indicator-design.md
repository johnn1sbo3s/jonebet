# Indicador de modelos pré-live com apostas

## Resumo

Adicionar um indicador visual nos cards de jogos (scanner e relatório do dia) mostrando quantos modelos têm apostas pré-live para aquele jogo. No scanner, o clique abre um modal interno. No relatório, hover/toque mostra um tooltip com nomes e odds.

## Contexto

Todos os daily-bets no sistema são considerados apostas pré-live. Cada bet tem um campo `Odds` com a odd do mercado. A informação de quais modelos têm apostas pra um jogo já existe nos dados de daily-bets (API em `api.jonebet.xyz/daily-bets`).

Hoje:
- **Scanner cards** (`scannerCard.vue`): Mostram jogos ao vivo mas não indicam se existem apostas pré-live. Já têm um botão "Análise pré-jogo" que carrega análise via `usePreGameAnalysis`.
- **Report cards** (`reportGameCard.vue`): Mostram `estrategias` inline (badges com nome + recomendação + confiança), mas não indicam a contagem de modelos de forma compacta nem mostram odds por modelo.

## Decisões de design

### Scanner cards (scannerCard.vue)

**Indicador:** Badge clicável na barra superior do card (ao lado de notificações/favoritos/print/flashscore), exibindo `🎯 X modelos` quando X > 0. Quando X = 0, não mostra nada.

**Ação do clique:** Abre um modal interno no card (mesmo estilo overlay do "Análise pré-jogo" e "Avaliar com IA") com:
- Lista dos modelos com apostas pra aquele jogo
- Cada item mostra: nome natural (`modelNameToNaturalName`) + odd com 2 casas decimais
- Botão "Fechar" no canto

**Fonte dos dados:** Fetch único de `/daily-bets` no nível da página `scanner.vue`, passado como prop pros cards. Cruza por `Home`/`Away`/`Date` com cada jogo do snapshot.

**Fluxo de dados:**
1. `scanner.vue` faz fetch de `/daily-bets` (sem parâmetro de data = puxa hoje)
2. Para cada jogo do snapshot, filtra bets que combinam Home/Away (o snapshot só mostra jogos de hoje, então Date é implícito)
3. Passa o array de bets relevantes como prop `preLiveBets` pro `scannerCard`
4. Card mostra badge e abre modal

### Report cards (reportGameCard.vue)

**Indicador:** Badge ao lado do link do Flashscore na header do card, exibindo `🎯 X modelos` quando X > 0. Quando X = 0, não mostra nada.

**Ação do hover/toque:** Tooltip com lista compacta:
- Cada linha: nome do modelo + odd (2 casas decimais)
- No desktop: abre no hover
- No mobile: abre no toque

**Fonte dos dados:** Fetch de `/daily-bets` no nível da página `daily-report.vue`, com a `selectedDate` como parâmetro. O composable `useDailyBets` já suporta `watch` na ref de data, então refetch automático ao mudar o datepicker.

**Fluxo de dados:**
1. `daily-report.vue` usa `useDailyBets({ date: selectedDate })` para buscar bets do dia
2. Para cada jogo (jogo), filtra bets que combinam Home/Away/Date
3. Passa o array de bets relevantes como prop `preLiveBets` pro `reportGameCard`
4. Card mostra badge + tooltip

### Formatação de odds

Todas as odds são formatadas com `formatNumber(odds, 2)` — sempre 2 casas decimais (ex: `1.50`, `12.00`).

## Alterações por arquivo

### `app/pages/scanner.vue`
- Adicionar fetch de daily-bets via `useDailyBets` (sem data = hoje)
- Criar computed que mapeia cada jogo do snapshot → seus bets relevantes (match por Home/Away)
- Passar `preLiveBets` como prop pros `ScannerCard`

### `app/components/scannerCard.vue`
- Receber prop `preLiveBets` (Array, default `[]`)
- Adicionar badge `🎯 X modelos` na barra superior (condicional, só quando > 0)
- Adicionar estado `preLiveOpen` (ref boolean) para controlar o modal
- Adicionar modal interno overlay (mesmo padrão do AI/preGame) listando modelos com odds

### `app/pages/daily-report.vue`
- Adicionar fetch de daily-bets via `useDailyBets({ date: selectedDate })`
- Criar computed que mapeia cada jogo → seus bets relevantes
- Passar `preLiveBets` como prop pros `ReportGameCard`

### `app/components/reportGameCard.vue`
- Receber prop `preLiveBets` (Array, default `[]`)
- Adicionar badge ao lado do link do Flashscore: `🎯 X modelos`
- Usar `UPopover` (ou `UTooltip`) para mostrar tooltip no hover/toque com lista de modelos + odds

## Fora do escopo

- Mudanças no backend/API
- Alterações na estrutura de dados de daily-bets
- Modificações no pipeline de geração de bets
- Alterações no scanner snapshot
