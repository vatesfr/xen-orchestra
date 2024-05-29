'use strict'

function mapValues(object, iteratee) {
  const result = {}
  for (const key of Object.keys(object)) {
    result[key] = iteratee(object[key], key, object)
  }
  return result
}

// this random value is used to obfuscate real data
const OBFUSCATED_VALUE = 'obfuscated-q3oi6d9X8uenGvdLnHk2'
exports.OBFUSCATED_VALUE = OBFUSCATED_VALUE

function merge(newValue, oldValue) {
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
exports.merge = merge

const obfuscate = value => replace(value, OBFUSCATED_VALUE)
exports.obfuscate = obfuscate

const SENSITIVE_PARAMS = ['token', 'passphrase', /password/i, 'encryptionKey']
const isSensitiveParam = name =>
  SENSITIVE_PARAMS.some(pattern => (typeof pattern === 'string' ? pattern === name : pattern.test(name)))

function replace(value, replacement) {
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
exports.replace = replace
