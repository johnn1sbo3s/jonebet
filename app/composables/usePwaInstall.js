// Instalação PWA (mobile only) — estado compartilhado entre o botão do header
// e o drawer. Singleton por módulo (padrão useFavorites): os dois componentes
// chamam o composable, mas listeners/stado existem uma vez.
import { reactive } from 'vue'
import { isStandalone, wasDismissed, dismissInstall, isAgeGateDismissed, shouldShowDrawer } from '~/utils/pwaInstall'

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
    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome !== 'accepted') {
        showInstructions()
        openDrawer() // dismiss do prompt nativo → drawer aberto na 1ª interação
      }
      // accepted → appinstalled fecha/limpa
    } catch {
      // Chrome rejeita prompt() quando o prompt já foi usado/não é permitido —
      // vira fallback de instruções, sem propagar para o caller.
      showInstructions()
      openDrawer() // rejeição → drawer aberto na 1ª interação (CTA não fica morto)
    } finally {
      // One-shot garantido em TODOS os caminhos (sucesso, dismiss, rejeição).
      deferredPrompt = null
      state.canPrompt = false
    }
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
        if (
          shouldShowDrawer({
            isMobileOrTablet: device.isMobileOrTablet,
            standalone: state.standalone,
            dismissed: wasDismissed(),
            ageGateDismissed: true,
          })
        ) {
          state.open = true
        }
      }, 1500)
    }, 500)
  }

  return { state, openDrawer, closeDrawer, promptInstall, showInstructions, confirmDismiss, maybeAutoOpen }
}
