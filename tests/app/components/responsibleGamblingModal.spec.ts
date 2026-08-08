// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ResponsibleGamblingModal from '~/components/responsibleGamblingModal.vue'

const STORAGE_KEY = 'jonebet:gambling-alert-dismissed'

describe('ResponsibleGamblingModal', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('abre na primeira visita (sem flag no localStorage)', async () => {
    const wrapper = await mountSuspended(ResponsibleGamblingModal)
    await wrapper.vm.$nextTick()
    // UModal/UDrawer portalam para document.body, então query direto no documento
    expect(document.body.textContent).toContain('destinado apenas a maiores de 18 anos')
    expect(document.body.textContent).toContain('O Ministério da Fazenda adverte: aposta não é investimento.')
  })

  it('não abre quando a flag de dismiss já existe', async () => {
    localStorage.setItem(STORAGE_KEY, '1')
    const wrapper = await mountSuspended(ResponsibleGamblingModal)
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).not.toContain('destinado apenas a maiores de 18 anos')
  })

  it('grava a flag e fecha ao confirmar maioridade', async () => {
    const wrapper = await mountSuspended(ResponsibleGamblingModal)
    await wrapper.vm.$nextTick()
    const confirmButton = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Entendo e sou maior de 18 anos'),
    )
    expect(confirmButton).toBeTruthy()
    confirmButton.click()
    await wrapper.vm.$nextTick()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1')

    // remonta simulando nova visita: com a flag gravada, não abre
    wrapper.unmount()
    document.body.innerHTML = ''
    const remounted = await mountSuspended(ResponsibleGamblingModal)
    await remounted.vm.$nextTick()
    expect(document.body.textContent).not.toContain('destinado apenas a maiores de 18 anos')
  })

  it('mostra o aviso de menor de idade e o Voltar retorna ao fluxo inicial', async () => {
    const wrapper = await mountSuspended(ResponsibleGamblingModal)
    await wrapper.vm.$nextTick()
    const underageButton = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Não tenho 18 anos'),
    )
    expect(underageButton).toBeTruthy()
    underageButton.click()
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).toContain('muito novo para este tipo de conteúdo')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    const backButton = [...document.body.querySelectorAll('button')].find((b) => b.textContent?.includes('Voltar'))
    expect(backButton).toBeTruthy()
    backButton.click()
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).toContain('Entendo e sou maior de 18 anos')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
