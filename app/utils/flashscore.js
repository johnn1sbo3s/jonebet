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
