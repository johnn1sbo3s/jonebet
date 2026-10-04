import { describe, it, expect } from 'vitest'
import { flashscoreUrl } from '~/utils/flashscore.js'

describe('flashscoreUrl', () => {
  it('builds the flashscore game URL for a numeric id', () => {
    expect(flashscoreUrl('1234567')).toBe('https://www.flashscore.com.br/jogo/1234567/')
  })

  it('accepts a numeric id sent as a JSON number', () => {
    expect(flashscoreUrl(1234567)).toBe('https://www.flashscore.com.br/jogo/1234567/')
  })

  it('accepts the alphanumeric ids the API actually sends', () => {
    expect(flashscoreUrl('abc123')).toBe('https://www.flashscore.com.br/jogo/abc123/')
    expect(flashscoreUrl('g_1_A0bC9x')).toBe('https://www.flashscore.com.br/jogo/g_1_A0bC9x/')
  })

  it.each([
    ['path traversal', '../../../admin'],
    ['absolute path', '/jogo/outro'],
    ['query injection', '123?x=1'],
    ['fragment injection', '123#anchor'],
    ['dot id', '123.456'],
    ['whitespace', ' 123'],
    ['percent encoding', '123%2F456'],
    ['backslash', '123\\456'],
    ['empty', ''],
    ['null', null],
    ['undefined', undefined],
    ['object', {}],
  ])('returns null instead of interpolating a %s id', (_label, value) => {
    expect(flashscoreUrl(value)).toBeNull()
  })

  it('rejects ids long enough to be a payload dump', () => {
    expect(flashscoreUrl('a'.repeat(65))).toBeNull()
  })
})
