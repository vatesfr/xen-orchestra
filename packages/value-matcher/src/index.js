// @flow

/* eslint-disable no-use-before-define */
export type Pattern = AndPattern | OrPattern | NotPattern | ObjectPattern | ArrayPattern | ValuePattern
/* eslint-enable no-use-before-define */

// all patterns must match
type AndPattern = {| __and: Array<Pattern> |}

// one of the pattern must match
type OrPattern = {| __or: Array<Pattern> |}

// the pattern must not  match
type NotPattern = {| __not: Pattern |}

// value is an object with properties matching the patterns
type ObjectPattern = { [string]: Pattern }

// value is an array and each patterns must match a different item
type ArrayPattern = Array<Pattern>

// value equals the pattern
type ValuePattern = boolean | number | string

const match = (pattern: Pattern, value: any) => {
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
        const andPattern: AndPattern = (pattern: any)
        return andPattern.__and.every(subpattern => match(subpattern, value))
      }
      if (key === '__or') {
        const orPattern: OrPattern = (pattern: any)
        return orPattern.__or.some(subpattern => match(subpattern, value))
      }
      if (key === '__not') {
        const notPattern: NotPattern = (pattern: any)
        return !match(notPattern.__not, value)
      }
    }

    if (value === null || typeof value !== 'object') {
      return false
    }

    const objectPattern: ObjectPattern = (pattern: any)
    for (let i = 0; i < length; ++i) {
      const key = keys[i]
      const subvalue = value[key]
      if (subvalue === undefined || !match(objectPattern[key], subvalue)) {
        return false
      }
    }
    return true
  }

  return pattern === value
}

export const createPredicate = (pattern: Pattern) => (value: any) => match(pattern, value)
