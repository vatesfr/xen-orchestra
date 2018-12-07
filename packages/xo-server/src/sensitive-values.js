import mapValues from 'lodash/mapValues'

// this random value is used to obfuscate real data
const OBFUSCATED_VALUE = 'q3oi6d9X8uenGvdLnHk2'

export const merge = (newValue, oldValue) => {
  if (newValue === OBFUSCATED_VALUE) {
    return oldValue
  }

  let isArray

  if (
    newValue === null ||
    oldValue === null ||
    typeof newValue !== 'object' ||
    typeof oldValue !== 'object' ||
    (isArray = Array.isArray(newValue)) !== Array.isArray(oldValue)
  ) {
    return newValue
  }

  const iteratee = (v, k) => merge(v, oldValue[k])
  return isArray ? newValue.map(iteratee) : mapValues(newValue, iteratee)
}

export const obfuscate = value => replace(value, OBFUSCATED_VALUE)

const SENSITIVE_PARAMS = new Set(['password', 'token'])

export function replace(value, replacement) {
  function helper(value, name) {
    if (typeof value === 'string' && SENSITIVE_PARAMS.has(name)) {
      return replacement
    }

    if (typeof value !== 'object' || value === null) {
      return value
    }

    return Array.isArray(value) ? value.map(helper) : mapValues(value, helper)
  }

  return helper(value)
}
