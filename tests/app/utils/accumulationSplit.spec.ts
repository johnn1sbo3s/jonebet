// tests/app/utils/accumulationSplit.spec.ts
import { describe, it, expect } from 'vitest'
import { splitAccumulation } from '~/utils/accumulationSplit.js'

describe('splitAccumulation', () => {
  it('returns split=false with empty arrays for empty input', () => {
    expect(splitAccumulation([], 3)).toEqual({ valData: [], realData: [], split: false })
  })

  it('returns split=false (single series) when annotationIndex is 0', () => {
    const data = [1, 2, 3]
    const res = splitAccumulation(data, 0)
    expect(res.split).toBe(false)
    expect(res.valData).toEqual([1, 2, 3])
    expect(res.realData).toEqual([])
  })

  it('returns split=false when annotationIndex equals data length (all validation)', () => {
    const data = [1, 2, 3]
    const res = splitAccumulation(data, 3)
    expect(res.split).toBe(false)
    expect(res.valData).toEqual([1, 2, 3])
  })

  it('returns split=false when annotationIndex exceeds data length', () => {
    const data = [1, 2, 3]
    const res = splitAccumulation(data, 9)
    expect(res.split).toBe(false)
  })

  it('keeps the real series null-padded before the split so it aligns on the shared axis', () => {
    const data = [10, 20, 30, 40, 50]
    const res = splitAccumulation(data, 3)
    expect(res.split).toBe(true)
    // validation covers 0..3 (inclusive), real covers 3..4
    expect(res.valData).toEqual([10, 20, 30, 40, null])
    expect(res.realData).toEqual([null, null, null, 40, 50])
  })

  it('shares the boundary point so the two series visually connect', () => {
    const data = [10, 20, 30, 40, 50]
    const { valData, realData } = splitAccumulation(data, 3)
    expect(valData[3]).toBe(40)
    expect(realData[3]).toBe(40)
  })

  it('handles the real series being just a single trailing point', () => {
    const data = [10, 20, 30, 40]
    const res = splitAccumulation(data, 3)
    expect(res.split).toBe(true)
    expect(res.valData).toEqual([10, 20, 30, 40])
    expect(res.realData).toEqual([null, null, null, 40])
  })
})
