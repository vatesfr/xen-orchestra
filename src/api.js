import createDebug from 'debug'
const debug = createDebug('xo:api')

import getKeys from 'lodash.keys'
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
  version as xoServerVersion
} from '../package.json'
import {
  createRawObject,
  forEach,
  isFunction,
  noop
} from './utils'

// ===================================================================

const PERMISSIONS = {
  none: 0,
  read: 1,
  write: 2,
  admin: 3
}

const hasPermission = (user, permission) => (
  PERMISSIONS[user.permission] >= PERMISSIONS[permission]
)

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

  if (!hasPermission(user, permission)) {
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

  const userId = user.id

  // Do not alter the original object.
  params = { ...params }

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

    if (!permissions) {
      permissions.push([ object.id, permission ])
    }
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

  forEach(this.api._methods, (method, name) => {
    methods[name] = {
      description: method.description,
      params: method.params || {},
      permission: method.permission
    }
  })

  return methods
}
getMethodsInfo.description = 'returns the signatures of all available API methods'

// -------------------------------------------------------------------

const getServerVersion = () => xoServerVersion
getServerVersion.description = 'return the version of xo-server'

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
  constructor ({
    context,
    verboseLogsOnErrors
  } = {}) {
    this._methods = createRawObject()
    this._verboseLogsOnErrors = verboseLogsOnErrors
    this.context = context

    this.addMethods({
      system: {
        getMethodsInfo,
        getServerVersion,
        getVersion,
        listMethods,
        methodSignature
      }
    })
  }

  addMethod (name, method) {
    const methods = this._methods

    if (name in methods) {
      throw new Error(`API method ${name} already exists`)
    }

    methods[name] = method

    let unset = () => {
      delete methods[name]
      unset = noop
    }
    return () => unset()
  }

  addMethods (methods) {
    let base = ''

    const addMethod = (method, name) => {
      name = base + name

      if (isFunction(method)) {
        this.addMethod(name, method)
        return
      }

      const oldBase = base
      base = name + '.'
      forEach(method, addMethod)
      base = oldBase
    }
    forEach(methods, addMethod)
  }

  async call (session, name, params) {
    const startTime = Date.now()

    const method = this.getMethod(name)
    if (!method) {
      throw new MethodNotFound(name)
    }

    // FIXME: it can cause issues if there any property assignments in
    // XO methods called from the API.
    const context = Object.create(this.context, {
      api: { // Used by system.*().
        value: this
      },
      session: {
        value: session
      }
    })

    // FIXME: too coupled with XO.
    // Fetch and inject the current user.
    const userId = session.get('user_id', undefined)
    context.user = userId && await context.getUser(userId)
    const userName = context.user
      ? context.user.email
      : '(unknown user)'

    try {
      await checkPermission.call(context, method)
      checkParams(method, params)

      const resolvedParams = await resolveParams.call(context, method, params)

      let result = await method.call(context, resolvedParams)

      // If nothing was returned, consider this operation a success
      // and return true.
      if (result === undefined) {
        result = true
      }

      debug(
        '%s | %s(...) [%s] ==> %s',
        userName,
        name,
        ms(Date.now() - startTime),
        kindOf(result)
      )

      return result
    } catch (error) {
      if (this._verboseLogsOnErrors) {
        debug(
          '%s | %s(%j) [%s] =!> %s',
          userName,
          name,
          params,
          ms(Date.now() - startTime),
          error
        )

        const stack = error && error.stack
        if (stack) {
          console.error(stack)
        }
      } else {
        debug(
          '%s | %s(...) [%s] =!> %s',
          userName,
          name,
          ms(Date.now() - startTime),
          error
        )
      }

      throw error
    }
  }

  getMethod (name) {
    return this._methods[name]
  }
}
