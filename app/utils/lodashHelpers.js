/**
 * Native replacements for nuxt-lodash functions.
 * Nuxt auto-imports from utils/, so these are available globally
 * with the same _ prefixed names the callsites already use.
 */

export function _isEmpty(value) {
  if (value == null) return true
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function _filter(array, predicate) {
  if (!Array.isArray(array)) return []
  if (typeof predicate === 'function') return array.filter(predicate)
  // Object shorthand: _.filter(items, { key: value })
  if (typeof predicate === 'object' && predicate !== null) {
    return array.filter((item) => Object.entries(predicate).every(([key, val]) => item[key] === val))
  }
  return [...array]
}

export function _map(array, iteratee) {
  if (!Array.isArray(array)) return []
  if (typeof iteratee === 'string') return array.map((item) => item[iteratee])
  return array.map(iteratee)
}

export function _forEach(collection, iteratee) {
  if (Array.isArray(collection)) {
    collection.forEach((value, index) => iteratee(value, index, collection))
  } else if (collection && typeof collection === 'object') {
    Object.entries(collection).forEach(([key, value]) => iteratee(value, key, collection))
  }
}

export function _groupBy(array, key) {
  if (!Array.isArray(array)) return {}
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    ;(result[groupKey] = result[groupKey] || []).push(item)
    return result
  }, {})
}

export function _sum(array) {
  return array.reduce((acc, val) => acc + (Number(val) || 0), 0)
}

export function _sortBy(array, iteratees) {
  return [...array].sort((a, b) => {
    for (const key of iteratees) {
      const aVal = a[key]
      const bVal = b[key]
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
    }
    return 0
  })
}

export function _uniqWith(array, comparator) {
  if (!Array.isArray(array)) return []
  return array.filter((item, index) => array.findIndex((other) => comparator(item, other)) === index)
}

export function _orderBy(array, keys, orders) {
  if (!Array.isArray(array)) return []
  return [...array].sort((a, b) => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const order = (orders && orders[i]) || 'asc'
      const aVal = a[key]
      const bVal = b[key]
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
    }
    return 0
  })
}
