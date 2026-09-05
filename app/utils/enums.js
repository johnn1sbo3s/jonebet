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

export const TRADING_MODEL_BADGE = Object.freeze({
  donkey: 'bg-blue-500/20 text-blue-400',
  luigi: 'bg-green-500/20 text-green-400',
  crash: 'bg-red-500/20 text-red-400',
  pacman: 'bg-purple-500/20 text-purple-400',
  scorpion: 'bg-amber-500/20 text-amber-400',
})

export const TRADING_MODEL_RESULT = Object.freeze({
  GREEN: 'text-green-400',
  RED_LIGHT: 'text-amber-400',
  RED: 'text-red-400',
})
