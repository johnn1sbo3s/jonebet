import { DateTime } from 'luxon'

// Single source of truth for the São Paulo timezone used across the app.
export const SP_TZ = 'America/Sao_Paulo'

// ISO yyyy-MM-dd for "yesterday" in the given zone (default SP).
// Used by index.vue and performance/[[model]].vue as their default date.
export function yesterdayIso(tz = SP_TZ) {
  return DateTime.now().setZone(tz).minus({ days: 1 }).toFormat('yyyy-MM-dd')
}
