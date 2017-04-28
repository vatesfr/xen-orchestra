import { createClient, createSecureClient } from 'xmlrpc'
import { promisify } from 'promise-toolbox'

const logError = error => {
  if (error.res) {
    console.error(
      'XML-RPC Error: %s (response status %s)',
      error.message,
      error.res.statusCode
    )
    console.error('%s', error.body)
  }

  throw error
}

const SPECIAL_CHARS = {
  '\r': '\\r',
  '\t': '\\t'
}
const SPECIAL_CHARS_RE = new RegExp(
  Object.keys(SPECIAL_CHARS).join('|'),
  'g'
)

const parseResult = result => {
  const status = result.Status

  // Return the plain result if it does not have a valid XAPI
  // format.
  if (status === undefined) {
    return result
  }

  if (status !== 'Success') {
    throw result.ErrorDescription
  }

  const value = result.Value

  // XAPI returns an empty string (invalid JSON) for an empty
  // result.
  if (value === '') {
    return ''
  }

  try {
    return JSON.parse(value)
  } catch (error) {
    // XAPI JSON sometimes contains invalid characters.
    if (error instanceof SyntaxError) {
      let replaced
      const fixedValue = value.replace(SPECIAL_CHARS_RE, match => {
        replaced = true
        return SPECIAL_CHARS[match]
      })

      if (replaced) {
        return JSON.parse(fixedValue)
      }
    }

    throw error
  }
}

export default ({ url: { hostname, path, port, protocol } }) => {
  const client = (
    protocol === 'https:'
      ? createSecureClient
      : createClient
  )({
    host: hostname,
    path: '/json',
    port,
    rejectUnauthorized: false
  })
  const call = promisify(client.methodCall, client)

  return (method, args) => call(method, args).then(
    parseResult,
    logError
  )
}
