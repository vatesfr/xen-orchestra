import createDebug from 'debug'
const debug = createDebug('xo:api')

import getKeys from 'lodash.keys'
import isFunction from 'lodash.isfunction'
import kindOf from 'kindof'
import ms from 'ms'
import schemaInspector from 'schema-inspector'

import {
  InvalidParameters,
  MethodNotFound,
  NoSuchObject,
  Unauthorized
} from './api-errors'
import {
  createRawObject,
  forEach
} from './utils'

// ===================================================================

// FIXME: this function is specific to XO and should not be defined in
// this file.
function checkPermission (method) {
  /* jshint validthis: true */

  const {permission} = method

  // No requirement.
  if (permission === undefined) {
    return
  }

  const {user} = this
  if (!user) {
    throw new Unauthorized()
  }

  // The only requirement is login.
  if (!permission) {
    return
  }

  if (!user.hasPermission(permission)) {
    throw new Unauthorized()
  }
}

// -------------------------------------------------------------------

function checkParams (method, params) {
  const schema = method.params
  if (!schema) {
    return
  }

  const result = schemaInspector.validate({
    type: 'object',
    properties: schema
  }, params)

  if (!result.valid) {
    throw new InvalidParameters(result.error)
  }
}

// -------------------------------------------------------------------

function resolveParams (method, params) {
  const resolve = method.resolve
  if (!resolve) {
    return params
  }

  const {user} = this
  if (!user) {
    throw new Unauthorized()
  }

  const userId = user.get('id')

  const permissions = []
  forEach(resolve, ([param, types, permission = 'administrate'], key) => {
    const id = params[param]
    if (id === undefined) {
      return
    }

    const object = this.getObject(id, types)

    // This parameter has been handled, remove it.
    delete params[param]

    // Register this new value.
    params[key] = object

    permissions.push([ object.id, permission ])
  })

  return this.hasPermissions(userId, permissions).then(success => {
    if (success) {
      return params
    }

    throw new Unauthorized()
  })
}

// ===================================================================

function getMethodsInfo () {
  const methods = {}

  forEach(this.api._methods, function (method, name) {
    this[name] = {
      description: method.description,
      params: method.params || {},
      permission: method.permission
    }
  }, methods)

  return methods
}
getMethodsInfo.description = 'returns the signatures of all available API methods'

// -------------------------------------------------------------------

const getVersion = () => '0.1'
getVersion.description = 'API version (unstable)'

// -------------------------------------------------------------------

function listMethods () {
  return getKeys(this.api._methods)
}
listMethods.description = 'returns the name of all available API methods'

// -------------------------------------------------------------------

function methodSignature ({method: name}) {
  const method = this.api.getMethod(name)

  if (!method) {
    throw new NoSuchObject()
  }

  // Return an array for compatibility with XML-RPC.
  return [
    // XML-RPC require the name of the method.
    {
      name,
      description: method.description,
      params: method.params || {},
      permission: method.permission
    }
  ]
}
methodSignature.description = 'returns the signature of an API method'

// ===================================================================

export default class Api {
  constructor ({context} = {}) {
    this._methods = createRawObject()
    this.context = context

    this.addMethods({
      system: {
        getMethodsInfo,
        getVersion,
        listMethods,
        methodSignature
      }
    })
  }

  addMethod (name, method) {
    this._methods[name] = method
  }

  addMethods (methods) {
    let base = ''
    forEach(methods, function addMethod (method, name) {
      name = base + name

      if (isFunction(method)) {
        this.addMethod(name, method)
        return
      }

      const oldBase = base
      base = name + '.'
      forEach(method, addMethod, this)
      base = oldBase
    }, this)
  }

  async call (session, name, params) {
    const startTime = Date.now()

    const method = this.getMethod(name)
    if (!method) {
      throw new MethodNotFound(name)
    }

    const context = Object.create(this.context)
    context.api = this // Used by system.*().
    context.session = session

    // FIXME: too coupled with XO.
    // Fetch and inject the current user.
    const userId = session.get('user_id', undefined)
    if (userId) {
      context.user = await context._getUser(userId)
    }

    try {
      await checkPermission.call(context, method)
      checkParams(method, params)

      await resolveParams.call(context, method, params)

      let result = await method.call(context, params)

      // If nothing was returned, consider this operation a success
      // and return true.
      if (result === undefined) {
        result = true
      }

      debug(
        '%s(...) [%s] ==> %s',
        name,
        ms(Date.now() - startTime),
        kindOf(result)
      )

      return result
    } catch (error) {
      debug(
        '%s(...) [%s] =!> %s',
        name,
        ms(Date.now() - startTime),
        error
      )

      const stack = error && error.stack
      if (stack) {
        console.error(stack)
      }

      throw error
    }
  }

  getMethod (name) {
    return this._methods[name]
  }
}
