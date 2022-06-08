import forEach from 'lodash/forEach.js'
import getKeys from 'lodash/keys.js'
import moment from 'moment-timezone'

import { noSuchObject } from 'xo-common/api-errors.js'

// ===================================================================

export function getMethodsInfo() {
  const methods = {}

  forEach(this.apiMethods, (method, name) => {
    methods[name] = {
      description: method.description,
      params: method.params || {},
      permission: method.permission,
    }
  })

  return methods
}
getMethodsInfo.description = 'returns the signatures of all available API methods'
getMethodsInfo.permission = null // user does not need to be authenticated

// -------------------------------------------------------------------

export const getServerTimezone = (
  tz => () =>
    tz
)(moment.tz.guess())
getServerTimezone.description = 'return the timezone server'

// -------------------------------------------------------------------

export function getServerVersion() {
  return this.version
}
getServerVersion.description = 'return the version of xo-server'
getServerVersion.permission = null // user does not need to be authenticated

// -------------------------------------------------------------------

export const getVersion = () => '0.1'
getVersion.description = 'API version (unstable)'
getVersion.permission = null // user does not need to be authenticated

// -------------------------------------------------------------------

export function listMethods() {
  return getKeys(this.apiMethods)
}
listMethods.description = 'returns the name of all available API methods'
listMethods.permission = null // user does not need to be authenticated

// -------------------------------------------------------------------

export function methodSignature({ method: name }) {
  const method = this.apiMethods[name]

  if (!method) {
    throw noSuchObject()
  }

  // Return an array for compatibility with XML-RPC.
  return [
    // XML-RPC require the name of the method.
    {
      name,
      description: method.description,
      params: method.params || {},
      permission: method.permission,
    },
  ]
}
methodSignature.description = 'returns the signature of an API method'
methodSignature.params = {
  method: { type: 'string' },
}
methodSignature.permission = null // user does not need to be authenticated
