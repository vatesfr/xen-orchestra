// returns all entries but the last retention-th
exports.getOldEntries = (retention, entries) =>
  entries === undefined
    ? []
    : retention > 0
    ? entries.slice(0, -retention)
    : entries
