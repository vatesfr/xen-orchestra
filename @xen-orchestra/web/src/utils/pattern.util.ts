import { get, identity } from 'lodash-es'

export function extractIdsFromSimplePattern(pattern: any) {
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

export function destructSmartPattern(pattern: Record<string, any>, valueTransform = identity) {
  return (
    pattern && {
      values: valueTransform(pattern.__and !== undefined ? pattern.__and[0].__or : pattern.__or),
      notValues: valueTransform(pattern.__and !== undefined ? pattern.__and[1].__not.__or : get(pattern, '__not.__or')),
    }
  )
}
