import { describe, it, expect } from 'vitest'
import { TRADING_MODEL_BADGE, TRADING_MODEL_RESULT, tradingModelLabel } from '~/utils/enums'

describe('TRADING_MODEL_BADGE', () => {
  it('is keyed by full API model names', () => {
    expect(Object.keys(TRADING_MODEL_BADGE).sort()).toEqual([
      'lay_0x1_crash',
      'lay_0x1_donkey',
      'lay_0x1_luigi',
      'lay_0x1_pacman',
      'lay_0x1_scorpion',
    ])
  })

  it('donkey is blue', () => {
    expect(TRADING_MODEL_BADGE.lay_0x1_donkey).toContain('blue')
  })

  it('scorpion is amber', () => {
    expect(TRADING_MODEL_BADGE.lay_0x1_scorpion).toContain('amber')
  })
})

describe('TRADING_MODEL_RESULT', () => {
  it('maps PENDING to a zinc color', () => {
    expect(TRADING_MODEL_RESULT.PENDING).toContain('zinc')
  })
})

describe('tradingModelLabel', () => {
  it('capitalizes the lay_0x1_ suffix', () => {
    expect(tradingModelLabel('lay_0x1_scorpion', '0x1')).toBe('Scorpion')
  })

  it('falls back to model_label for unknown names', () => {
    expect(tradingModelLabel('back_home', 'Casa')).toBe('Casa')
  })

  it('returns the raw model when no fallback', () => {
    expect(tradingModelLabel('weird')).toBe('weird')
  })
})
