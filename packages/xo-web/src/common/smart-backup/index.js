import * as CM from 'complex-matcher'
import { escapeRegExp, get, identity, isEmpty } from 'lodash'

import { EMPTY_OBJECT } from './../utils'

export const destructPattern = (pattern, valueTransform = identity) =>
  pattern && {
    not: !!pattern.__not,
    values: valueTransform((pattern.__not || pattern).__or),
  }

export const constructPattern = (
  { not, values } = EMPTY_OBJECT,
  valueTransform = identity
) => {
  if (values == null || !values.length) {
    return
  }

  const pattern = { __or: valueTransform(values) }
  return not ? { __not: pattern } : pattern
}

// ===================================================================

export const destructSmartPattern = (pattern, valueTransform = identity) =>
  pattern && {
    values: valueTransform(
      pattern.__and !== undefined ? pattern.__and[0].__or : pattern.__or
    ),
    notValues: valueTransform(
      pattern.__and !== undefined
        ? pattern.__and[1].__not.__or
        : get(pattern, '__not.__or')
    ),
  }

export const constructSmartPattern = (
  { values, notValues } = EMPTY_OBJECT,
  valueTransform = identity
) => {
  const valuesExist = !isEmpty(values)
  const notValuesExist = !isEmpty(notValues)

  if (!valuesExist && !notValuesExist) {
    return
  }

  const valuesPattern = valuesExist && { __or: valueTransform(values) }
  const notValuesPattern = notValuesExist && {
    __not: { __or: valueTransform(notValues) },
  }
  return valuesPattern && notValuesPattern
    ? { __and: [valuesPattern, notValuesPattern] }
    : valuesPattern || notValuesPattern
}

// ===================================================================

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
        children.push(
          new CM.Property(property, valueToComplexMatcher(subpattern))
        )
      }
    })
    return children.length === 0 ? new CM.Null() : new CM.And(children)
  }

  throw new Error('could not transform this pattern')
}

export const constructQueryString = pattern => {
  try {
    return valueToComplexMatcher(pattern).toString()
  } catch (error) {
    console.warn('constructQueryString', pattern, error)
    return ''
  }
}

// ===================================================================

export default from './preview'
