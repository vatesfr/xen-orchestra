import { createClient, createSecureClient } from 'xmlrpc'
import { promisify } from 'promise-toolbox'

import XapiError from '../_XapiError'

import prepareXmlRpcParams from './_prepareXmlRpcParams'

const logError = error => {
  if (error.res) {
    console.error('XML-RPC Error: %s (response status %s)', error.message, error.res.statusCode)
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
    throw XapiError.wrap(result.ErrorDescription)
  }

  return result.Value
}

export default ({ secureOptions, url: { hostname, pathname, port, protocol }, agent }) => {
  const secure = protocol === 'https:'
  const client = (secure ? createSecureClient : createClient)({
    ...(secure ? secureOptions : undefined),
    agent,
    host: hostname,
    pathname,
    port,
  })
  const call = promisify(client.methodCall, client)

  return (method, args) => call(method, prepareXmlRpcParams(args)).then(parseResult, logError)
}
