'use strict'

const match = (pattern, value) => {
  if (Array.isArray(pattern)) {
    return (
      Array.isArray(value) &&
      pattern.every((subpattern, i) =>
        // FIXME: subpatterns should match different subvalues
        value.some(subvalue => match(subpattern, subvalue))
      )
    )
  }

  if (pattern !== null && typeof pattern === 'object') {
    const keys = Object.keys(pattern)
    const { length } = keys

    if (length === 1) {
      const [key] = keys
      if (key === '__and') {
        return pattern.__and.every(subpattern => match(subpattern, value))
      }
      if (key === '__or') {
        return pattern.__or.some(subpattern => match(subpattern, value))
      }
      if (key === '__not') {
        return !match(pattern.__not, value)
      }
    }

    if (value === null || typeof value !== 'object') {
      return false
    }

    for (let i = 0; i < length; ++i) {
      const key = keys[i]
      const subvalue = value[key]
      if (subvalue === undefined || !match(pattern[key], subvalue)) {
        return false
      }
    }
    return true
  }

  return pattern === value
}

exports.createPredicate = function createPredicate(pattern) {
  return value => match(pattern, value)
}
