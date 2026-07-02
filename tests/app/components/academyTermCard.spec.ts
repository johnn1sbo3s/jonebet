// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AcademyTermCard from '~/components/academyTermCard.vue'

const baseTerm = {
  name: 'odd',
  category: 'Conceito',
  short: 'O número que a casa de aposta dá pra um resultado.',
  long: 'A odd diz quanto você recebe se acertar a aposta. Exemplo: odd de 2.0 quer dizer que pra cada R$1 que você colocar, recebe R$2 de volta.',
  example: 'Odd 1.50 pro favorito = vitória esperada, lucro pequeno.',
}

describe('AcademyTermCard', () => {
  it('renders name and short on the collapsed face', async () => {
    const wrapper = await mountSuspended(AcademyTermCard, { props: { term: baseTerm } })
    const text = wrapper.text()
    expect(text).toContain('odd')
    expect(text).toContain(baseTerm.short)
  })

  it('hides long and example when collapsed', async () => {
    const wrapper = await mountSuspended(AcademyTermCard, { props: { term: baseTerm } })
    const text = wrapper.text()
    expect(text).not.toContain(baseTerm.long)
    expect(text).not.toContain(baseTerm.example)
  })

  it('expands on click to show long and example', async () => {
    const wrapper = await mountSuspended(AcademyTermCard, { props: { term: baseTerm } })
    await wrapper.trigger('click')
    await wrapper.vm.$nextTick()
    const text = wrapper.text()
    expect(text).toContain(baseTerm.long)
    expect(text).toContain(baseTerm.example)
  })

  it('collapses on second click', async () => {
    const wrapper = await mountSuspended(AcademyTermCard, { props: { term: baseTerm } })
    await wrapper.trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.trigger('click')
    await wrapper.vm.$nextTick()
    const text = wrapper.text()
    expect(text).not.toContain(baseTerm.long)
    expect(text).not.toContain(baseTerm.example)
  })

  it('renders teal-500 left border for Conceito category', async () => {
    const wrapper = await mountSuspended(AcademyTermCard, { props: { term: baseTerm } })
    const el = wrapper.element as HTMLElement
    expect(el.className).toContain('border-l-teal-500')
  })

  it('renders violet-500 left border for Estratégia category', async () => {
    const term = { ...baseTerm, name: 'back', category: 'Estratégia' }
    const wrapper = await mountSuspended(AcademyTermCard, { props: { term } })
    const el = wrapper.element as HTMLElement
    expect(el.className).toContain('border-l-violet-500')
  })

  it('renders amber-500 left border for Modelo category', async () => {
    const term = { ...baseTerm, name: 'LTD', category: 'Modelo' }
    const wrapper = await mountSuspended(AcademyTermCard, { props: { term } })
    const el = wrapper.element as HTMLElement
    expect(el.className).toContain('border-l-amber-500')
  })

  it('renders the category badge text', async () => {
    const wrapper = await mountSuspended(AcademyTermCard, { props: { term: baseTerm } })
    expect(wrapper.text()).toContain('Conceito')
  })
})
