# PWA Install — DataPlay Bets (design)

**Data:** 2026-08-11
**Escopo:** Tornar o site instalável como PWA no celular (escopo A: instalação; sem promessa de funcionamento offline dos dados). Decisões de visual validadas pelo usuário via visual companion. Spec revisada por reviewer (round 1, APPROVE WITH CHANGES; fixes aplicados).

## Objetivo

Usuário consegue instalar o DataPlay Bets como app no celular (tela inicial, abre em modo standalone). Fluxos:

- **Android**: instalação programática via prompt nativo (beforeinstallprompt).
- **iOS**: sem instalação programática; passo-a-passo dentro do app.
- **Desktop**: fora de escopo — nenhum CTA de instalação (botão e drawer escondidos no computador).

Nada muda para quem não instala.

## Decisões aprovadas pelo usuário

| Item | Decisão |
|---|---|
| Escopo | A — instalável, online-only (sem cache de dados/offline) |
| CTA | Drawer automático + botão fixo no cabeçalho + affordance nativa do navegador |
| Botão | Ícone teal preenchido (quadrado `#2dd4bf`, ícone download escuro), topo à direita. Somente mobile/tablet — escondido no desktop |
| Drawer | Visual B: celular ilustrado (mockup de tela inicial com ícone do app) + título + CTA + "não mostrar novamente" |
| Quando o drawer aparece | Primeira visita no celular (mobile/tablet), ~1,5s após o age-gate 18+ ser dispensado; X = reaparece na próxima visita; "não mostrar novamente" = nunca mais |
| Instruções iOS | Visual C: passos com mini-cenas (mini-representação de cada tela + texto) |
| Ícone | Novo quadrado 1024px: símbolo da DataPlay a partir do vetor `public/dataplay-logo.svg` (renderizado em 4096px → reduzido para 1024, sem perda), sobre fundo escuro zinc-950; símbolo a 75% da área (dentro da zona segura maskable). Aprovado pelo usuário (v3) |

## Fundação PWA

- Módulo **@vite-pwa/nuxt** (registrado em `nuxt.config.ts`).
- **Manifest**: name "Dataplay Bets", short_name "DataPlay", description curta pt-BR, lang `pt-BR`, start_url `/`, scope `/`, display `standalone`, theme_color `#09090b` (zinc-950), background_color `#09090b`.
- **Registro do link do manifest**: adicionar o componente auto-importado `<NuxtPwaManifest />` em `app/app.vue` — o módulo NÃO injeta o `<link rel="manifest">` sozinho; sem ele o site não é instalável (beforeinstallprompt nunca dispara). (Alternativa descartada: `registerWebManifestInRouteRules` — o componente é determinístico e SSR-safe.)
- **Ícones do manifest** (gerados a partir do master aprovado, `docs/superpowers/assets/app-icon-1024.png`): `192x192` (any), `512x512` (any), `512x512` (maskable, conteúdo já a 75% — zona segura), `apple-touch-icon` `180x180`. Arquivos em `public/`.
- **Service worker**: mínimo (pré-cache do shell do build, `registerType: 'autoUpdate'`), **sem** runtime caching de API. Explicitamente `workbox: { navigateFallback: null }` — app SSR; o default do módulo (`/`) pode servir shell stale do build se algum dia houver rota pré-renderizada (pitfall clássico do vite-plugin-pwa com SSR).
- **devOptions**: `pwa.devOptions.enabled: true` — sem isso o `nuxt dev` não serve SW nem manifest e a verificação de instalação em dev falha (localhost é secure context).
- **Meta-tags iOS** em `app.head` no `nuxt.config.ts`: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, `apple-mobile-web-app-title: DataPlay`, link `apple-touch-icon`.
- Instalação disponível em HTTPS (Vercel — já ok).

## UI de instalação

### Botão no cabeçalho (`app/layouts/default.vue`, slot right)

- Ícone teal preenchido (download), tooltip "Instalar app", `aria-label`.
- O slot `#right` já contém o UNavigationMenu de lg→xl — o botão entra num wrapper flex junto do menu, SEM remover o menu (a ordem visual é preservada; no mobile fica à direita, antes do hambúrguer).
- Escondido quando já instalado (standalone).
- Visível somente no mobile/tablet (`isMobileOrTablet`); no desktop fica escondido — instalação é exclusiva do celular.
- **Android**: clique → prompt nativo (beforeinstallprompt capturado).
- **iOS**: clique → abre o drawer com o passo-a-passo.

### Drawer (`installDrawer.vue` — USlideover, `side="bottom"` obrigatório)

- USlideover do Nuxt UI v4 com `side="bottom"` (default é `right` — sem isso o drawer entra pela lateral, fugindo do visual aprovado).
- Abre automático na primeira visita: `isMobileOrTablet` (useDevice — cobre phones e tablets, incl. iPad com UA nativo; iPad em modo desktop-UA fica fora de escopo, documentado), não instalado, nunca dispensado.
- **Sequenciamento com o age-gate 18+**: o timer de ~1,5s só inicia DEPOIS que o age-gate (`jonebet:gambling-alert-dismissed`) foi dispensado/fechado — o modal 18+ é não-dismissível e cobre a tela na primeira visita; o drawer nunca pode empilhar por cima dele (nem ser escondido atrás).
- Conteúdo (visual B aprovado): mockup de celular com ícone do app na tela inicial + título + CTA "Instalar agora" + link "Não mostrar novamente".
- **Android**: CTA → prompt nativo. **Prompt nativo dispensado** → o conteúdo do drawer troca para as instruções (o beforeinstallprompt é one-shot; chamar prompt() de novo falha) — o CTA nunca fica morto.
- **iOS**: CTA → conteúdo interno troca para o passo-a-passo (visual C: mini-cenas + texto).
- X fecha sem persistir (volta na próxima visita); só "Não mostrar novamente" persiste.
- Escondido quando instalado ou em desktop.

### Detecções

- **Instalado**: `matchMedia('(display-mode: standalone)')` ou `navigator.standalone` (iOS). Checagem em `onMounted` client-only (evita flash do botão em app já instalado durante hidratação).
- **Reavaliação pós-instalação**: escutar evento `appinstalled` e `change` do matchMedia standalone → esconder botão/drawer em tempo real.
- **Pode instalar programaticamente**: evento `beforeinstallprompt` disponível (Android) vs iOS (instruções).
- **Dispensa persistida**: localStorage, chave `jonebet:pwa-install-dismissed` (convenção namespaced do repo, ex.: `jonebet:gambling-alert-dismissed`); falha de storage → tratar como não dispensado (try/catch, mesmo padrão do age-gate).

## Estrutura de código

- `app/utils/pwaInstall.js`: funções puras — `isStandalone()`, `isMobileOrTablet(device)`, `wasDismissed(storage)`, `shouldShowDrawer({...})`, `dismiss(storage)`, textos/ação por plataforma. Padrão do repo (funções puras, sem framework).
- Componentes novos (pasta plana, auto-importados): `installButton.vue` (usado no header) e `installDrawer.vue` (USlideover side="bottom").
- `app/app.vue`: adicionar `<NuxtPwaManifest />`.
- Testes: unitários das funções puras + teste de componente do botão (`mountSuspended` + mocks centralizados). O teste do botão precisa de mock do `$device` (useDevice) e do matchMedia standalone — estender `app/test.setup.ts` (ou mock por arquivo) com esses stubs; happy-dom implementa matchMedia mas sempre `matches: false`.

## Erros e casos de borda

- localStorage bloqueado (modo privado) → try/catch, drawer continua aparecendo.
- Age-gate 18+ aberto → drawer automático nunca dispara por cima; espera a dispensa.
- beforeinstallprompt nunca dispara (ex.: política do navegador, já instalado) → comportamento iOS (instruções) no mobile; no desktop o botão fica escondido.
- Prompt nativo exibido e dispensado pelo usuário → one-shot; drawer troca para instruções (CTA não morre).
- Drawer aberto + usuário instala por outra via → evento `appinstalled`/matchMedia reavalia e esconde botão e drawer.
- X no drawer: sem persistência (volta na próxima visita).
- Desktop: sem CTA — botão e drawer escondidos (instalação exclusiva do mobile).
- iPad com UA desktop (iPadOS 13+): fora de escopo do drawer (useDevice não detecta); iPad com UA nativo recebe drawer + instruções.
- Ícone: conteúdo a 75% — zona segura maskable (corte circular/arredondado do Android) respeitada.

## Verificação

- DevTools → Application → Manifest/Installability (Lighthouse removeu a categoria PWA do relatório padrão na v10 — não usar Lighthouse).
- Instalação real em dev (`devOptions.enabled: true`): manifest servido, SW registrado, botão dispara prompt no Chrome (mobile emulação).
- Validação visual do ícone: já aprovada pelo usuário (v3).
- Testes unitários da lógica pura e do botão.

## Fora de escopo (explícito)

- Instalação desktop (PWA de desktop) — nenhum CTA no computador.
- Funcionamento offline dos dados (escopo A).
- Notificações push (escopo C futuro).
- Cache de API / live.json no service worker.
- iPad em modo desktop-UA (age-gate/drawer).
