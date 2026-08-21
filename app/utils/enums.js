// Frozen enum tables — kill magic strings. Use these everywhere instead
// of string literals like 'exchange', 'green', 'daily', etc.

export const SOURCE = Object.freeze({
  EXCHANGE: 'exchange',
  BOOKIE: 'bookie',
})

export const RESULT = Object.freeze({
  GREEN: 'green',
  RED: 'red',
})

export const GROUP_BY = Object.freeze({
  DAY: 'day',
  BET: 'bet',
})

export const PERIOD = Object.freeze({
  DAILY: 'daily',
  MONTHLY: 'monthly',
})

// Annualization factor for Sharpe ratio of daily strategies.
export const TRADING_DAYS_PER_YEAR = 252

// API market names → display labels. Add long/awkward names here instead of
// special-casing in components.
export const MARKET_LABELS = Object.freeze({
  'Goleada Casa': 'Goleada H',
})
