// @vitest-environment nuxt
import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DatePicker from '~/components/DatePicker.vue'

const UPopoverStub = defineComponent({
  name: 'UPopover',
  props: { open: Boolean },
  emits: ['update:open'],
  setup(_props, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const stubs = { UPopover: UPopoverStub, UCalendar: true, UIcon: true }

describe('DatePicker', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('emite a data apenas depois do debounce', async () => {
    const wrapper = await mountSuspended(DatePicker, { props: { modelValue: '2026-10-03' }, global: { stubs } })
    vi.useFakeTimers()

    await wrapper.find('[aria-label="Data anterior"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(700)
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-10-02']])
  })

  it('descarta o debounce anterior quando as setas são clicadas de novo', async () => {
    const wrapper = await mountSuspended(DatePicker, { props: { modelValue: '2026-10-03' }, global: { stubs } })
    vi.useFakeTimers()

    await wrapper.find('[aria-label="Data anterior"]').trigger('click')
    await vi.advanceTimersByTimeAsync(300)
    await wrapper.find('[aria-label="Data anterior"]').trigger('click')
    expect(vi.getTimerCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(699)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-10-01']])
  })

  it('cancela o debounce pendente quando o componente é desmontado', async () => {
    const wrapper = await mountSuspended(DatePicker, { props: { modelValue: '2026-10-03' }, global: { stubs } })
    vi.useFakeTimers()

    await wrapper.find('[aria-label="Data anterior"]').trigger('click')
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)

    await vi.advanceTimersByTimeAsync(700)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
