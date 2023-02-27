import * as CM from 'complex-matcher'
import escapeRegExp from 'lodash/escapeRegExp.js'

const valueToComplexMatcher = pattern => {
  if (typeof pattern === 'string') {
    return new CM.RegExpNode(`^${escapeRegExp(pattern)}$`, 'i')
  }

  if (Array.isArray(pattern)) {
    return new CM.And(pattern.map(valueToComplexMatcher))
  }

  if (pattern !== null && typeof pattern === 'object') {
    const keys = Object.keys(pattern)
    const { length } = keys

    if (length === 1) {
      const [key] = keys
      if (key === '__and') {
        return new CM.And(pattern.__and.map(valueToComplexMatcher))
      }
      if (key === '__or') {
        return new CM.Or(pattern.__or.map(valueToComplexMatcher))
      }
      if (key === '__not') {
        return new CM.Not(valueToComplexMatcher(pattern.__not))
      }
    }

    const children = []
    Object.keys(pattern).forEach(property => {
      const subpattern = pattern[property]
      if (subpattern !== undefined) {
        children.push(new CM.Property(property, valueToComplexMatcher(subpattern)))
      }
    })
    return children.length === 0 ? new CM.Null() : new CM.And(children)
  }

  throw new Error('could not transform this pattern')
}

export default pattern => {
  try {
    return valueToComplexMatcher(pattern).toString()
  } catch (error) {
    console.warn('constructQueryString', pattern, error)
    return ''
  }
}
