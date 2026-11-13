import { isExportSensitiveParam, redact } from '@vates/obfuscate'

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

// one-time URLs of XO giving access to a download or an upload
const SECRET_KEYS = {
  $getFrom: true,
  $sendTo: true,
}

const isSensitive = key => SECRET_KEYS[key] === true || isExportSensitiveParam(key)

// remove the secrets from the data of a record before it is stored
//
// this is best effort, it relies on known names and patterns
export function redactData(data) {
  // normalize first (e.g. dates to strings) like audit-core does when storing
  data = redact(JSON.parse(JSON.stringify(data)), isSensitive, { replacement: OBFUSCATED, urls: true })

  if (SECRET_RESULTS[data.method] && data.result !== undefined) {
    data.result = OBFUSCATED
  }

  return data
}
