const FLASHSCORE_MATCH_BASE = 'https://www.flashscore.com.br/jogo/'

// Flashscore ids are alphanumeric (digits, letters, `-`, `_`). Anything else —
// separators, dots, query/fragment chars, encoded payloads — would let an API
// value rewrite the path on flashscore.com.br, so those ids get no URL at all.
const FIXTURE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

export function flashscoreUrl(fixtureId) {
  if (typeof fixtureId !== 'string' && typeof fixtureId !== 'number') return null

  const id = String(fixtureId)

  if (!FIXTURE_ID_PATTERN.test(id)) return null

  return `${FLASHSCORE_MATCH_BASE}${id}/`
}

// URLs externas vindas de payload (snapshot do scanner, API) só viram href
// clicável com esquema http/https — javascript:/data:/vbscript: executam no
// contexto do app no clique. Scheme-relative ("//host"), relativas e strings
// malformadas caem no mesmo caminho: null (nenhum link).
export function safeExternalUrl(url) {
  if (typeof url !== 'string') return null

  const raw = url.trim()
  if (!raw) return null

  let parsed
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }

  return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? raw : null
}
