// Split a cumulative-profit series into the validation and real sub-series,
// aligned on the same category axis (Chart.js).
//
// The API serves a single continuous array plus `annotationIndex` (the number
// of validation bets, i.e. indices 0..annotationIndex-1 are validation and
// indices annotationIndex.. are real). To color each phase independently while
// keeping the line visually connected, we return two sparse arrays padded with
// `null` outside each phase's range, sharing the boundary point:
//
//   valData[i]  = data[i] for i in 0..annotationIndex, else null
//   realData[i] = data[i] for i in annotationIndex..end, else null
//
// When there is no real split (empty data, annotationIndex 0, or the whole
// series is one phase) we return a single copy of `data` so callers can render
// one plain series.
export function splitAccumulation(data = [], annotationIndex = 0) {
  if (!Array.isArray(data) || data.length === 0) {
    return { valData: [], realData: [], split: false }
  }

  const n = data.length
  const idx = Math.max(0, Math.min(annotationIndex, n))
  const hasSplit = idx > 0 && idx < n

  if (!hasSplit) {
    return { valData: data.slice(), realData: [], split: false }
  }

  const valData = new Array(n).fill(null)
  for (let i = 0; i <= idx && i < n; i++) {
    valData[i] = data[i]
  }

  const realData = new Array(n).fill(null)
  for (let i = idx; i < n; i++) {
    realData[i] = data[i]
  }

  return { valData, realData, split: true }
}
