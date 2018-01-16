import * as CM from 'complex-matcher'
import { flatten, identity, map } from 'lodash'

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
  const patternValues = flatten(
    pattern.__not !== undefined ? pattern.__not.__or : pattern.__or
  )

  const queryString = new CM.Or(
    map(patternValues, array => new CM.String(array))
  )
  return pattern.__not !== undefined ? CM.Not(queryString) : queryString
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

  return new CM.And(filter).toString()
}
