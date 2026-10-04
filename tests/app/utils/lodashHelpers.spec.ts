// tests/app/utils/lodashHelpers.spec.ts
import { describe, it, expect } from 'vitest'
import * as lodashHelpers from '~/utils/lodashHelpers.js'
import { _groupBy } from '~/utils/lodashHelpers.js'

describe('lodashHelpers', () => {
  it('exporta apenas _groupBy (demais helpers sem call site foram removidos)', () => {
    expect(Object.keys(lodashHelpers).sort()).toEqual(['_groupBy'])
  })

  it('_groupBy agrupa por chave de string', () => {
    expect(
      _groupBy(
        [
          { c: 'a', n: 1 },
          { c: 'b', n: 2 },
          { c: 'a', n: 3 },
        ],
        'c',
      ),
    ).toEqual({
      a: [
        { c: 'a', n: 1 },
        { c: 'a', n: 3 },
      ],
      b: [{ c: 'b', n: 2 }],
    })
  })

  it('_groupBy aceita iteratee function', () => {
    expect(_groupBy([1, 2, 3], (n) => (n % 2 ? 'impar' : 'par'))).toEqual({ impar: [1, 3], par: [2] })
  })

  it('_groupBy devolve objeto vazio para entrada não-array', () => {
    expect(_groupBy(null, 'c')).toEqual({})
  })
})
