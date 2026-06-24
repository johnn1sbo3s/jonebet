import { z } from 'zod'

// Runtime contract for the DataPlay Bets API. The backend is a separate
// Python service (api.jonebet.xyz). When it renames a field, parsing fails
// here and we log one line + return the default. No silent NaN in P/L.

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected yyyy-MM-dd')

const TopModel = z.object({
  Method: z.string(),
  MethodKey: z.string().optional(),
  profit: z.number().optional(),
  roi: z.number().optional(),
}).passthrough()

const Metrics = z.object({
  profit: z.number().optional(),
  invested: z.number().optional(),
  roi: z.number().optional(),
  bets: z.number().optional(),
  models: z.number().optional(),
}).passthrough()

const DailyResult = z.object({
  date: IsoDate,
  gain: z.number().optional(),
  gameCount: z.number().optional(),
  accumulated: z.number().optional(),
}).passthrough()

const ModelsListItem = z.object({
  name: z.string(),
  playedOn: IsoDate.nullable().optional(),
}).passthrough()

const ChartPayload = z.object({
  labels: z.array(z.string()).default([]),
  data: z.array(z.number()).default([]),
  annotationIndex: z.number().default(0),
}).passthrough()

const TrendPayload = z.object({
  slope: z.number().default(0),
  intercept: z.number().default(0),
  line: z.array(z.number()).default([]),
  distance: z.number().default(0),
}).passthrough()

const ResultRow = z.object({
  date: IsoDate.optional(),
  month: z.string().optional(),
  period: z.string().optional(),
  profit: z.number().optional(),
  roi: z.number().optional(),
  gameCount: z.number().optional(),
}).passthrough()

const BetRow = z.object({
  _id: z.string().optional(),
  Date: z.string().optional(),
  Time: z.string().optional(),
  Home: z.string().optional(),
  Away: z.string().optional(),
  result: z.string().optional(),
  gain: z.number().optional(),
}).passthrough()

const PagedBets = z.object({
  items: z.array(BetRow).default([]),
  total: z.number().default(0),
  page: z.number(),
  size: z.number(),
}).passthrough()

const DailyBetsResponse = z.object({
  date: IsoDate.nullable(),
  bets: z.array(BetRow).default([]),
  total: z.number().default(0),
}).passthrough()

const BankrollPoint = z.object({
  month: z.string(),
  bankroll: z.number().optional(),
  profit: z.number().optional(),
}).passthrough()

const DashboardPayload = z.object({
  bankrollEvolution: z.array(BankrollPoint).default([]),
  yesterday: z.object({
    date: IsoDate.optional(),
    results: z.array(DailyResult).default([]),
    topModels: z.array(TopModel).default([]),
    metrics: Metrics.default({}),
    positiveModels: z.number().default(0),
  }).nullable().optional(),
  month: z.object({
    results: z.array(DailyResult).default([]),
    topModels: z.array(TopModel).default([]),
    metrics: Metrics.default({}),
    positiveModels: z.number().default(0),
  }).nullable().optional(),
}).passthrough()

const DailyResults = z.object({
  date: IsoDate.optional(),
  results: z.array(DailyResult).default([]),
  topModels: z.array(TopModel).default([]),
  metrics: Metrics.default({}),
  positiveModels: z.number().default(0),
}).passthrough()

const DailyBetsDates = z.array(IsoDate).default([])

const ModelsList = z.object({
  items: z.array(ModelsListItem).default([]),
}).passthrough()

const FixturesDaily = z.object({
  date: IsoDate.optional(),
  fixtures: z.array(z.unknown()).default([]),
  bets: z.array(z.unknown()).default([]),
}).passthrough()

// Each entry: { schema, fallback }. `fallback` matches the composable's `default`.
export const endpointSchemas = {
  modelsList: { schema: ModelsList, fallback: { items: [] } },
  modelById: { schema: z.unknown().nullable(), fallback: null },
  modelChart: { schema: ChartPayload, fallback: { labels: [], data: [], annotationIndex: 0 } },
  modelTrend: { schema: TrendPayload, fallback: { slope: 0, intercept: 0, line: [], distance: 0 } },
  modelResults: { schema: z.array(ResultRow), fallback: [] },
  modelBets: { schema: PagedBets, fallback: { items: [], total: 0, page: 1, size: 25 } },
  dailyBets: { schema: DailyBetsResponse, fallback: { date: null, bets: [], total: 0 } },
  dailyBetsDates: { schema: DailyBetsDates, fallback: [] },
  dashboard: { schema: DashboardPayload, fallback: { bankrollEvolution: [] } },
  dailyResults: { schema: DailyResults, fallback: { results: [], topModels: [], metrics: {}, positiveModels: 0 } },
  fixturesDaily: { schema: FixturesDaily, fallback: { date: null, fixtures: [], bets: [] } },
}

/**
 * Parse `data` against `entry.schema`. On failure, log one line and return `entry.fallback`.
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
