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

// UTooltip real exige o TooltipProvider que só o UApp provê (app.vue) — o
// mountSuspended não inclui UApp na árvore, então o setup do UTooltip lança
// "Injection TooltipProviderContext not found". Stub pass-through (padrão do
// repo): renderiza o slot (o UButton real), que é o que os testes verificam.
const UTooltipStub = {
  name: 'UTooltip',
  props: ['text'],
  template: '<span><slot /></span>',
}

function mountBtn(Btn) {
  return mountSuspended(Btn, { global: { stubs: { UTooltip: UTooltipStub } } })
}

describe('InstallButton', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('escondido no desktop', async () => {
    mockDevice({ isMobileOrTablet: false, isIos: false })
    const { default: Btn } = await import('~/components/installButton.vue')
    const wrapper = await mountBtn(Btn)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('visível no mobile com aria-label e tooltip', async () => {
    mockDevice({ isMobileOrTablet: true, isIos: false })
    const { default: Btn } = await import('~/components/installButton.vue')
    const wrapper = await mountBtn(Btn)
    const btn = wrapper.find('button[aria-label="Instalar app"]')
    expect(btn.exists()).toBe(true)
  })

  it('escondido quando já instalado (standalone)', async () => {
    mockDevice({ isMobileOrTablet: true, isIos: false })
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { default: Btn } = await import('~/components/installButton.vue')
    const wrapper = await mountBtn(Btn)
    usePwaInstall().state.standalone = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('clique em iOS abre o drawer com as instruções', async () => {
    mockDevice({ isMobileOrTablet: true, isIos: true })
    const { usePwaInstall } = await import('~/composables/usePwaInstall')
    const { default: Btn } = await import('~/components/installButton.vue')
    const wrapper = await mountBtn(Btn)
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
    const wrapper = await mountBtn(Btn)
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
