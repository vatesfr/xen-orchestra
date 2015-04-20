import createDebug from 'debug'
const debug = createDebug('xo:api')

import assign from 'lodash.assign'
import Bluebird from 'bluebird'
import forEach from 'lodash.foreach'
import getKeys from 'lodash.keys'
import isFunction from 'lodash.isfunction'
import map from 'lodash.map'
import requireTree from 'require-tree'
import schemaInspector from 'schema-inspector'

import {
  InvalidParameters,
  MethodNotFound,
  NoSuchObject,
  Unauthorized
} from './api-errors'

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
  var schema = method.params
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

// Forward declaration.
let checkAuthorization

function authorized () {}
// function forbiddden () {
//   throw new Unauthorized()
// }
function checkMemberAuthorization (member) {
  return function (userId, object) {
    const memberObject = this.getObject(object[member])
    return checkAuthorization.call(this, userId, memberObject)
  }
}

const checkAuthorizationByTypes = {
  // Objects of these types do not requires any authorization.
  'network': authorized,
  'VM-template': authorized,

  message: checkMemberAuthorization('$object'),

  task: checkMemberAuthorization('$host'),

  VBD: checkMemberAuthorization('VDI'),

  // Access to a VDI is granted if the user has access to the
  // containing SR or to a linked VM.
  VDI (userId, vdi) {
    // Check authorization for each of the connected VMs.
    const promises = map(this.getObjects(vdi.$VBDs, 'VBD'), vbd => {
      const vm = this.getObject(vbd.VM, 'VM')
      return checkAuthorization.call(this, userId, vm)
    })

    // Check authorization for the containing SR.
    const sr = this.getObject(vdi.$SR, 'SR')
    promises.push(checkAuthorization.call(this, userId, sr))

    // We need at least one success
    return Bluebird.any(promises).catch(function (aggregateError) {
      throw aggregateError[0]
    })
  },

  VIF (userId, vif) {
    const network = this.getObject(vif.$network)
    const vm = this.getObject(vif.$VM)

    return Bluebird.any([
      checkAuthorization.call(this, userId, network),
      checkAuthorization.call(this, userId, vm)
    ])
  },

  'VM-snapshot': checkMemberAuthorization('$snapshot_of')
}

function defaultCheckAuthorization (userId, object) {
  return this.acls.exists({
    subject: userId,
    object: object.id
  }).then(success => {
    if (!success) {
      throw new Unauthorized()
    }
  })
}

checkAuthorization = Bluebird.method(function (userId, object) {
  const fn = checkAuthorizationByTypes[object.type] || defaultCheckAuthorization
  return fn.call(this, userId, object)
})

function resolveParams (method, params) {
  var resolve = method.resolve
  if (!resolve) {
    return params
  }

  const {user} = this
  if (!user) {
    throw new Unauthorized()
  }

  const userId = user.get('id')
  const isAdmin = this.user.hasPermission('admin')

  const promises = []
  try {
    forEach(resolve, ([param, types], key) => {
      const id = params[param]
      if (id === undefined) {
        return
      }

      const object = this.getObject(params[param], types)

      // This parameter has been handled, remove it.
      delete params[param]

      // Register this new value.
      params[key] = object

      if (!isAdmin) {
        promises.push(checkAuthorization.call(this, userId, object))
      }
    })
  } catch (error) {
    throw new NoSuchObject()
  }

  return Bluebird.all(promises).return(params)
}

// ===================================================================

function getMethodsInfo () {
  const methods = {}

  forEach(this.api._methods, function (method, name) {
    this[name] = assign({}, {
      description: method.description,
      params: method.params || {},
      permission: method.permission
    })
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
    assign({ name }, {
      description: method.description,
      params: method.params || {},
      permission: method.permission
    })
  ]
}
methodSignature.description = 'returns the signature of an API method'

// ===================================================================

export default class Api {
  constructor ({context} = {}) {
    this._methods = Object.create(null)
    this.context = context

    this.addMethods({
      system: {
        getMethodsInfo,
        getVersion,
        listMethods,
        methodSignature
      }
    })

    // FIXME: this too is specific to XO and should be moved out of this file.
    this.addMethods(requireTree('./api'))
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

  call (session, name, params) {
    debug('%s(...)', name)

    let method
    let context

    return Bluebird.try(() => {
      method = this.getMethod(name)
      if (!method) {
        throw new MethodNotFound(name)
      }

      context = Object.create(this.context)
      context.api = this // Used by system.*().
      context.session = session

      // FIXME: too coupled with XO.
      // Fetch and inject the current user.
      const userId = session.get('user_id', undefined)
      return userId === undefined ? null : context.users.first(userId)
    }).then(function (user) {
      context.user = user

      return checkPermission.call(context, method)
    }).then(() => {
      checkParams(method, params)

      return resolveParams.call(context, method, params)
    }).then(params => {
      return method.call(context, params)
    }).then(
      result => {
        // If nothing was returned, consider this operation a success
        // and return true.
        if (result === undefined) {
          result = true
        }

        debug('%s(...) → %s', name, typeof result)

        return result
      },
      error => {
        debug('Error: %s(...) → %s', name, error)

        throw error
      }
    )
  }

  getMethod (name) {
    return this._methods[name]
  }
}
