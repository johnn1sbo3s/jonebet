import { describe, it, expect } from 'vitest'
import { TRADING_MODEL_BADGE, TRADING_MODEL_RESULT } from '~/utils/enums'

describe('TRADING_MODEL_BADGE', () => {
  it('has all 5 models', () => {
    expect(Object.keys(TRADING_MODEL_BADGE).sort()).toEqual(['crash', 'donkey', 'luigi', 'pacman', 'scorpion'])
  })

  it('donkey is blue', () => {
    expect(TRADING_MODEL_BADGE.donkey).toContain('blue')
  })

  it('scorpion is amber', () => {
    expect(TRADING_MODEL_BADGE.scorpion).toContain('amber')
  })
})

describe('TRADING_MODEL_RESULT', () => {
  it('maps GREEN to green color', () => {
    expect(TRADING_MODEL_RESULT.GREEN).toContain('green')
  })

  it('maps RED_LIGHT to amber color', () => {
    expect(TRADING_MODEL_RESULT.RED_LIGHT).toContain('amber')
  })

  it('maps RED to red color', () => {
    expect(TRADING_MODEL_RESULT.RED).toContain('red')
  })
})
