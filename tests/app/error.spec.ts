// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ErrorPage from '~/error.vue'

// `clearError` é auto-import do Nuxt: sem `redirect` ele reprocessa a rota que
// falhou; com `redirect: '/'` ele navega para a home.
const h = vi.hoisted(() => ({ clearError: vi.fn() }))
mockNuxtImport('clearError', () => h.clearError)

const ERROR = { statusCode: 500, message: 'boom' }

const STUBS = {
  // Sem emits: o @click do pai cai por fallthrough no <button> nativo, uma vez só.
  UCard: { template: '<div><slot name="header" /><slot /><slot name="footer" /></div>' },
  UButton: { template: '<button><slot /></button>' },
  UIcon: true,
}
beforeEach(() => {
  h.clearError.mockReset()
})

describe('error.vue', () => {
  it('"Tentar novamente" reprocessa a rota que falhou, sem navegar para a home', async () => {
    const wrapper = await mountSuspended(ErrorPage, { props: { error: ERROR }, global: { stubs: STUBS } })

    const retry = wrapper.findAll('button').find((b) => b.text().includes('Tentar novamente'))
    expect(retry).toBeDefined()
    await retry.trigger('click')

    expect(h.clearError).toHaveBeenCalledTimes(1)
    expect(h.clearError.mock.calls[0][0]?.redirect).toBeUndefined()
    wrapper.unmount()
  })

  it('"Voltar ao início" continua redirecionando para /', async () => {
    const wrapper = await mountSuspended(ErrorPage, { props: { error: ERROR }, global: { stubs: STUBS } })

    const home = wrapper.findAll('button').find((b) => b.text().includes('Voltar ao início'))
    await home.trigger('click')

    expect(h.clearError).toHaveBeenCalledWith({ redirect: '/' })
    wrapper.unmount()
  })
})
