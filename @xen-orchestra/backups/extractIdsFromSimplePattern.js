'use strict'

exports.extractIdsFromSimplePattern = function extractIdsFromSimplePattern(pattern) {
  if (pattern === undefined) {
    return []
  }

  if (pattern !== null && typeof pattern === 'object') {
    let keys = Object.keys(pattern)

    if (keys.length === 1 && keys[0] === 'id') {
      pattern = pattern.id
      if (typeof pattern === 'string') {
        return [pattern]
      }
      if (pattern !== null && typeof pattern === 'object') {
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
    }
  }

  throw new Error('invalid pattern')
}
