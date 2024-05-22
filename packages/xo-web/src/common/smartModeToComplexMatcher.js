import * as CM from 'complex-matcher'
import escapeRegExp from 'lodash/escapeRegExp.js'

// compile a value-matcher like pattern (plus support for regexps) to a
// complex-matcher pattern
const pseudoValueToComplexMatcher = pattern => {
  if (typeof pattern === 'string') {
    return new CM.RegExpNode(`^${escapeRegExp(pattern)}$`)
  }

  if (Array.isArray(pattern)) {
    return new CM.And(pattern.map(pseudoValueToComplexMatcher))
  }

  if (pattern instanceof RegExp) {
    return new CM.RegExpNode(pattern)
  }

  if (pattern !== null && typeof pattern === 'object') {
    const keys = Object.keys(pattern)
    const { length } = keys

    if (length === 1) {
      const [key] = keys
      if (key === '__and') {
        return new CM.And(pattern.__and.map(pseudoValueToComplexMatcher))
      }
      if (key === '__or') {
        return new CM.Or(pattern.__or.map(pseudoValueToComplexMatcher))
      }
      if (key === '__not') {
        return new CM.Not(pseudoValueToComplexMatcher(pattern.__not))
      }
    }

    const children = []
    Object.keys(pattern).forEach(property => {
      const subpattern = pattern[property]
      if (subpattern !== undefined) {
        children.push(new CM.Property(property, pseudoValueToComplexMatcher(subpattern)))
      }
    })
    return children.length === 0 ? new CM.Null() : new CM.And(children)
  }

  throw new Error('could not transform this pattern')
}

export const smartModeToComplexMatcher = pattern => {
  // don't mutate param
  pattern = JSON.parse(JSON.stringify(pattern))

  // if the pattern does not match expected entries, simply don't change it
  const { tags } = pattern
  if (tags !== undefined) {
    ;(tags.__not ?? tags.__and?.[1]?.__not)?.__or?.push(/^xo:no-bak(?:=.*)?$/)
  }

  return pseudoValueToComplexMatcher(pattern)
}
