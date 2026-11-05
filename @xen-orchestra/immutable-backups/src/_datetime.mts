/**
 * Matches the datetime prefix shared by all files/directories belonging to a
 * single backup run.
 *
 * Examples:
 *   "20231215T142030.json"        → "20231215T142030"
 *   "20231215T142030Z.alias.vhd"  → "20231215T142030Z"
 *   "cache.json.gz"               → undefined  (not a backup file)
 */
export const DATETIME_RE = /^(\d{8}T\d{6}Z?)\./

export function extractDatetime(filename: string): string | undefined {
  return DATETIME_RE.exec(filename)?.[1]
}

// Parse a datetime string like "20231215T142030Z" or "20231215T142030" into a
// Unix timestamp (ms).  Returns undefined when the format does not match.
// Using the filename-encoded datetime as the expiry reference is intentional:
// XO rewrites backup metadata json files after creation (reconciliation, cache
// refresh), which updates mtime and would indefinitely defer the expiry window.
export function parseDatetime(datetime: string): number | undefined {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(datetime)
  if (m === null) return undefined
  const [, year, month, day, hour, min, sec, z] = m
  const ts = Date.parse(`${year}-${month}-${day}T${hour}:${min}:${sec}${z || 'Z'}`)
  return isNaN(ts) ? undefined : ts
}
