// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

describe('Performance Page (UTabs)', () => {
  it('renders UTabs with Punter and Trader tabs', async () => {
    const wrapper = await mountSuspended((await import('~/pages/performance/index.vue')).default)
    expect(wrapper.text()).toContain('Modelos Punter')
    expect(wrapper.text()).toContain('Modelos Trader')
  })
})
