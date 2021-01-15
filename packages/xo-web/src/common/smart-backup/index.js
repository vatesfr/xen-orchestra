import { get, identity, isEmpty } from 'lodash'

import { EMPTY_OBJECT } from './../utils'

export const destructPattern = (pattern, valueTransform = identity) =>
  pattern && {
    not: !!pattern.__not,
    values: valueTransform((pattern.__not || pattern).__or),
  }

export const constructPattern = ({ not, values } = EMPTY_OBJECT, valueTransform = identity) => {
  if (values == null || !values.length) {
    return
  }

  const pattern = { __or: valueTransform(values) }
  return not ? { __not: pattern } : pattern
}

// ===================================================================

export const destructSmartPattern = (pattern, valueTransform = identity) =>
  pattern && {
    values: valueTransform(pattern.__and !== undefined ? pattern.__and[0].__or : pattern.__or),
    notValues: valueTransform(pattern.__and !== undefined ? pattern.__and[1].__not.__or : get(pattern, '__not.__or')),
  }

export const constructSmartPattern = ({ values, notValues } = EMPTY_OBJECT, valueTransform = identity) => {
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

export default from './preview'
