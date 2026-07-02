import glossarioRaw from '~/data/academia/glossario.json'

const CATEGORIES = ['Conceito', 'Estratégia', 'Modelo']

const REQUIRED_FIELDS = ['name', 'category', 'short', 'long', 'example']

const FIELD_LIMITS = {
  name: { min: 1, max: 40 },
  short: { min: 10, max: 200 },
  long: { min: 30, max: 1500 },
  example: { min: 10, max: 500 },
}

function validateTerm(term) {
  const errors = []

  for (const field of REQUIRED_FIELDS) {
    if (!(field in term) || term[field] === undefined || term[field] === null) {
      errors.push(`campo obrigatório ausente: ${field}`)
    }
  }

  if (errors.length) return errors

  if (typeof term.name !== 'string') errors.push('name deve ser string')
  if (typeof term.category !== 'string' || !CATEGORIES.includes(term.category)) {
    errors.push(`category inválida: ${term.category} (esperado: ${CATEGORIES.join(', ')})`)
  }

  for (const [field, { min, max }] of Object.entries(FIELD_LIMITS)) {
    const val = term[field]
    if (typeof val === 'string') {
      if (val.length < min) errors.push(`${field} muito curto (${val.length} < ${min})`)
      if (val.length > max) errors.push(`${field} muito longo (${val.length} > ${max})`)
    }
  }

  return errors
}

function loadAndValidate() {
  let raw
  try {
    raw = typeof glossarioRaw === 'string' ? JSON.parse(glossarioRaw) : glossarioRaw
  } catch (e) {
    console.error(`Academia: glossario.json inválido: ${e.message}`)
    return []
  }

  if (!Array.isArray(raw)) {
    console.error('Academia: glossario.json deve ser um array')
    return []
  }

  const validTerms = []
  const seenNames = new Set()

  for (let i = 0; i < raw.length; i++) {
    const term = raw[i]
    const errors = validateTerm(term)

    if (errors.length) {
      const label = term?.name || `índice ${i}`
      console.error(`Academia: termo '${label}' inválido: ${errors.join('; ')}`)
      continue
    }

    if (seenNames.has(term.name)) {
      console.error(`Academia: nome duplicado '${term.name}'`)
      continue
    }

    seenNames.add(term.name)
    validTerms.push(term)
  }

  return validTerms
}

const terms = loadAndValidate()

const byCategory = _groupBy(terms, 'category')

function search(query) {
  if (!query || !query.trim()) return terms
  const q = query.toLowerCase().trim()
  return terms.filter(
    (t) => t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q) || t.long.toLowerCase().includes(q),
  )
}

export function useAcademiaGlossario() {
  return { terms, byCategory, search }
}
