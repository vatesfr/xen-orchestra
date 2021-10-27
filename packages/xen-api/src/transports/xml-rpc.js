import { createClient, createSecureClient } from 'xmlrpc'
import { promisify } from 'promise-toolbox'
import ProxyAgent from 'proxy-agent'

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

export default ({ secureOptions, url: { hostname, port, protocol, httpProxy } }) => {
  const secure = protocol === 'https:'
  let agent
  if (httpProxy !== undefined) {
    agent = new ProxyAgent(httpProxy)
  }
  const client = (secure ? createSecureClient : createClient)({
    ...(secure ? secureOptions : undefined),
    agent,
    host: hostname,
    port,
  })
  const call = promisify(client.methodCall, client)

  return (method, args) => call(method, prepareXmlRpcParams(args)).then(parseResult, logError)
}
