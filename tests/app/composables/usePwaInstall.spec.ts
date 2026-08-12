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

  it('promptInstall: rejeição do prompt nativo não quebra o one-shot', async () => {
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { state, promptInstall } = usePwaInstall()
    const prompt = vi.fn().mockRejectedValue(new Error('boom'))
    const userChoice = Promise.resolve({ outcome: 'dismissed' })
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), { prompt, userChoice, preventDefault: () => {} }),
    )
    await Promise.resolve()
    expect(state.canPrompt).toBe(true)
    // (a) a rejeição NÃO propaga para o caller
    await expect(promptInstall()).resolves.toBeUndefined()
    // (b) one-shot zerado mesmo no caminho de erro
    expect(state.canPrompt).toBe(false)
    // (c) segunda chamada não re-invoca o prompt e cai no fallback de instruções
    await promptInstall()
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(state.view).toBe('ios')
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
