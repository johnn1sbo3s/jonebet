# PWA Install (mobile) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o DataPlay Bets instalável como PWA no celular — manifest + service worker mínimo + botão no cabeçalho + drawer de instalação (mobile only, sem offline, sem push).

**Architecture:** Módulo `@vite-pwa/nuxt` (manifest + SW no build) + `NuxtPwaManifest` no app raiz. Lógica de decisão em funções puras (`app/utils/pwaInstall.js`); estado compartilhado botão/drawer num composable singleton (`app/composables/usePwaInstall.js`, padrão `useFavorites`); dois componentes finos (`installButton.vue` no header, `installDrawer.vue` USlideover `side="bottom"`). Drawer automático só dispara após o age-gate 18+ ser dispensado.

**Tech Stack:** Nuxt 4.5.2, NuxtUI v4 (USlideover), @nuxtjs/device 3.2.4 (useDevice), @vite-pwa/nuxt 1.1.1, Vitest + @nuxt/test-utils (mountSuspended), sips (ícones).

## Global Constraints

- **Escopo A**: instalação online-only — SEM runtime caching de API/live.json no service worker, SEM push, SEM CTA no desktop.
- **Mobile-only**: botão e drawer visíveis só onde `isMobileOrTablet`; no desktop nada de CTA de instalação.
- **Age-gate 18+**: o drawer automático NUNCA abre por cima do modal de maioridade — espera `jonebet:gambling-alert-dismissed === '1'`.
- **JS puro** em source (sem TS em .vue/.js). Componentes na pasta plana `app/components/`. Funções puras em `app/utils/*.js`.
- **Sem classes Tailwind arbitrárias em px** (lint-staged `scripts/check-arbitrary-values.cjs` barra `[...px]`).
- **Testes**: `// @vitest-environment nuxt` + `mountSuspended` + mocks centralizados em `app/test.setup.ts`; util puro testado em `tests/app/utils/`, composable em `tests/app/composables/`, componentes em `tests/app/components/`.
- **Storage**: chaves namespaced (`jonebet:pwa-install-dismissed`, `jonebet:gambling-alert-dismissed`), try/catch em toda leitura/escrita.
- **NÃO rodar** `npx eslint`, `npx prettier --check` ou `pnpm build` após cada edição (lento; roda no pre-commit e o usuário verifica visualmente em `pnpm run dev`).
- Nome curto do app: "DataPlay". Cores: theme/background `#09090b` (zinc-950), primary teal `#2dd4bf`.

---

### Task 1: Fundação PWA (módulo, manifest, ícones, app raiz)

**Files:**
- Modify: `package.json` (via pnpm add)
- Create: `public/pwa-icon-192.png`, `public/pwa-icon-512.png`, `public/apple-touch-icon.png`
- Modify: `nuxt.config.ts`
- Modify: `app/app.vue`

**Interfaces:**
- Consumes: master do ícone já aprovado em `docs/superpowers/assets/app-icon-1024.png`
- Produces: manifest servido em `/manifest.webmanifest`; ícones em `public/`; `<NuxtPwaManifest />` no app raiz (auto-importado pelo módulo — verificado no source 1.1.1: `addComponent` registra `VitePwaManifest` e alias `NuxtPwaManifest`)

- [ ] **Step 1: Instalar o módulo**

```bash
pnpm add @vite-pwa/nuxt@1.1.1
```

- [ ] **Step 2: Gerar os ícones do master aprovado**

```bash
mkdir -p public
sips -s format png -z 192 192 docs/superpowers/assets/app-icon-1024.png --out public/pwa-icon-192.png
sips -s format png -z 512 512 docs/superpowers/assets/app-icon-1024.png --out public/pwa-icon-512.png
sips -s format png -z 180 180 docs/superpowers/assets/app-icon-1024.png --out public/apple-touch-icon.png
```

Verificar: `sips -g pixelWidth -g pixelHeight public/pwa-icon-192.png public/pwa-icon-512.png public/apple-touch-icon.png` → 192/512/180. O conteúdo do master já está a 75% da área — zona segura maskable respeitada (o mesmo `pwa-icon-512.png` serve `purpose: "any maskable"`).

- [ ] **Step 3: Configurar o PWA no `nuxt.config.ts`**

Adicionar `'@vite-pwa/nuxt'` ao array `modules` e o bloco `pwa` + meta-tags iOS no `app.head`:

```ts
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Dataplay Bets',
      meta: [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'DataPlay' },
      ],
      link: [{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    },
  },
  modules: ['@nuxt/ui', '@nuxt/fonts', '@pinia/nuxt', '@nuxtjs/device', '@nuxt/eslint', '@vite-pwa/nuxt'],

  pwa: {
    registerType: 'autoUpdate',
    devOptions: { enabled: true },
    workbox: { navigateFallback: null },
    manifest: {
      name: 'Dataplay Bets',
      short_name: 'DataPlay',
      description: 'Desempenho de apostas esportivas em tempo real',
      lang: 'pt-BR',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: '#09090b',
      background_color: '#09090b',
      icons: [
        { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
  },
  // ...resto inalterado
})
```

Notas (verificadas no source do módulo 1.1.1): `workbox.navigateFallback: null` evita o default `/` (app SSR; sem index.html pré-renderizado — sem shell stale); `devOptions.enabled: true` é obrigatório para o SW/manifest existirem em dev.

- [ ] **Step 4: Registrar o link do manifest no app raiz**

`app/app.vue` — adicionar `<NuxtPwaManifest />` (sem isso o Chrome nunca dispara beforeinstallprompt):

```vue
<template>
  <UApp>
    <NuxtLoadingIndicator color="linear-gradient(to right, #25D88B, #1E9EF4)" />
    <NuxtPwaManifest />
    <NuxtLayout />
    <ResponsibleGamblingModal />
  </UApp>
</template>
```

- [ ] **Step 5: Verificar em dev**

Subir `pnpm run dev` (porta livre; ver porta real via `lsof -nP -iTCP -sTCP:LISTEN` antes — 3000 pertence a outro projeto). Depois:
- `curl -s http://localhost:<porta>/manifest.webmanifest` → JSON com name "Dataplay Bets", icons 192/512, theme_color `#09090b`
- `curl -s http://localhost:<porta>/dev-sw.js?dev-sw` → responde 200 (SW de dev)
- Página inicial: `<link rel="manifest"` presente no HTML e `apple-touch-icon`.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml nuxt.config.ts app/app.vue public/pwa-icon-192.png public/pwa-icon-512.png public/apple-touch-icon.png
git commit -m "feat: PWA install foundation (manifest, SW, icons)"
```

---

### Task 2: Utils puros de instalação

**Files:**
- Create: `app/utils/pwaInstall.js`
- Test: `tests/app/utils/pwaInstall.spec.ts`

**Interfaces:**
- Produces (usado por Task 3/4/5):
  - `INSTALL_DISMISS_KEY = 'jonebet:pwa-install-dismissed'`
  - `AGE_GATE_KEY = 'jonebet:gambling-alert-dismissed'`
  - `isStandalone()` → boolean (client-only; false em SSR)
  - `isAgeGateDismissed(storage = localStorage)` → boolean
  - `wasDismissed(storage = localStorage)` → boolean
  - `dismissInstall(storage = localStorage)` → void
  - `shouldShowDrawer({ isMobileOrTablet, standalone, dismissed, ageGateDismissed })` → boolean
  - `platform({ canPrompt, isIos })` → `'android' | 'ios'`

- [ ] **Step 1: Escrever os testes que falham**

`tests/app/utils/pwaInstall.spec.ts`:

```ts
// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import {
  INSTALL_DISMISS_KEY,
  AGE_GATE_KEY,
  isAgeGateDismissed,
  wasDismissed,
  dismissInstall,
  shouldShowDrawer,
  platform,
} from '~/utils/pwaInstall'

describe('pwaInstall utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('wasDismissed: false sem flag, true com flag gravada', () => {
    expect(wasDismissed()).toBe(false)
    localStorage.setItem(INSTALL_DISMISS_KEY, '1')
    expect(wasDismissed()).toBe(true)
  })

  it('dismissInstall grava a flag', () => {
    dismissInstall()
    expect(localStorage.getItem(INSTALL_DISMISS_KEY)).toBe('1')
  })

  it('wasDismissed não quebra com storage indisponível', () => {
    const broken = { getItem: () => { throw new Error('denied') } }
    expect(wasDismissed(broken)).toBe(false)
  })

  it('dismissInstall não quebra com storage indisponível', () => {
    const broken = { setItem: () => { throw new Error('denied') } }
    expect(() => dismissInstall(broken)).not.toThrow()
  })

  it('isAgeGateDismissed: só true com flag "1"', () => {
    expect(isAgeGateDismissed()).toBe(false)
    localStorage.setItem(AGE_GATE_KEY, '1')
    expect(isAgeGateDismissed()).toBe(true)
    localStorage.setItem(AGE_GATE_KEY, '0')
    expect(isAgeGateDismissed()).toBe(false)
  })

  it('isAgeGateDismissed não quebra com storage indisponível (trata como dispensado)', () => {
    const broken = { getItem: () => { throw new Error('denied') } }
    expect(isAgeGateDismissed(broken)).toBe(true)
  })

  it('shouldShowDrawer: exige mobile + não instalado + não dispensado + age-gate ok', () => {
    const base = { isMobileOrTablet: true, standalone: false, dismissed: false, ageGateDismissed: true }
    expect(shouldShowDrawer(base)).toBe(true)
    expect(shouldShowDrawer({ ...base, isMobileOrTablet: false })).toBe(false)
    expect(shouldShowDrawer({ ...base, standalone: true })).toBe(false)
    expect(shouldShowDrawer({ ...base, dismissed: true })).toBe(false)
    expect(shouldShowDrawer({ ...base, ageGateDismissed: false })).toBe(false)
  })

  it('platform: canPrompt → android; senão ios', () => {
    expect(platform({ canPrompt: true, isIos: false })).toBe('android')
    expect(platform({ canPrompt: false, isIos: true })).toBe('ios')
    expect(platform({ canPrompt: false, isIos: false })).toBe('ios')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run tests/app/utils/pwaInstall.spec.ts`
Expected: FAIL — módulo não existe (import error).

- [ ] **Step 3: Implementar o util**

`app/utils/pwaInstall.js`:

```js
// Helpers da instalação PWA (mobile only). Funções puras, testáveis — padrão
// do repo (ex.: scanner.js). Toda leitura/escrita de storage com try/catch.
export const INSTALL_DISMISS_KEY = 'jonebet:pwa-install-dismissed'
export const AGE_GATE_KEY = 'jonebet:gambling-alert-dismissed'

// Client-only: modo standalone (app instalado) — display-mode ou iOS.
export function isStandalone() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  return navigator.standalone === true
}

export function isAgeGateDismissed(storage = localStorage) {
  try {
    return storage.getItem(AGE_GATE_KEY) === '1'
  } catch {
    return true // storage bloqueado: não segura o drawer refém do age-gate
  }
}

export function wasDismissed(storage = localStorage) {
  try {
    return storage.getItem(INSTALL_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissInstall(storage = localStorage) {
  try {
    storage.setItem(INSTALL_DISMISS_KEY, '1')
  } catch {
    // storage indisponível — segue sem persistir
  }
}

export function shouldShowDrawer({ isMobileOrTablet, standalone, dismissed, ageGateDismissed }) {
  return isMobileOrTablet && !standalone && !dismissed && ageGateDismissed
}

export function platform({ canPrompt, isIos }) {
  return canPrompt ? 'android' : 'ios'
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run tests/app/utils/pwaInstall.spec.ts`
Expected: PASS (8 testes).

- [ ] **Step 5: Commit**

```bash
git add app/utils/pwaInstall.js tests/app/utils/pwaInstall.spec.ts
git commit -m "feat: pwa install pure utils (dismiss, age-gate, show rules)"
```

---

### Task 3: Composable de instalação (estado compartilhado)

**Files:**
- Create: `app/composables/usePwaInstall.js`
- Test: `tests/app/composables/usePwaInstall.spec.ts`

**Interfaces:**
- Consumes: utils da Task 2 (`isStandalone`, `wasDismissed`, `dismissInstall`, `isAgeGateDismissed`, `shouldShowDrawer`, `platform`), `useDevice()` do @nuxtjs/device.
- Produces (usado por Task 4/5):
  - `usePwaInstall()` → `{ state, openDrawer, closeDrawer, promptInstall, showInstructions, confirmDismiss, maybeAutoOpen }`
  - `state`: `reactive({ open: false, standalone: false, canPrompt: false, view: 'home' })` — `view: 'home' | 'ios'`
  - Singleton por módulo (padrão `useFavorites`): `let state = null` + `ensureState()` com guardas `import.meta.client`.

- [ ] **Step 1: Escrever os testes que falham**

`tests/app/composables/usePwaInstall.spec.ts` (mock do `useDevice` para isolamento — o composable captura o device no setup; sem mock, dependeria do `$device` real do ambiente de teste):

```ts
// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { INSTALL_DISMISS_KEY } from '~/utils/pwaInstall'

vi.mock('../../../node_modules/@nuxtjs/device/dist/runtime/composables/useDevice', () => ({
  useDevice: () => ({ isMobileOrTablet: true, isIos: true }),
}))

describe('usePwaInstall', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('abre e fecha o drawer pelo estado compartilhado', async () => {
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { state, openDrawer, closeDrawer } = usePwaInstall()
    expect(state.open).toBe(false)
    openDrawer()
    expect(state.open).toBe(true)
    closeDrawer()
    expect(state.open).toBe(false)
  })

  it('confirmDismiss persiste e fecha', async () => {
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { state, openDrawer, confirmDismiss } = usePwaInstall()
    openDrawer()
    confirmDismiss()
    expect(localStorage.getItem(INSTALL_DISMISS_KEY)).toBe('1')
    expect(state.open).toBe(false)
  })

  it('showInstructions troca a view para o passo-a-passo iOS', async () => {
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { state, showInstructions } = usePwaInstall()
    expect(state.view).toBe('home')
    showInstructions()
    expect(state.view).toBe('ios')
  })

  it('beforeinstallprompt marca canPrompt e promptInstall chama o prompt nativo', async () => {
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { state, promptInstall } = usePwaInstall()
    const prompt = vi.fn()
    const userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), { prompt, userChoice, preventDefault: () => {} }),
    )
    await Promise.resolve()
    expect(state.canPrompt).toBe(true)
    await promptInstall()
    expect(prompt).toHaveBeenCalledTimes(1)
  })

  it('appinstalled marca standalone e fecha o drawer', async () => {
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { state, openDrawer } = usePwaInstall()
    openDrawer()
    window.dispatchEvent(new Event('appinstalled'))
    await Promise.resolve()
    expect(state.standalone).toBe(true)
    expect(state.open).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run tests/app/composables/usePwaInstall.spec.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar o composable**

`app/composables/usePwaInstall.js`:

```js
// Instalação PWA (mobile only) — estado compartilhado entre o botão do header
// e o drawer. Singleton por módulo (padrão useFavorites): os dois componentes
// chamam o composable, mas listeners/stado existem uma vez.
import { reactive } from 'vue'
import {
  isStandalone,
  wasDismissed,
  dismissInstall,
  isAgeGateDismissed,
  shouldShowDrawer,
} from '~/utils/pwaInstall'

let state = null
let deferredPrompt = null
let listenersAttached = false
let autoOpenStarted = false

function ensureState() {
  if (state) return
  state = reactive({ open: false, standalone: false, canPrompt: false, view: 'home' })
  if (!import.meta.client) return
  state.standalone = isStandalone()
  if (listenersAttached) return
  listenersAttached = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    state.canPrompt = true
  })
  window.addEventListener('appinstalled', () => {
    state.standalone = true
    state.open = false
  })
  // Reavaliação pós-instalação sem reload (spec): display-mode pode mudar
  // (ex.: abrir como app no iOS) sem disparar 'appinstalled'.
  const mql = window.matchMedia?.('(display-mode: standalone)')
  if (mql) {
    const onChange = (e) => {
      state.standalone = e.matches
      if (e.matches) state.open = false
    }
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange)
    else mql.addListener?.(onChange) // fallback iOS antigo
  }
}

export function usePwaInstall() {
  ensureState()
  const device = import.meta.client ? useDevice() : { isMobileOrTablet: false, isIos: false }

  function openDrawer() {
    state.open = true
  }

  function closeDrawer() {
    state.open = false
    state.view = 'home' // próxima abertura volta ao CTA (visual B), não às instruções
  }

  function showInstructions() {
    state.view = 'ios'
  }

  function confirmDismiss() {
    dismissInstall()
    state.open = false
  }

  // CTA "Instalar agora" — Android: prompt nativo (one-shot). iOS: instruções.
  async function promptInstall() {
    if (!deferredPrompt) {
      showInstructions()
      return
    }
    const prompt = deferredPrompt
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    deferredPrompt = null
    state.canPrompt = false
    if (outcome !== 'accepted') showInstructions()
    // accepted → appinstalled fecha/limpa
  }

  // Auto-abertura do drawer: espera o age-gate 18+ ser dispensado (poll), depois
  // ~1,5s, e abre se shouldShowDrawer. Uma vez por sessão.
  function maybeAutoOpen() {
    if (autoOpenStarted || !import.meta.client) return
    autoOpenStarted = true
    const poll = setInterval(() => {
      if (!isAgeGateDismissed()) return
      clearInterval(poll)
      setTimeout(() => {
        if (shouldShowDrawer({ isMobileOrTablet: device.isMobileOrTablet, standalone: state.standalone, dismissed: wasDismissed(), ageGateDismissed: true })) {
          state.open = true
        }
      }, 1500)
    }, 500)
  }

  return { state, openDrawer, closeDrawer, promptInstall, showInstructions, confirmDismiss, maybeAutoOpen }
}
```

Notas: `useDevice()` retorna `useNuxtApp().$device` (verificado no source 3.2.4). O poll roda até o age-gate dispensar (page-lifetime, sem cleanup — o drawer nunca abre por cima do modal 18+).

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run tests/app/composables/usePwaInstall.spec.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add app/composables/usePwaInstall.js tests/app/composables/usePwaInstall.spec.ts
git commit -m "feat: usePwaInstall composable (shared state, prompt capture, auto-open gate)"
```

---

### Task 4: Drawer de instalação

**Files:**
- Create: `app/components/installDrawer.vue`
- Test: `tests/app/components/installDrawer.spec.ts`

**Interfaces:**
- Consumes: `usePwaInstall()` da Task 3; `platform` da Task 2.
- Produces: componente auto-importado `<InstallDrawer />` (montado no layout, Task 6). Rende o USlideover `side="bottom"` com dois conteúdos: `view === 'home'` (visual B aprovado: celular ilustrado + CTA) e `view === 'ios'` (passo-a-passo com mini-cenas, visual C aprovado).

- [ ] **Step 1: Escrever o teste que falha**

`tests/app/components/installDrawer.spec.ts` (componente e composable importados DINAMICAMENTE por teste com `vi.resetModules()` no beforeEach: o composable é singleton por módulo e `autoOpenStarted` é privado — sem reset, o poll de timers reais do teste 1 vira zumbi e o teste 5 de fake timers nunca dispara. O import estático de `INSTALL_DISMISS_KEY` é ok — utils são stateless):

```ts
// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { INSTALL_DISMISS_KEY } from '~/utils/pwaInstall'

vi.mock('../../../node_modules/@nuxtjs/device/dist/runtime/composables/useDevice', () => ({
  useDevice: () => ({ isMobileOrTablet: true, isIos: true }),
}))

describe('InstallDrawer', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
    vi.resetModules()
  })

  it('abre via estado compartilhado e mostra o conteúdo home (visual B)', async () => {
    const { default: InstallDrawer } = await import('~/components/installDrawer.vue')
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const wrapper = await mountSuspended(InstallDrawer)
    usePwaInstall().openDrawer()
    await wrapper.vm.$nextTick()
    // USlideover portaliza para document.body (slot #content)
    expect(document.body.textContent).toContain('Instale o DataPlay como app')
    expect(document.body.textContent).toContain('Instalar agora')
  })

  it('CTA em iOS troca o conteúdo para o passo-a-passo (visual C)', async () => {
    const { default: InstallDrawer } = await import('~/components/installDrawer.vue')
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const wrapper = await mountSuspended(InstallDrawer)
    usePwaInstall().openDrawer()
    await wrapper.vm.$nextTick()
    const cta = [...document.body.querySelectorAll('button')].find((b) => b.textContent?.includes('Instalar agora'))
    expect(cta).toBeTruthy()
    cta.click()
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).toContain('Adicionar à Tela de Início')
  })

  it('"Não mostrar novamente" persiste e fecha', async () => {
    const { default: InstallDrawer } = await import('~/components/installDrawer.vue')
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const wrapper = await mountSuspended(InstallDrawer)
    usePwaInstall().openDrawer()
    await wrapper.vm.$nextTick()
    const dismiss = [...document.body.querySelectorAll('button')].find((b) => b.textContent?.includes('Não mostrar novamente'))
    dismiss.click()
    await wrapper.vm.$nextTick()
    expect(localStorage.getItem(INSTALL_DISMISS_KEY)).toBe('1')
    expect(usePwaInstall().state.open).toBe(false)
  })

  it('X fecha sem persistir', async () => {
    const { default: InstallDrawer } = await import('~/components/installDrawer.vue')
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const wrapper = await mountSuspended(InstallDrawer)
    usePwaInstall().openDrawer()
    await wrapper.vm.$nextTick()
    const close = [...document.body.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Fechar')
    expect(close).toBeTruthy()
    close.click()
    await wrapper.vm.$nextTick()
    expect(localStorage.getItem(INSTALL_DISMISS_KEY)).toBeNull()
    expect(usePwaInstall().state.open).toBe(false)
  })

  it('auto-abertura: não abre com age-gate pendente; abre após dispensar + delay', async () => {
    vi.useFakeTimers()
    const { default: InstallDrawer } = await import('~/components/installDrawer.vue')
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const wrapper = await mountSuspended(InstallDrawer)
    await wrapper.vm.$nextTick()
    // age-gate pendente: nada abre
    await vi.advanceTimersByTimeAsync(10_000)
    expect(usePwaInstall().state.open).toBe(false)
    // usuário confirma maioridade → poll pega a flag → +1,5s abre
    localStorage.setItem('jonebet:gambling-alert-dismissed', '1')
    await vi.advanceTimersByTimeAsync(30_000)
    expect(usePwaInstall().state.open).toBe(true)
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run tests/app/components/installDrawer.spec.ts`
Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar o componente**

`app/components/installDrawer.vue` (conteúdo do visual B e C aprovados pelo usuário — TODO o corpo vai no slot `#content`: o slot default do USlideover é o *trigger* (renderizaria o corpo solto na página e a sheet abriria vazia); o padrão do repo é `responsibleGamblingModal.vue`, que também usa `#content`. Com `#content` fornecido, o header/close embutido é substituído — o único botão de fechar é o nosso, com aria-label "Fechar"):

```vue
<template>
  <USlideover v-model:open="state.open" side="bottom" :ui="{ content: 'bg-zinc-900 border-t border-zinc-800' }">
    <template #content>
      <div class="flex flex-col gap-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-zinc-400">
            {{ state.view === 'ios' ? 'Instalar no iPhone' : 'Instale o DataPlay como app' }}
          </p>
          <UButton icon="i-lucide-x" variant="ghost" color="gray" aria-label="Fechar" size="sm" @click="closeDrawer" />
        </div>

        <!-- Visual B (home): celular ilustrado + CTA -->
        <template v-if="state.view === 'home'">
          <div class="flex justify-center py-2">
            <div class="relative w-24 rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-1.5">
              <div class="mb-1.5 flex justify-center gap-1">
                <span class="size-1 rounded-full bg-zinc-600" />
                <span class="h-1 w-8 rounded-full bg-zinc-700" />
              </div>
              <div class="grid grid-cols-3 gap-1">
                <div class="aspect-square rounded-md bg-zinc-800" />
                <div class="aspect-square rounded-md bg-zinc-800" />
                <div class="aspect-square overflow-hidden rounded-md bg-teal-500">
                  <img src="/pwa-icon-192.png" alt="" class="size-full object-cover" />
                </div>
                <div class="aspect-square rounded-md bg-zinc-800" />
                <div class="aspect-square rounded-md bg-zinc-800" />
                <div class="aspect-square rounded-md bg-zinc-800" />
              </div>
            </div>
          </div>
          <p class="text-center text-sm font-bold text-white">Leve o DataPlay para sua tela inicial</p>
          <p class="text-center text-xs text-zinc-400">Ícone na home, abre como app, sempre atualizado.</p>
          <UButton color="primary" size="lg" block class="mt-1" @click="onInstall">
            Instalar agora
          </UButton>
          <button type="button" class="text-xs text-zinc-500 underline" @click="confirmDismiss">
            Não mostrar novamente
          </button>
        </template>

        <!-- Visual C (iOS): passos com mini-cenas -->
        <template v-else>
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <span class="flex size-5 items-center justify-center rounded-full border border-zinc-700 text-2xs font-bold text-zinc-400">1</span>
              <div class="flex flex-1 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2">
                <div class="h-2 flex-1 rounded bg-zinc-700" />
                <span class="flex size-5 items-center justify-center rounded bg-teal-500 text-zinc-950">
                  <UIcon name="i-lucide-share" class="size-3" />
                </span>
              </div>
              <p class="flex-1 text-xs text-zinc-300">Toque no botão Compartilhar na barra do Safari</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="flex size-5 items-center justify-center rounded-full border border-zinc-700 text-2xs font-bold text-zinc-400">2</span>
              <div class="flex flex-1 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2">
                <div class="h-2 flex-1 rounded bg-zinc-700" />
                <div class="h-2 flex-1 rounded border border-teal-500 bg-teal-500/20" />
                <div class="h-2 flex-1 rounded bg-zinc-700" />
              </div>
              <p class="flex-1 text-xs text-zinc-300">Role e toque em "Adicionar à Tela de Início"</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="flex size-5 items-center justify-center rounded-full border border-zinc-700 text-2xs font-bold text-zinc-400">3</span>
              <div class="flex flex-1 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2">
                <div class="h-2 flex-1 rounded bg-zinc-700" />
                <span class="text-xs font-bold text-white">Adicionar</span>
              </div>
              <p class="flex-1 text-xs text-zinc-300">Toque em "Adicionar" no canto superior</p>
            </div>
          </div>
          <p class="text-center text-xs text-zinc-500">Pronto! O ícone aparece na tela inicial.</p>
          <button type="button" class="text-xs text-zinc-500 underline" @click="confirmDismiss">
            Não mostrar novamente
          </button>
        </template>
      </div>
    </template>
  </USlideover>
</template>

<script setup>
import { platform } from '~/utils/pwaInstall'

const { state, closeDrawer, promptInstall, showInstructions, confirmDismiss, maybeAutoOpen } = usePwaInstall()
const device = useDevice()

onMounted(() => {
  maybeAutoOpen()
})

function onInstall() {
  if (platform({ canPrompt: state.canPrompt, isIos: device.isIos }) === 'android') {
    promptInstall()
  } else {
    showInstructions()
  }
}
</script>
```

Notas: a `view` inicial é 'home'; o passo-a-passo aparece em iOS (via CTA) ou após prompt Android dispensado (lógica em `promptInstall`). `maybeAutoOpen` roda uma vez por sessão e respeita o age-gate.

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run tests/app/components/installDrawer.spec.ts`
Expected: PASS (5 testes). Id do mock VERIFICADO na Task 3: o exports map do @nuxtjs/device não expõe o subpath direto e o auto-import do Nuxt resolve pelo caminho físico do pnpm store — o id via symlink de node_modules intercepta (validado empiricamente). O teste de auto-abertura abaixo é o canário: se o mock morrer (device `isMobileOrTablet: false`), o drawer não abre e o teste falha ruidosamente.

- [ ] **Step 5: Commit**

```bash
git add app/components/installDrawer.vue tests/app/components/installDrawer.spec.ts
git commit -m "feat: install drawer (bottom sheet, home + iOS steps)"
```

---

### Task 5: Botão de instalar no cabeçalho

**Files:**
- Create: `app/components/installButton.vue`
- Test: `tests/app/components/installButton.spec.ts`

**Interfaces:**
- Consumes: `usePwaInstall()` da Task 3; `platform` da Task 2; `useDevice()`.
- Produces: componente auto-importado `<InstallButton />` (montado no `#right` do header, Task 6). Visível só em mobile/tablet e não-instalado.

- [ ] **Step 1: Escrever o teste que falha**

`tests/app/components/installButton.spec.ts`:

```ts
// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import InstallButton from '~/components/installButton.vue'

function mockDevice(flags) {
  vi.resetModules()
  vi.doMock('../../../node_modules/@nuxtjs/device/dist/runtime/composables/useDevice', () => ({
    useDevice: () => flags,
  }))
}

describe('InstallButton', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('escondido no desktop', async () => {
    mockDevice({ isMobileOrTablet: false, isIos: false })
    const { default: Btn } = await import('~/components/installButton.vue')
    const wrapper = await mountSuspended(Btn)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('visível no mobile com aria-label e tooltip', async () => {
    mockDevice({ isMobileOrTablet: true, isIos: false })
    const { default: Btn } = await import('~/components/installButton.vue')
    const wrapper = await mountSuspended(Btn)
    const btn = wrapper.find('button[aria-label="Instalar app"]')
    expect(btn.exists()).toBe(true)
  })

  it('escondido quando já instalado (standalone)', async () => {
    mockDevice({ isMobileOrTablet: true, isIos: false })
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { default: Btn } = await import('~/components/installButton.vue')
    const wrapper = await mountSuspended(Btn)
    usePwaInstall().state.standalone = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('clique em iOS abre o drawer com as instruções', async () => {
    mockDevice({ isMobileOrTablet: true, isIos: true })
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { default: Btn } = await import('~/components/installButton.vue')
    const wrapper = await mountSuspended(Btn)
    wrapper.find('button[aria-label="Instalar app"]').trigger('click')
    await wrapper.vm.$nextTick()
    const { state } = usePwaInstall()
    expect(state.open).toBe(true)
    expect(state.view).toBe('ios')
  })

  it('clique em Android dispara o prompt nativo', async () => {
    mockDevice({ isMobileOrTablet: true, isIos: false })
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { default: Btn } = await import('~/components/installButton.vue')
    const wrapper = await mountSuspended(Btn)
    const prompt = vi.fn()
    const userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), { prompt, userChoice, preventDefault: () => {} }),
    )
    await Promise.resolve()
    wrapper.find('button[aria-label="Instalar app"]').trigger('click')
    await wrapper.vm.$nextTick()
    await Promise.resolve()
    expect(prompt).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run tests/app/components/installButton.spec.ts`
Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar o componente**

`app/components/installButton.vue`:

```vue
<template>
  <UTooltip v-if="isMobileOrTablet && !state.standalone" text="Instalar app">
    <UButton
      icon="i-lucide-download"
      color="primary"
      square
      size="sm"
      aria-label="Instalar app"
      @click="onClick"
    />
  </UTooltip>
</template>

<script setup>
import { platform } from '~/utils/pwaInstall'

const { state, openDrawer, promptInstall, showInstructions } = usePwaInstall()
const device = useDevice()
const isMobileOrTablet = computed(() => device.isMobileOrTablet)

function onClick() {
  if (platform({ canPrompt: state.canPrompt, isIos: device.isIos }) === 'android') {
    promptInstall()
  } else {
    showInstructions()
    openDrawer()
  }
}
</script>
```

Notas: o ícone teal preenchido vem do `color="primary"` (teal `#2dd4bf` no tema) + `square` — visual aprovado (quadrado teal, ícone download escuro). Tooltip via wrapper `<UTooltip text>` (verificado: UButton v4 NÃO tem tooltip embutido; UTooltip existe em `@nuxt/ui/dist/runtime/components/Tooltip.vue`).

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run tests/app/components/installButton.spec.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add app/components/installButton.vue tests/app/components/installButton.spec.ts
git commit -m "feat: install button in header (mobile only, teal square)"
```

---

### Task 6: Montagem no layout + verificação final

**Files:**
- Modify: `app/layouts/default.vue`

**Interfaces:**
- Consumes: `<InstallButton />` (Task 5) e `<InstallDrawer />` (Task 4).
- Produces: botão no slot `#right` do UHeader (coexistindo com o UNavigationMenu lg→xl num wrapper flex) e drawer montado uma vez no layout.

- [ ] **Step 1: Montar botão e drawer no layout**

No `#right` do `app/layouts/default.vue`, envolver o menu lg→xl e o botão num wrapper flex (preservar o menu!):

```vue
<template #right>
  <div class="flex items-center gap-1.5">
    <UNavigationMenu :items="navItems" class="hidden lg:flex xl:hidden" :ui="navUi" />
    <InstallButton />
  </div>
</template>
```

E montar o drawer uma vez, junto do main (fora do header):

```vue
<UMain class="bg-zinc-950">
  <UContainer class="pt-5 pb-8">
    <NuxtPage />
  </UContainer>
</UMain>
<InstallDrawer />
```

- [ ] **Step 2: Rodar a suite completa**

Run: `pnpm test:unit`
Expected: PASS — 153 testes existentes (contagem real atual do repo: `grep -rc "  it(" tests/app/` = 153) + 23 novos (8 utils + 5 composable + 5 drawer + 5 button) ≈ 176.

- [ ] **Step 3: Verificar no navegador (dev)**

- Subir dev (porta livre; checar porta real antes, ex.: `lsof -nP -iTCP -sTCP:LISTEN` — 3000 é de outro projeto).
- Página inicial mobile (DevTools device mode, ex. 390x844):
  1. Age-gate 18+ abre → confirmar maioridade → ~1,5s depois o drawer de instalação desliza de baixo (visual B).
  2. "Não mostrar novamente" → drawer fecha; recarregar → não reaparece.
  3. Limpar `jonebet:pwa-install-dismissed` → X fecha; recarregar → reaparece.
  4. Botão teal no topo à direita; clique → em iOS mostra o passo-a-passo (visual C).
  5. Desktop (viewport largo): sem botão, sem drawer.
  6. `curl -s localhost:<porta>/manifest.webmanifest` → JSON correto; aba Application → Manifest/Installability no DevTools: "installable".

- [ ] **Step 3b: Verificar artefatos do build de produção (uma vez, resolve ⚠️ da review da Task 1)**

```bash
pnpm build
```

Depois conferir em `.output/public/`:
- `sw.js` existe (gerado pelo workbox generateSW com o precache).
- `manifest.webmanifest` existe com name "Dataplay Bets" e icons 192/512.
- `index.html` contém o script de registro do SW e o `<link rel="manifest">`.
Nota: `pnpm build` é exceção única à convenção do repo (não rodar build) — é a verificação final de produção pedida pela review.

- [ ] **Step 4: Commit**

```bash
git add app/layouts/default.vue
git commit -m "feat: wire install button + drawer into layout"
```

---

## Self-Review (executado antes do handoff)

**Cobertura da spec:** escopo A ✓ (sem offline/push — nada cacheado no SW); manifest + NuxtPwaManifest ✓ (T1); ícones 192/512/maskable/180 ✓ (T1); meta-tags iOS ✓ (T1); botão mobile-only teal ✓ (T5/T6); drawer visual B + visual C iOS ✓ (T4); age-gate sequencing ✓ (T3 `maybeAutoOpen` + T4 teste); X sem persistir vs "não mostrar" persistente ✓ (T4); prompt one-shot → instruções ✓ (T3); appinstalled/matchMedia reavaliação ✓ (T3); storage namespaced + try/catch ✓ (T2); testes de utils/composable/componentes ✓ (T2-T5); verificação DevTools installability (não Lighthouse) ✓ (T6).

**Placeholders:** nenhum — todo passo tem código/commando concretos.

**Consistência de tipos:** `state.view` ('home'|'ios'), `platform({canPrompt,isIos})`, `shouldShowDrawer({isMobileOrTablet,standalone,dismissed,ageGateDismissed})`, `usePwaInstall()` → `{state, openDrawer, closeDrawer, promptInstall, showInstructions, confirmDismiss, maybeAutoOpen}` — idênticos em T2→T6.
