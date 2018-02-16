import * as CM from 'complex-matcher'
import { flatten, get, identity, isEmpty, map } from 'lodash'

import { EMPTY_OBJECT } from './utils'

export const destructPattern = (pattern, valueTransform = identity) =>
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

export const constructPattern = (
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

const parsePattern = pattern => {
  const values = flatten(
    pattern.__and !== undefined ? pattern.__and[0].__or : pattern.__or
  )
  const notValues = flatten(
    pattern.__and !== undefined
      ? pattern.__and[1].__not.__or
      : get(pattern, '__not.__or')
  )

  const valuesQueryString =
    values.length !== 0 && new CM.Or(map(values, value => new CM.String(value)))
  const notValuesQueryString =
    notValues.length !== 0 &&
    new CM.Not(new CM.Or(map(notValues, notValue => new CM.String(notValue))))

  return valuesQueryString && notValuesQueryString
    ? new CM.And([valuesQueryString, notValuesQueryString])
    : valuesQueryString || notValuesQueryString
}

export const constructQueryString = pattern => {
  const powerState = pattern.power_state
  const pool = pattern.$pool
  const tags = pattern.tags

  const filter = []

  if (powerState !== undefined) {
    filter.push(new CM.Property('power_state', new CM.String(powerState)))
  }
  if (pool !== undefined) {
    filter.push(new CM.Property('$pool', parsePattern(pool)))
  }
  if (tags !== undefined) {
    filter.push(new CM.Property('tags', parsePattern(tags)))
  }

  return filter.length !== 0 ? new CM.And(filter).toString() : ''
}
