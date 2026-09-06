import { z } from 'zod'

const FlexObject = z.object({}).passthrough()
const FlexArray = z.array(z.unknown())

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
  scannerXgHistory: {
    schema: z.object({ game_id: z.unknown().nullable(), series: FlexArray.default([]) }).passthrough(),
    fallback: { game_id: null, series: [] },
  },
  tradingDaily: {
    schema: FlexObject.default({ date: null, daily: [] }),
    fallback: { date: null, daily: [] },
  },
  tradingSummary: {
    schema: FlexObject.default({ week: null, month: null }),
    fallback: { week: null, month: null },
  },
}

export function safeParse(endpoint, data) {
  const entry = endpointSchemas[endpoint]
  if (!entry) return data
  const result = entry.schema.safeParse(data)
  if (result.success) return result.data
  console.warn(`[useModelApi] ${endpoint}: schema mismatch`)
  return entry.fallback
}
