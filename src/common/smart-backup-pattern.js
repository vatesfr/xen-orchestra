import * as CM from 'complex-matcher'
import { identity, isArray, map } from 'lodash'

import { EMPTY_OBJECT } from './utils'

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

const parsePattern = pattern => {
  const patternValues = map(pattern.values, value => {
    return isArray(value) ? new CM.String(value[0]) : new CM.String(value)
  })

  return pattern.not
    ? new CM.Not(new CM.Or(patternValues))
    : new CM.Or(patternValues)
}

export const constructQueryString = pattern => {
  const powerState = pattern.power_state
  const pool = destructPattern(pattern.$pool)
  const tags = destructPattern(pattern.tags)

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

  return new CM.And(filter).toString()
}
