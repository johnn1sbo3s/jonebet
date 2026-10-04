import { describe, it, expect } from 'vitest'
import { flashscoreUrl, safeExternalUrl } from '~/utils/flashscore.js'

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

// URLs externas vindas de payload (snapshot do scanner): só http/https viram
// href clicável — javascript:/data:/vbscript: executariam no contexto do app.
describe('safeExternalUrl', () => {
  it('aceita https e devolve a URL intacta', () => {
    expect(safeExternalUrl('https://www.flashscore.com.br/jogo/abc123/')).toBe(
      'https://www.flashscore.com.br/jogo/abc123/',
    )
  })

  it('aceita http', () => {
    expect(safeExternalUrl('http://www.flashscore.com.br/jogo/abc123/')).toBe(
      'http://www.flashscore.com.br/jogo/abc123/',
    )
  })

  it.each([
    ['javascript', 'javascript:alert(1)'],
    ['javascript maiúsculo', 'JaVaScRiPt:alert(1)'],
    ['javascript com espaço', ' javascript:alert(1)'],
    ['data html', 'data:text/html,<script>alert(1)</script>'],
    ['vbscript', 'vbscript:msgbox(1)'],
    ['file', 'file:///etc/passwd'],
    ['protocol-relative', '//evil.example/x'],
    ['relativa', '/jogo/outro'],
    ['sem esquema', 'www.flashscore.com.br/jogo/abc123/'],
    ['malformada', 'https://'],
    ['vazia', '   '],
  ])('rejeita URL %s', (_label, value) => {
    expect(safeExternalUrl(value)).toBeNull()
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['número', 123],
    ['objeto', {}],
  ])('rejeita %s', (_label, value) => {
    expect(safeExternalUrl(value)).toBeNull()
  })
})
