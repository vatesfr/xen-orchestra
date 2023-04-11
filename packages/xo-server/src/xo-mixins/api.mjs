import emitAsync from '@xen-orchestra/emit-async'
import { createLogger } from '@xen-orchestra/log'

import Ajv from 'ajv'
import cloneDeep from 'lodash/cloneDeep.js'
import forEach from 'lodash/forEach.js'
import kindOf from 'kindof'
import ms from 'ms'
import { AsyncLocalStorage } from 'async_hooks'
import { format, JsonRpcError, MethodNotFound } from 'json-rpc-peer'

import * as methods from '../api/index.mjs'
import * as sensitiveValues from '../sensitive-values.mjs'
import Connection from '../connection.mjs'
import { noop, serializeError } from '../utils.mjs'

import * as errors from 'xo-common/api-errors.js'

// ===================================================================

const log = createLogger('xo:api')

const ALLOWED_METHOD_PROPS = {
  description: true,
  params: true,
  permission: true,
  resolve: true,
}

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
  OPERATION_BLOCKED: ([ref, code], getId) => errors.operationBlocked({ objectId: getId(ref), code }),
  PATCH_PRECHECK_FAILED_ISO_MOUNTED: ([patch]) => errors.patchPrecheck({ errorType: 'isoMounted', patch }),
  PIF_VLAN_EXISTS: ([pif], getId) => errors.objectAlreadyExists({ objectId: getId(pif), objectType: 'PIF' }),
  SESSION_AUTHENTICATION_FAILED: errors.authenticationFailed,
  VDI_IN_USE: ([vdi, operation], getId) => errors.vdiInUse({ vdi: getId(vdi), operation }),
  VM_BAD_POWER_STATE: ([vm, expected, actual], getId) => errors.vmBadPowerState({ vm: getId(vm), expected, actual }),
  VM_IS_TEMPLATE: errors.vmIsTemplate,
  VM_LACKS_FEATURE: ([vm], getId) => errors.vmLacksFeature({ vm: getId(vm) }),
  VM_LACKS_FEATURE_SHUTDOWN: ([vm], getId) => errors.vmLacksFeature({ vm: getId(vm), feature: 'shutdown' }),
  VM_MISSING_PV_DRIVERS: ([vm], getId) => errors.vmMissingPvDrivers({ vm: getId(vm) }),
}

const hasPermission = (actual, expected) => PERMISSIONS[actual] >= PERMISSIONS[expected]

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, useDefaults: true })

function checkParams(method, params) {
  const { validate } = method
  if (validate !== undefined) {
    if (!validate(params)) {
      throw errors.invalidParameters(validate.errors)
    }
  }
}

function checkPermission(method) {
  const { permission } = method

  // User does not need to be authenticated.
  if (permission === null) {
    return
  }

  const { apiContext } = this
  if (!apiContext.user) {
    throw errors.unauthorized(permission)
  }

  if (permission === undefined) {
    return
  }

  if (!hasPermission(apiContext.permission, permission)) {
    throw errors.unauthorized(permission)
  }
}

function adaptJsonSchema(schema) {
  if (schema.enum !== undefined) {
    return schema
  }

  const is = (({ type }) => {
    if (typeof type === 'string') {
      return t => t === type
    }
    const types = new Set(type)
    return t => types.has(t)
  })(schema)

  if (is('array')) {
    const { items } = schema
    if (items !== undefined) {
      if (Array.isArray(items)) {
        for (let i = 0, n = items.length; i < n; ++i) {
          items[i] = adaptJsonSchema(items[i])
        }
      } else {
        schema.items = adaptJsonSchema(items)
      }
    }
  }

  if (is('object')) {
    const { properties = {} } = schema
    let keys = Object.keys(properties)

    for (const key of keys) {
      properties[key] = adaptJsonSchema(properties[key])
    }

    const { additionalProperties } = schema
    if (additionalProperties === undefined) {
      const wildCard = properties['*']
      if (wildCard === undefined) {
        // we want additional properties to be disabled by default unless no properties are defined
        schema.additionalProperties = keys.length === 0
      } else {
        delete properties['*']
        keys = Object.keys(properties)
        schema.additionalProperties = wildCard
      }
    } else if (typeof additionalProperties === 'object') {
      schema.additionalProperties = adaptJsonSchema(additionalProperties)
    }

    // we want properties to be required by default unless explicitly marked so
    // we use property `optional` instead of object `required`
    if (schema.required === undefined) {
      const required = keys.filter(key => {
        const value = properties[key]
        const required = !value.optional
        delete value.optional
        return required
      })
      if (required.length !== 0) {
        schema.required = required
      }
    }
  }

  if (is('string')) {
    // we want strings to be not empty by default
    if (schema.minLength === undefined && schema.format === undefined && schema.pattern === undefined) {
      schema.minLength = 1
    }
  }

  return schema
}

async function resolveParams(method, params) {
  const resolve = method.resolve
  if (!resolve) {
    return params
  }

  if (!this.apiContext.user) {
    throw errors.unauthorized()
  }

  // Do not alter the original object.
  params = { ...params }

  const permissions = []
  forEach(resolve, ([param, types, permission = 'administrate'], key) => {
    const id = params[param]
    if (
      id === undefined || // optional param not used
      id === null // explicit value to unset
    ) {
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

  await this.checkPermissions(permissions)

  return params
}

// -------------------------------------------------------------------

export default class Api {
  #apiContext = new AsyncLocalStorage()
  #connections = new Set()

  get apiConnections() {
    return this.#connections
  }

  get apiContext() {
    return this.#apiContext.getStore()
  }

  constructor(app) {
    this._logger = null
    this._methods = { __proto__: null }
    this._app = app

    this.addApiMethods(methods)
    app.hooks.on('start', async () => {
      this._logger = await app.getLogger('api')
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

    // alias
    if (typeof method === 'string') {
      Object.defineProperty(methods, name, {
        configurable: true,
        enumerable: true,
        get() {
          return methods[method]
        },
      })
    } else {
      Object.keys(method).forEach(prop => {
        if (!(prop in ALLOWED_METHOD_PROPS)) {
          throw new Error(`invalid prop ${prop} for API method ${name}`)
        }
      })

      const { params } = method
      if (params !== undefined) {
        let schema = { type: 'object', properties: cloneDeep(params) }
        try {
          schema = adaptJsonSchema(schema)
          method.validate = ajv.compile(schema)
        } catch (error) {
          log.warn('failed to compile method params schema', {
            error,
            method: name,
            schema,
          })
          throw error
        }
      }

      methods[name] = method
    }

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

      const type = typeof method
      if (type === 'string') {
        removes.push(this.addApiMethod(name, base + method))
      } else if (type === 'function') {
        removes.push(this.addApiMethod(name, method))
      } else {
        const oldBase = base
        base = name + '.'
        forEach(method, addMethod)
        base = oldBase
      }
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

  async callApiMethod(connection, name, params = {}) {
    const method = this._methods[name]
    if (!method) {
      throw new MethodNotFound(name)
    }

    const apiContext = { __proto__: null, connection }

    const userId = connection.get('user_id', undefined)
    if (userId !== undefined) {
      const user = await this._app.getUser(userId)
      apiContext.user = user
      apiContext.permission = user.permission
    } else {
      apiContext.permission = 'none'
    }

    return this.#apiContext.run(apiContext, () => this.#callApiMethod(name, method, params))
  }

  async #callApiMethod(name, method, params) {
    const app = this._app
    const startTime = Date.now()

    const { connection, user } = this.apiContext

    const userName = user?.email ?? '(unknown user)'

    const data = {
      callId: Math.random().toString(36).slice(2),
      userId: user?.id,
      userName,
      userIp: connection.get('user_ip', undefined),
      method: name,
      params: sensitiveValues.replace(params, '* obfuscated *'),
      timestamp: Date.now(),
    }

    await emitAsync.call(
      app,
      {
        onError(error) {
          log.warn('xo:preCall listener failure', { error })
        },
      },
      'xo:preCall',
      data
    )

    try {
      await checkPermission.call(app, method)

      // API methods are in a namespace.
      // Some methods use the namespace or an id parameter like:
      //
      // vm.detachPci vm=<string>
      // vm.ejectCd id=<string>
      //
      // The goal here is to standardize the calls by always providing
      // an id parameter when possible to simplify calls to the API.
      if (params?.id === undefined) {
        const namespace = name.slice(0, name.indexOf('.'))
        const spec = method.params
        if (spec !== undefined && 'id' in spec && !(namespace in spec)) {
          const id = params[namespace]
          if (typeof id === 'string') {
            delete params[namespace]
            params.id = id
          }
        }
      }

      checkParams.call(app, method, params)

      const resolvedParams = await resolveParams.call(app, method, params)

      let result = await method.call(app, resolvedParams)

      // If nothing was returned, consider this operation a success
      // and return true.
      if (result === undefined) {
        result = true
      }

      log.debug(`${userName} | ${name}(...) [${ms(Date.now() - startTime)}] ==> ${kindOf(result)}`)

      // it's a special case in which the user is defined at the end of the call
      if (data.method === 'session.signIn') {
        const { id, email } = await app.getUser(connection.get('user_id'))
        data.userId = id
        data.userName = email
      }

      const now = Date.now()
      app.emit('xo:postCall', {
        ...data,
        duration: now - data.timestamp,
        result,
        timestamp: now,
      })

      return result
    } catch (error) {
      const serializedError = serializeError(error)

      const now = Date.now()
      app.emit('xo:postCall', {
        ...data,
        duration: now - data.timestamp,
        error: serializedError,
        timestamp: now,
      })

      const message = `${userName} | ${name}(${JSON.stringify(data.params)}) [${ms(
        Date.now() - startTime
      )}] =!> ${error}`

      // 2020-07-10: Work-around: many kinds of error can be triggered by
      // 'pool.listMissingPatches' method, which can generates a lot of logs due to the fact that xo-web
      // uses 5s active subscriptions to call it.
      // 2021-02-11: Work-around: ECONNREFUSED error can be triggered by
      // 'host.stats' method because there is no connection to the host during a
      // toolstack restart and xo-web may call it often
      if (name !== 'pool.listMissingPatches' && name !== 'host.stats') {
        this._logger.error(message, {
          ...data,
          duration: Date.now() - startTime,
          error: serializedError,
        })

        if (app.config.get('verboseApiLogsOnErrors')) {
          log.warn(message, { error })
        } else {
          log.warn(`${userName} | ${name}(...) [${ms(Date.now() - startTime)}] =!> ${error}`)
        }
      }

      const xoError = XAPI_ERROR_TO_XO_ERROR[error.code]
      if (xoError) {
        throw xoError(error.params, ref => {
          try {
            return app.getObject(ref).id
          } catch (e) {
            return ref
          }
        })
      }

      // don't return *unknown error from the peer* if the user is admin
      if (error.toJsonRpcError === undefined && user?.permission === 'admin') {
        throw new JsonRpcError(error.message, undefined, serializeError(serializedError))
      }

      throw error
    }
  }

  createApiConnection(remoteAddress) {
    const connections = this.#connections

    const connection = new Connection()
    connection.set('user_ip', remoteAddress)

    connections.add(connection)
    connection.on('close', () => {
      connections.delete(connection)

      log.debug(`- WebSocket connection (${remoteAddress}) (${connections.size} connected)`)
    })

    log.debug(`+ WebSocket connection (${remoteAddress}) (${connections.size} connected)`)

    return connection
  }

  registerApiHttpRequest(method, connection, fn, data, { exposeAllErrors = false, ...opts } = {}) {
    const app = this._app
    const logger = this._logger
    return app.registerHttpRequest(
      async function (req, res) {
        const timestamp = Date.now()
        try {
          return await fn.apply(this, arguments)
        } catch (error) {
          const userId = connection.get('user_id', undefined)
          const user = userId && (await app.getUser(userId))
          logger.error(`handleVmImport =!> ${error}`, {
            callId: Math.random().toString(36).slice(2),
            // userId,
            userName: user?.email ?? '(unknown user)',
            userIp: connection.get('user_ip', undefined),
            method: `HTTP handler of ${method}`,
            timestamp,
            duration: Date.now() - timestamp,
            error: serializeError(error),
          })

          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')

            res.write(
              format.error(
                0,
                exposeAllErrors && error != null && typeof error.toJsonRpcError !== 'function'
                  ? new JsonRpcError(error.message, error.code, error.data)
                  : error
              )
            )
          }
          res.end()
        }
      },
      data,
      opts
    )
  }
}
