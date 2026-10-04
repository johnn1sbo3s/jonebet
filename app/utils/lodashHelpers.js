/**
 * Native replacements for nuxt-lodash functions.
 * Nuxt auto-imports from utils/, so these are available globally
 * with the same _ prefixed names the callsites already use.
 *
 * Só `_groupBy` tem call site no app (academy.vue e useAcademiaGlossario);
 * os demais helpers foram removidos por não terem nenhum.
 */

export function _groupBy(array, key) {
  if (!Array.isArray(array)) return {}
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    ;(result[groupKey] = result[groupKey] || []).push(item)
    return result
  }, {})
}
