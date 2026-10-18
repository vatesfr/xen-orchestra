import { replace } from '@vates/obfuscate'

// same replacement as the API params, see xo-server/src/xo-mixins/api.mjs
const OBFUSCATED = '* obfuscated *'

// methods whose result is a secret by itself
//
// some of them are in the default blocked list, but it can be changed
const SECRET_RESULTS = {
  'netdata.getHostApiKey': true,
  'netdata.getLocalApiKey': true,
  'token.create': true,
  'user.getAuthenticationTokens': true,
}

// one-time URLs giving access to a download or an upload
const SECRET_KEYS = {
  $getFrom: true,
  $sendTo: true,
}

// SMB URLs of backup repositories contain the raw password, which can contain
// any character (e.g. `smb://user:p@ss/w@domain\\\\host\0path`), so the
// credentials are everything up to the last `@` before the path
const SMB_CREDENTIALS_RE = /^(smb:\/\/)[^\0]*@/i

// other URLs, anywhere in the string (e.g. an error message): credentials are
// URL encoded and end at the first `@`, see https://datatracker.ietf.org/doc/html/rfc3986#section-3.2.1
const URL_CREDENTIALS_RE = /([a-z][a-z\d+.-]*:\/\/)[^\s/?#@]*@/gi

// e.g. `?encryptionKey=` in a backup repository URL, same names as @vates/obfuscate
const SENSITIVE_QUERY_PARAM_RE = /([?&](?:encryptionKey|passphrase|token|[^=&#\s]*password[^=&#\s]*)=)[^&#\s]*/gi

function redactString(value) {
  if (!value.includes('://')) {
    return value
  }
  return value
    .replace(SMB_CREDENTIALS_RE, `$1${OBFUSCATED}@`)
    .replace(URL_CREDENTIALS_RE, `$1${OBFUSCATED}@`)
    .replace(SENSITIVE_QUERY_PARAM_RE, `$1${OBFUSCATED}`)
}

function redactValue(value, key) {
  if (typeof value === 'string') {
    return SECRET_KEYS[key] ? OBFUSCATED : redactString(value)
  }

  if (typeof value !== 'object' || value === null) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(item => redactValue(item))
  }

  const result = {}
  for (const key of Object.keys(value)) {
    result[key] = redactValue(value[key], key)
  }
  return result
}

// remove the secrets from the data of a record before it is stored
//
// this is best effort, it relies on known names and patterns
export function redactData(data) {
  // normalize first (e.g. dates to strings) like audit-core does when storing
  data = redactValue(replace(JSON.parse(JSON.stringify(data)), OBFUSCATED))

  if (SECRET_RESULTS[data.method] && data.result !== undefined) {
    data.result = OBFUSCATED
  }

  return data
}
