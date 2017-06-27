import { ignoreErrors } from 'promise-toolbox'
import { noSuchObject } from 'xo-common/api-errors'

import Xapi from '../xapi'
import xapiObjectToXo from '../xapi-object-to-xo'
import XapiStats from '../xapi-stats'
import {
  camelToSnakeCase,
  createRawObject,
  forEach,
  isEmpty,
  isString,
  popProperty,
  serializeError
} from '../utils'
import {
  Servers
} from '../models/server'

// ===================================================================

export default class {
  constructor (xo) {
    this._objectConflicts = createRawObject() // TODO: clean when a server is disconnected.
    const serversDb = this._servers = new Servers({
      connection: xo._redis,
      prefix: 'xo:server',
      indexes: ['host']
    })
    this._stats = new XapiStats()
    this._xapis = createRawObject()
    this._xapisByPool = createRawObject()
    this._xo = xo

    xo.on('start', async () => {
      xo.addConfigManager('xenServers',
        () => serversDb.get(),
        servers => serversDb.update(servers)
      )

      // Connects to existing servers.
      const servers = await serversDb.get()
      for (let server of servers) {
        if (server.enabled) {
          this.connectXenServer(server.id).catch(error => {
            console.error(
              `[WARN] ${server.host}:`,
              error[0] || error.stack || error.code || error
            )
          })
        }
      }
    })

    // TODO: disconnect servers on stop.
  }

  async registerXenServer ({
    allowUnauthorized,
    host,
    label,
    password,
    readOnly,
    username
  }) {
    // FIXME: We are storing passwords which is bad!
    //        Could we use tokens instead?
    // TODO: use plain objects
    const server = await this._servers.create({
      allowUnauthorized: allowUnauthorized ? 'true' : undefined,
      enabled: 'true',
      host,
      label: label || undefined,
      password,
      readOnly: readOnly ? 'true' : undefined,
      username
    })

    return server.properties
  }

  async unregisterXenServer (id) {
    this.disconnectXenServer(id)::ignoreErrors()

    if (!await this._servers.remove(id)) {
      throw noSuchObject(id, 'xenServer')
    }
  }

  async updateXenServer (id, {
    allowUnauthorized,
    enabled,
    error,
    host,
    label,
    password,
    readOnly,
    username
  }) {
    const server = await this._getXenServer(id)

    if (label !== undefined) server.set('label', label || undefined)
    if (host) server.set('host', host)
    if (username) server.set('username', username)
    if (password) server.set('password', password)

    if (error !== undefined) {
      server.set('error', error ? JSON.stringify(error) : '')
    }

    if (enabled !== undefined) {
      server.set('enabled', enabled ? 'true' : undefined)
    }

    if (readOnly !== undefined) {
      server.set('readOnly', readOnly ? 'true' : undefined)
      const xapi = this._xapis[id]
      if (xapi) {
        xapi.readOnly = readOnly
      }
    }

    if (allowUnauthorized !== undefined) {
      server.set('allowUnauthorized', allowUnauthorized ? 'true' : undefined)
    }

    await this._servers.update(server)
  }

  // TODO: this method will no longer be async when servers are
  // integrated to the main collection.
  async _getXenServer (id) {
    const server = await this._servers.first(id)
    if (!server) {
      throw noSuchObject(id, 'xenServer')
    }

    return server
  }

  _onXenAdd (xapiObjects, xapiIdsToXo, toRetry, conId) {
    const conflicts = this._objectConflicts
    const objects = this._xo._objects

    forEach(xapiObjects, (xapiObject, xapiId) => {
      try {
        const xoObject = xapiObjectToXo(xapiObject)
        if (!xoObject) {
          return
        }

        const xoId = xoObject.id
        xapiIdsToXo[xapiId] = xoId

        const previous = objects.get(xoId, undefined)
        if (
          previous &&
          previous._xapiRef !== xapiObject.$ref
        ) {
          (
            conflicts[xoId] ||
            (conflicts[xoId] = createRawObject())
          )[conId] = xoObject
        } else {
          objects.set(xoId, xoObject)
        }
      } catch (error) {
        console.error('ERROR: xapiObjectToXo', error)

        toRetry[xapiId] = xapiObject
      }
    })
  }

  _onXenRemove (xapiObjects, xapiIdsToXo, toRetry, conId) {
    const conflicts = this._objectConflicts
    const objects = this._xo._objects

    forEach(xapiObjects, (_, xapiId) => {
      toRetry && delete toRetry[xapiId]

      const xoId = xapiIdsToXo[xapiId]
      if (!xoId) {
        // This object was not known previously.
        return
      }

      delete xapiIdsToXo[xapiId]

      const objConflicts = conflicts[xoId]
      if (objConflicts) {
        if (objConflicts[conId]) {
          delete objConflicts[conId]
        } else {
          objects.set(xoId, popProperty(objConflicts))
        }

        if (isEmpty(objConflicts)) {
          delete conflicts[xoId]
        }
      } else {
        objects.unset(xoId)
      }
    })
  }

  async connectXenServer (id) {
    const server = (await this._getXenServer(id)).properties

    const xapi = this._xapis[server.id] = new Xapi({
      allowUnauthorized: Boolean(server.allowUnauthorized),
      auth: {
        user: server.username,
        password: server.password
      },
      readOnly: Boolean(server.readOnly),
      url: server.host
    })

    xapi.xo = (() => {
      const conId = server.id

      // Maps ids of XAPI objects to ids of XO objects.
      const xapiIdsToXo = createRawObject()

      // Map of XAPI objects which failed to be transformed to XO
      // objects.
      //
      // At each `finish` there will be another attempt to transform
      // until they succeed.
      let toRetry
      let toRetryNext = createRawObject()

      const onAddOrUpdate = objects => {
        this._onXenAdd(objects, xapiIdsToXo, toRetryNext, conId)
      }
      const onRemove = objects => {
        this._onXenRemove(objects, xapiIdsToXo, toRetry, conId)
      }

      const xapisByPool = this._xapisByPool
      const onFinish = () => {
        const { pool } = xapi
        if (pool) {
          xapisByPool[pool.$id] = xapi
        }

        if (!isEmpty(toRetry)) {
          onAddOrUpdate(toRetry)
          toRetry = null
        }

        if (!isEmpty(toRetryNext)) {
          toRetry = toRetryNext
          toRetryNext = createRawObject()
        }
      }

      const { objects } = xapi

      const addObject = object => {
        // TODO: optimize.
        onAddOrUpdate({ [object.$id]: object })
        return xapiObjectToXo(object)
      }

      return {
        httpRequest: this._xo.httpRequest.bind(this),

        install () {
          objects.on('add', onAddOrUpdate)
          objects.on('update', onAddOrUpdate)
          objects.on('remove', onRemove)
          objects.on('finish', onFinish)

          onAddOrUpdate(objects.all)
        },
        uninstall () {
          objects.removeListener('add', onAddOrUpdate)
          objects.removeListener('update', onAddOrUpdate)
          objects.removeListener('remove', onRemove)
          objects.removeListener('finish', onFinish)

          onRemove(objects.all)
        },

        addObject,
        getData: (id, key) => {
          const value = (
            typeof id === 'string'
              ? xapi.getObject(id)
              : id
          ).other_config[`xo:${camelToSnakeCase(key)}`]
          return value && JSON.parse(value)
        },
        setData: async (id, key, value) => {
          await xapi._updateObjectMapProperty(
            xapi.getObject(id),
            'other_config',
            { [`xo:${camelToSnakeCase(key)}`]: JSON.stringify(value) }
          )

          // Register the updated object.
          addObject(await xapi._waitObject(id))
        }
      }
    })()

    xapi.xo.install()

    await xapi.connect().then(
      () => this.updateXenServer(id, { error: null }),
      error => {
        this.updateXenServer(id, { error: serializeError(error) })

        throw error
      }
    )
  }

  async disconnectXenServer (id) {
    const xapi = this._xapis[id]
    if (!xapi) {
      throw noSuchObject(id, 'xenServer')
    }

    delete this._xapis[id]

    const { pool } = xapi
    if (pool) {
      delete this._xapisByPool[pool.id]
    }

    xapi.xo.uninstall()
    return xapi.disconnect()
  }

  getAllXapis () {
    return this._xapis
  }

  // Returns the XAPI connection associated to an object.
  getXapi (object, type) {
    if (isString(object)) {
      object = this._xo.getObject(object, type)
    }

    const { $pool: poolId } = object
    if (!poolId) {
      throw new Error(`object ${object.id} does not belong to a pool`)
    }

    const xapi = this._xapisByPool[poolId]
    if (!xapi) {
      throw new Error(`no connection found for object ${object.id}`)
    }

    return xapi
  }

  async getAllXenServers () {
    const servers = await this._servers.get()
    const xapis = this._xapis
    forEach(servers, server => {
      const xapi = xapis[server.id]
      if (xapi !== undefined) {
        server.status = xapi.status

        let pool
        if (
          server.label === undefined &&
          (pool = xapi.pool) != null
        ) {
          server.label = pool.name_label
        }
      }

      // Do not expose password.
      delete server.password
    })

    return servers
  }

  getXapiVmStats (vm, granularity) {
    const xapi = this.getXapi(vm)
    return this._stats.getVmPoints(xapi, vm._xapiId, granularity)
  }

  getXapiHostStats (host, granularity) {
    const xapi = this.getXapi(host)
    return this._stats.getHostPoints(xapi, host._xapiId, granularity)
  }

  async mergeXenPools (sourceId, targetId, force = false) {
    const sourceXapi = this.getXapi(sourceId)
    const {
      _auth: { user, password },
      _url: { hostname }
    } = this.getXapi(targetId)

    // We don't want the events of the source XAPI to interfere with
    // the events of the new XAPI.
    sourceXapi.xo.uninstall()

    try {
      await sourceXapi.joinPool(hostname, user, password, force)
    } catch (e) {
      sourceXapi.xo.install()

      throw e
    }

    await this.unregisterXenServer(sourceId)
  }
}
