import createLogger from '@xen-orchestra/log'
import kindOf from 'kindof'
import ms from 'ms'
import schemaInspector from 'schema-inspector'
import { forEach, isFunction } from 'lodash'
import { MethodNotFound } from 'json-rpc-peer'

import * as methods from '../api'
import * as sensitiveValues from '../sensitive-values'
import { noop, serializeError } from '../utils'

import * as errors from 'xo-common/api-errors'

// ===================================================================

const log = createLogger('xo:api')

const PERMISSIONS = {
  none: 0,
  read: 1,
  write: 2,
  admin: 3,
}

// TODO:
// - error when adding a server to a pool with incompatible version
// - error when halted VM migration failure is due to XS < 7
const XAPI_ERROR_TO_XO_ERROR = {
  EHOSTUNREACH: errors.serverUnreachable,
  HOST_OFFLINE: ([host], getId) => errors.hostOffline({ host: getId(host) }),
  NO_HOSTS_AVAILABLE: errors.noHostsAvailable,
  NOT_SUPPORTED_DURING_UPGRADE: errors.notSupportedDuringUpgrade,
  OPERATION_BLOCKED: ([ref, code], getId) =>
    errors.operationBlocked({ objectId: getId(ref), code }),
  PATCH_PRECHECK_FAILED_ISO_MOUNTED: ([patch]) =>
    errors.patchPrecheck({ errorType: 'isoMounted', patch }),
  PIF_VLAN_EXISTS: ([pif], getId) =>
    errors.objectAlreadyExists({ objectId: getId(pif), objectType: 'PIF' }),
  SESSION_AUTHENTICATION_FAILED: errors.authenticationFailed,
  VDI_IN_USE: ([vdi, operation], getId) =>
    errors.vdiInUse({ vdi: getId(vdi), operation }),
  VM_BAD_POWER_STATE: ([vm, expected, actual], getId) =>
    errors.vmBadPowerState({ vm: getId(vm), expected, actual }),
  VM_IS_TEMPLATE: errors.vmIsTemplate,
  VM_LACKS_FEATURE: ([vm], getId) => errors.vmLacksFeature({ vm: getId(vm) }),
  VM_LACKS_FEATURE_SHUTDOWN: ([vm], getId) =>
    errors.vmLacksFeature({ vm: getId(vm), feature: 'shutdown' }),
  VM_MISSING_PV_DRIVERS: ([vm], getId) =>
    errors.vmMissingPvDrivers({ vm: getId(vm) }),
}

const hasPermission = (user, permission) =>
  PERMISSIONS[user.permission] >= PERMISSIONS[permission]

function checkParams(method, params) {
  const schema = method.params
  if (!schema) {
    return
  }

  const result = schemaInspector.validate(
    {
      type: 'object',
      properties: schema,
    },
    params
  )

  if (!result.valid) {
    throw errors.invalidParameters(result.error)
  }
}

function checkPermission(method) {
  /* jshint validthis: true */

  const { permission } = method

  // No requirement.
  if (permission === undefined) {
    return
  }

  const { user } = this
  if (!user) {
    throw errors.unauthorized(permission)
  }

  // The only requirement is login.
  if (!permission) {
    return
  }

  if (!hasPermission(user, permission)) {
    throw errors.unauthorized(permission)
  }
}

async function resolveParams(method, params) {
  const resolve = method.resolve
  if (!resolve) {
    return params
  }

  const { user } = this
  if (!user) {
    throw errors.unauthorized()
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

    // Permission default to 'administrate' but can be set to a falsy
    // value (except null or undefined which trigger the default
    // value) to simply do a resolve without checking any permissions.
    if (permission) {
      permissions.push([object.id, permission])
    }
  })

  await this.checkPermissions(userId, permissions)

  return params
}

// -------------------------------------------------------------------

export default class Api {
  constructor(xo) {
    this._logger = null
    this._methods = { __proto__: null }
    this._xo = xo

    this.addApiMethods(methods)
    xo.on('start', async () => {
      this._logger = await xo.getLogger('api')
    })
  }

  get apiMethods() {
    return this._methods
  }

  addApiMethod(name, method) {
    const methods = this._methods

    if (name in methods) {
      throw new Error(`API method ${name} already exists`)
    }

    methods[name] = method

    let remove = () => {
      delete methods[name]
      remove = noop
    }
    return () => remove()
  }

  addApiMethods(methods) {
    let base = ''
    const removes = []

    const addMethod = (method, name) => {
      name = base + name

      if (isFunction(method)) {
        removes.push(this.addApiMethod(name, method))
        return
      }

      const oldBase = base
      base = name + '.'
      forEach(method, addMethod)
      base = oldBase
    }

    try {
      forEach(methods, addMethod)
    } catch (error) {
      // Remove all added methods.
      forEach(removes, remove => remove())

      // Forward the error
      throw error
    }

    let remove = () => {
      forEach(removes, remove => remove())
      remove = noop
    }
    return remove
  }

  async callApiMethod(session, name, params = {}) {
    const xo = this._xo
    const startTime = Date.now()

    const method = this._methods[name]
    if (!method) {
      throw new MethodNotFound(name)
    }

    // FIXME: it can cause issues if there any property assignments in
    // XO methods called from the API.
    const context = Object.create(xo, {
      api: {
        // Used by system.*().
        value: this,
      },
      session: {
        value: session,
      },
    })

    // Fetch and inject the current user.
    const userId = session.get('user_id', undefined)
    context.user = userId && (await xo.getUser(userId))
    const userName = context.user ? context.user.email : '(unknown user)'

    const data = {
      userId,
      method: name,
      params: sensitiveValues.replace(params, '* obfuscated *'),
    }

    const callId = Math.random()
      .toString(36)
      .slice(2)

    xo.emit('xo:preCall', {
      ...data,
      callId,
    })

    try {
      await checkPermission.call(context, method)

      // API methods are in a namespace.
      // Some methods use the namespace or an id parameter like:
      //
      // vm.detachPci vm=<string>
      // vm.ejectCd id=<string>
      //
      // The goal here is to standardize the calls by always providing
      // an id parameter when possible to simplify calls to the API.
      if (params != null && params.id === undefined) {
        const namespace = name.slice(0, name.indexOf('.'))
        const id = params[namespace]
        if (typeof id === 'string') {
          params.id = id
        }
      }

      checkParams.call(context, method, params)

      const resolvedParams = await resolveParams.call(context, method, params)

      let result = await method.call(context, resolvedParams)

      // If nothing was returned, consider this operation a success
      // and return true.
      if (result === undefined) {
        result = true
      }

      log.debug(
        `${userName} | ${name}(...) [${ms(
          Date.now() - startTime
        )}] ==> ${kindOf(result)}`
      )

      xo.emit('xo:postCall', {
        callId,
        result,
      })

      return result
    } catch (error) {
      const serializedError = serializeError(error)

      xo.emit('xo:postCall', {
        callId,
        error: serializedError,
      })

      const message = `${userName} | ${name}(${JSON.stringify(
        data.params
      )}) [${ms(Date.now() - startTime)}] =!> ${error}`

      this._logger.error(message, {
        ...data,
        duration: Date.now() - startTime,
        error: serializedError,
      })

      if (xo._config.verboseLogsOnErrors) {
        log.warn(message, { error })
      } else {
        log.warn(
          `${userName} | ${name}(...) [${ms(
            Date.now() - startTime
          )}] =!> ${error}`
        )
      }

      const xoError = XAPI_ERROR_TO_XO_ERROR[error.code]
      if (xoError) {
        throw xoError(error.params, ref => {
          try {
            return xo.getObject(ref).id
          } catch (e) {
            return ref
          }
        })
      }

      throw error
    }
  }
}
