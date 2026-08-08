import { z } from 'zod'

// Runtime contract for the DataPlay Bets API. The backend is a separate
// Python service (api.jonebet.xyz). The schemas here are SAFETY NETS, not
// strict validators: each `safeParse` call guarantees the response is an
// object (or array, where appropriate) and applies the documented fallback
// when it is not. Nested field shapes are NOT validated — the backend has
// used several naming conventions over the project lifetime and the
// frontend has always consumed the response as-is via `passthrough`. If
// the backend renames a top-level key, the consumer's `data?.x` check
// will return undefined and the page renders its empty/error state — no
// silent NaN, no false-positive "valid" data.

// Permissive "any object" schema with a default. Accepts any object shape,
// returns the default if the input is not an object, preserves all original
// fields via `passthrough`.
const FlexObject = z.object({}).passthrough()

// Permissive "any array" schema with a default.
const FlexArray = z.array(z.unknown())

/**
 * @typedef {Object} EndpointSchema
 * @property {z.ZodTypeAny} schema   zod schema to validate against
 * @property {unknown} fallback      value to return on validation failure
 *                                    — must match the consumer's expected default shape
 */

/** @type {Record<string, EndpointSchema>} */
export const endpointSchemas = {
  modelsList: {
    schema: FlexObject.default({ items: [] }),
    fallback: { items: [] },
  },
  modelById: {
    schema: z.unknown().nullable(),
    fallback: null,
  },
  modelChart: {
    schema: FlexObject.default({ labels: [], data: [], annotationIndex: 0 }),
    fallback: { labels: [], data: [], annotationIndex: 0 },
  },
  modelTrend: {
    schema: FlexObject.default({ slope: 0, intercept: 0, line: [], distance: 0 }),
    fallback: { slope: 0, intercept: 0, line: [], distance: 0 },
  },
  modelResults: {
    schema: FlexArray.default([]),
    fallback: [],
  },
  modelBets: {
    schema: FlexObject.default({ items: [], total: 0, page: 1, size: 25 }),
    fallback: { items: [], total: 0, page: 1, size: 25 },
  },
  dailyBets: {
    schema: FlexObject.default({ date: null, bets: [], total: 0 }),
    fallback: { date: null, bets: [], total: 0 },
  },
  dailyBetsDates: {
    schema: FlexArray.default([]),
    fallback: [],
  },
  dashboard: {
    schema: FlexObject.default({ bankrollEvolution: [] }),
    fallback: { bankrollEvolution: [] },
  },
  dailyResults: {
    schema: FlexObject.default({ results: [], topModels: [], metrics: {}, positiveModels: 0 }),
    fallback: { results: [], topModels: [], metrics: {}, positiveModels: 0 },
  },
  fixturesDaily: {
    schema: FlexObject.default({ date: null, fixtures: [], bets: [] }),
    fallback: { date: null, fixtures: [], bets: [] },
  },
  scannerSnapshot: {
    schema: FlexObject.default({ generated_at: null, games: [] }),
    fallback: { generated_at: null, games: [] },
  },
}

/**
 * Parse `data` against `entry.schema`. On failure, log ONE warn line and
 * return `entry.fallback`. Never throws.
 * @param {string} endpoint  key from `endpointSchemas`
 * @param {unknown} data
 */
export function safeParse(endpoint, data) {
  const entry = endpointSchemas[endpoint]
  if (!entry) return data
  const result = entry.schema.safeParse(data)
  if (result.success) return result.data
  console.warn(`[useModelApi] ${endpoint}: schema mismatch — ${result.error.issues[0]?.message || 'invalid shape'}`)
  return entry.fallback
}
