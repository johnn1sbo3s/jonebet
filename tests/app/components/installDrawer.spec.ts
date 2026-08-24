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
    const dismiss = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Não mostrar novamente'),
    )
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

  it('fechar por backdrop/Esc (update:open false) reseta a view para home', async () => {
    const { default: InstallDrawer } = await import('~/components/installDrawer.vue')
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const wrapper = await mountSuspended(InstallDrawer)
    usePwaInstall().openDrawer()
    await wrapper.vm.$nextTick()
    // vai para as instruções iOS (visual C)
    const cta = [...document.body.querySelectorAll('button')].find((b) => b.textContent?.includes('Instalar agora'))
    expect(cta).toBeTruthy()
    cta.click()
    await wrapper.vm.$nextTick()
    expect(usePwaInstall().state.view).toBe('ios')
    // fechamento por backdrop/Esc: o USlideover emite update:open(false) no v-model
    const slideover = wrapper.findComponent({ name: 'USlideover' })
    expect(slideover.exists()).toBe(true)
    slideover.vm.$emit('update:open', false)
    await wrapper.vm.$nextTick()
    expect(usePwaInstall().state.open).toBe(false)
    expect(usePwaInstall().state.view).toBe('home')
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
    wrapper.unmount() // render pendente com fake timers derruba o happy-dom (insertBefore null)
    vi.useRealTimers()
  })
})
