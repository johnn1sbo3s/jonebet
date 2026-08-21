// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BackToTop from '~/components/backToTop.vue'

describe('backToTop', () => {
  it('renders hidden initially and reveals after scrolling past one viewport', async () => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    const wrapper = await mountSuspended(BackToTop)

    expect(wrapper.find('button').attributes('aria-label')).toBe('Voltar ao topo')
    expect(wrapper.find('button').classes().join(' ')).toContain('opacity-0')

    Object.defineProperty(window, 'scrollY', { value: window.innerHeight + 10, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(wrapper.find('button').classes().join(' ')).not.toContain('opacity-0')
  })

  it('scrolls to top on click', async () => {
    const scrollTo = vi.fn()
    Object.defineProperty(window, 'scrollTo', { value: scrollTo, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: window.innerHeight + 10, configurable: true })

    const wrapper = await mountSuspended(BackToTop)
    await wrapper.find('button').trigger('click')

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
