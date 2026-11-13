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
// meant for data leaving XO (e.g. support dumps, audit records), not for display
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

// SMB URLs (e.g. of backup repositories) contain the raw password, which can
// contain any character (e.g. `smb://user:p@ss/w@domain\\\\host\0path`), so the
// credentials are everything up to the last `@` before the path
const SMB_CREDENTIALS_RE = /^(smb:\/\/)[^\0]*@/i

// other URLs, anywhere in the string (e.g. an error message): credentials are
// URL encoded and end at the first `@`, see https://datatracker.ietf.org/doc/html/rfc3986#section-3.2.1
const URL_CREDENTIALS_RE = /([a-z][a-z\d+.-]*:\/\/)[^\s/?#@]*@/gi

// e.g. `?encryptionKey=` in a backup repository URL, same names as SENSITIVE_PARAMS
const SENSITIVE_QUERY_PARAM_RE = /([?&](?:encryptionKey|passphrase|token|[^=&#\s]*password[^=&#\s]*)=)[^&#\s]*/gi

// replaces the credentials and the sensitive query parameters of the URLs in a string
function redactUrls(string, replacement = OBFUSCATED_VALUE) {
  if (!string.includes('://')) {
    return string
  }
  return string
    .replace(SMB_CREDENTIALS_RE, (_, scheme) => `${scheme}${replacement}@`)
    .replace(URL_CREDENTIALS_RE, (_, scheme) => `${scheme}${replacement}@`)
    .replace(SENSITIVE_QUERY_PARAM_RE, (_, param) => `${param}${replacement}`)
}
exports.redactUrls = redactUrls

// unlike replace(), also replaces non-string entries (e.g. a whole object under
// a `secret` key), keys are kept so that the structure stays usable
//
// options:
// - `replacement`: OBFUSCATED_VALUE by default
// - `urls`: whether to apply redactUrls() to the other strings, false by default
function redact(value, isSensitive = isExportSensitiveParam, { replacement = OBFUSCATED_VALUE, urls = false } = {}) {
  function helper(value) {
    if (typeof value === 'string') {
      return urls ? redactUrls(value, replacement) : value
    }

    if (typeof value !== 'object' || value === null) {
      return value
    }

    if (Array.isArray(value)) {
      return value.map(helper)
    }

    const result = {}
    for (const key of Object.keys(value)) {
      result[key] = isSensitive(key) ? replacement : helper(value[key])
    }
    return result
  }

  return helper(value)
}
exports.redact = redact
