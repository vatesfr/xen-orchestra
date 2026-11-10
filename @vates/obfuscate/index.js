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

// broader than SENSITIVE_PARAMS because redacted values are never merged back:
// meant for data leaving XO (e.g. support dumps), not for display
const EXPORT_SENSITIVE_PARAMS = [
  /api[-_]?key/i, // e.g. `apikey` in the XenServer credentials of user preferences
  'encryptionKey',
  'privateKey',
  'pw_hash',
  /passphrase/i,
  /password/i,
  /secret/i,
  /token/i,
]
const isExportSensitiveParam = name =>
  EXPORT_SENSITIVE_PARAMS.some(pattern => (typeof pattern === 'string' ? pattern === name : pattern.test(name)))
exports.isExportSensitiveParam = isExportSensitiveParam

// unlike replace(), also replaces non-string entries (e.g. a whole object under
// a `secret` key), keys are kept so that the structure stays usable
function redact(value, isSensitive = isExportSensitiveParam) {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(item => redact(item, isSensitive))
  }

  const result = {}
  for (const key of Object.keys(value)) {
    result[key] = isSensitive(key) ? OBFUSCATED_VALUE : redact(value[key], isSensitive)
  }
  return result
}
exports.redact = redact

// returns the paths of the keys and string values containing one of the secrets
function findLeaks(value, secrets) {
  const knownSecrets = Array.from(secrets).filter(secret => typeof secret === 'string' && secret !== '')
  const containsSecret = string => knownSecrets.some(secret => string.includes(secret))

  const leaks = []
  function helper(value, path) {
    if (typeof value === 'string') {
      if (containsSecret(value)) {
        leaks.push(path)
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        const keyPath = path === '' ? key : path + '.' + key
        if (containsSecret(key)) {
          leaks.push(keyPath)
        }
        helper(value[key], keyPath)
      }
    }
  }
  helper(value, '')
  return leaks
}
exports.findLeaks = findLeaks
