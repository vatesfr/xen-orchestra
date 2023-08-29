// returns all entries but the last retention-th
export function getOldEntries(retention, entries) {
  return entries === undefined ? [] : retention > 0 ? entries.slice(0, -retention) : entries
}
