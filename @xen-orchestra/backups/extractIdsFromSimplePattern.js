function extractIdsFromSimplePattern(pattern) {
  if (pattern === null || typeof pattern !== 'object') {
    return
  }
  let keys = Object.keys(pattern)

  if (keys.length !== 1 || keys[0] !== 'id') {
    return
  }

  pattern = pattern.id
  if (typeof pattern === 'string') {
    return [pattern]
  }
  if (pattern === null || typeof pattern !== 'object') {
    return
  }

  keys = Object.keys(pattern)
  if (
    keys.length === 1 &&
    keys[0] === '__or' &&
    Array.isArray((pattern = pattern.__or)) &&
    pattern.every(_ => typeof _ === 'string')
  ) {
    return pattern
  }
}
exports.extractIdsFromSimplePattern = extractIdsFromSimplePattern
