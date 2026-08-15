// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SegmentedControl from '~/components/SegmentedControl.vue'

const options = [
  { value: 'by_league', label: 'Por liga' },
  { value: 'by_hour', label: 'Por horário' },
]

describe('SegmentedControl', () => {
  it('marca a opção ativa', async () => {
    const wrapper = await mountSuspended(SegmentedControl, {
      props: { modelValue: 'by_league', options },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].classes()).toContain('bg-teal-500')
    expect(buttons[1].classes()).not.toContain('bg-teal-500')
  })

  it('aplica largura total quando fullWidth é true', async () => {
    const wrapper = await mountSuspended(SegmentedControl, {
      props: { modelValue: 'by_league', options, fullWidth: true },
    })
    expect(wrapper.find('div').classes()).toContain('w-full')
    expect(wrapper.find('div').classes()).toContain('md:w-auto')
    expect(wrapper.findAll('button')[0].classes()).toContain('flex-1')
    expect(wrapper.findAll('button')[0].classes()).toContain('md:flex-none')
  })

  it('não aplica largura total por padrão', async () => {
    const wrapper = await mountSuspended(SegmentedControl, {
      props: { modelValue: 'by_league', options },
    })
    expect(wrapper.find('div').classes()).not.toContain('w-full')
    expect(wrapper.findAll('button')[0].classes()).not.toContain('flex-1')
  })

  it('usa classes de tamanho responsivas e altura fixa (h-8)', async () => {
    const wrapper = await mountSuspended(SegmentedControl, {
      props: { modelValue: 'by_league', options },
    })
    const button = wrapper.findAll('button')[0]
    expect(button.classes()).toContain('text-xs')
    expect(button.classes()).toContain('md:text-sm')
    expect(button.classes()).toContain('px-1.5')
    expect(button.classes()).toContain('md:px-3')
    expect(button.classes()).toContain('whitespace-nowrap')
    expect(wrapper.find('div').classes()).toContain('h-8')
  })

  it('aplica title do option no botão', async () => {
    const withTitle = [{ value: 'favoritos', label: 'Favoritos', title: 'favorito claro' }]
    const wrapper = await mountSuspended(SegmentedControl, {
      props: { modelValue: 'favoritos', options: withTitle },
    })
    expect(wrapper.find('button').attributes('title')).toBe('favorito claro')
  })

  it('sem title no option, botão não tem atributo title', async () => {
    const wrapper = await mountSuspended(SegmentedControl, {
      props: { modelValue: 'by_league', options },
    })
    expect(wrapper.find('button').attributes('title')).toBeUndefined()
  })
})
