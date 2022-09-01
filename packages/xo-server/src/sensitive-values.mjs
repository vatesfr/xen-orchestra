import mapValues from 'lodash/mapValues.js'

// this random value is used to obfuscate real data
const OBFUSCATED_VALUE = 'obfuscated-q3oi6d9X8uenGvdLnHk2'

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

const SENSITIVE_PARAMS = ['token', /password/i, 'encryptionKey']
const isSensitiveParam = name =>
  SENSITIVE_PARAMS.some(pattern => (typeof pattern === 'string' ? pattern === name : pattern.test(name)))

export function replace(value, replacement) {
  function helper(value, name) {
    if (typeof value === 'string' && isSensitiveParam(name)) {
      return replacement
    }

    if (typeof value !== 'object' || value === null) {
      return value
    }

    return Array.isArray(value) ? value.map(helper) : mapValues(value, helper)
  }

  return helper(value)
}
