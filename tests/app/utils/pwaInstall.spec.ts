// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import {
  INSTALL_DISMISS_KEY,
  AGE_GATE_KEY,
  isAgeGateDismissed,
  wasDismissed,
  dismissInstall,
  shouldShowDrawer,
  platform,
} from '~/utils/pwaInstall'

describe('pwaInstall utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('wasDismissed: false sem flag, true com flag gravada', () => {
    expect(wasDismissed()).toBe(false)
    localStorage.setItem(INSTALL_DISMISS_KEY, '1')
    expect(wasDismissed()).toBe(true)
  })

  it('dismissInstall grava a flag', () => {
    dismissInstall()
    expect(localStorage.getItem(INSTALL_DISMISS_KEY)).toBe('1')
  })

  it('wasDismissed não quebra com storage indisponível', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
    }
    expect(wasDismissed(broken)).toBe(false)
  })

  it('dismissInstall não quebra com storage indisponível', () => {
    const broken = {
      setItem: () => {
        throw new Error('denied')
      },
    }
    expect(() => dismissInstall(broken)).not.toThrow()
  })

  it('isAgeGateDismissed: só true com flag "1"', () => {
    expect(isAgeGateDismissed()).toBe(false)
    localStorage.setItem(AGE_GATE_KEY, '1')
    expect(isAgeGateDismissed()).toBe(true)
    localStorage.setItem(AGE_GATE_KEY, '0')
    expect(isAgeGateDismissed()).toBe(false)
  })

  it('isAgeGateDismissed não quebra com storage indisponível (trata como dispensado)', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
    }
    expect(isAgeGateDismissed(broken)).toBe(true)
  })

  it('shouldShowDrawer: exige mobile + não instalado + não dispensado + age-gate ok', () => {
    const base = { isMobileOrTablet: true, standalone: false, dismissed: false, ageGateDismissed: true }
    expect(shouldShowDrawer(base)).toBe(true)
    expect(shouldShowDrawer({ ...base, isMobileOrTablet: false })).toBe(false)
    expect(shouldShowDrawer({ ...base, standalone: true })).toBe(false)
    expect(shouldShowDrawer({ ...base, dismissed: true })).toBe(false)
    expect(shouldShowDrawer({ ...base, ageGateDismissed: false })).toBe(false)
  })

  it('platform: canPrompt → android; senão ios', () => {
    expect(platform({ canPrompt: true, isIos: false })).toBe('android')
    expect(platform({ canPrompt: false, isIos: true })).toBe('ios')
    expect(platform({ canPrompt: false, isIos: false })).toBe('ios')
  })
})
