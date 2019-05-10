import { createClient, createSecureClient } from 'xmlrpc'
import { promisify } from 'promise-toolbox'

import prepareXmlRpcParams from './_prepareXmlRpcParams'

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

  return result.Value
}

export default ({ allowUnauthorized, url: { hostname, port, protocol } }) => {
  const client = (protocol === 'https:' ? createSecureClient : createClient)({
    host: hostname,
    port,
    rejectUnauthorized: !allowUnauthorized,
  })
  const call = promisify(client.methodCall, client)

  return (method, args) =>
    call(method, prepareXmlRpcParams(args)).then(parseResult, logError)
}
