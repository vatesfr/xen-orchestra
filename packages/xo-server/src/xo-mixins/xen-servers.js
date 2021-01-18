import createLogger from '@xen-orchestra/log'
import { BaseError } from 'make-error'
import { fibonacci } from 'iterable-backoff'
import { findKey } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors'
import { parseDuration } from '@vates/parse-duration'
import { pDelay, ignoreErrors } from 'promise-toolbox'

import * as XenStore from '../_XenStore'
import Xapi from '../xapi'
import xapiObjectToXo from '../xapi-object-to-xo'
import XapiStats from '../xapi-stats'
import { camelToSnakeCase, forEach, isEmpty, popProperty } from '../utils'
import { Servers } from '../models/server'

// ===================================================================

class PoolAlreadyConnected extends BaseError {
  constructor(poolId, connectedServerId, connectingServerId) {
    super('this pool is already connected')
    this.poolId = poolId
    this.connectedServerId = connectedServerId
    this.connectingServerId = connectingServerId
  }
}

const log = createLogger('xo:xo-mixins:xen-servers')

// Server is disconnected:
// - _xapis[server.id] is undefined

// Server is connecting:
// - _xapis[server.id] is defined

// Server is connected:
// - _xapis[server.id] id defined
// - _serverIdsByPool[xapi.pool.$id] is server.id
export default class {
  constructor(xo, { guessVhdSizeOnImport, xapiMarkDisconnectedDelay, xapiOptions }) {
    this._objectConflicts = { __proto__: null } // TODO: clean when a server is disconnected.
    const serversDb = (this._servers = new Servers({
      connection: xo._redis,
      prefix: 'xo:server',
      indexes: ['host'],
    }))
    this._serverIdsByPool = { __proto__: null }
    this._stats = new XapiStats()
    this._xapiOptions = {
      guessVhdSizeOnImport,
      ...xapiOptions,
    }
    this._xapis = { __proto__: null }
    this._xo = xo
    this._xapiMarkDisconnectedDelay = parseDuration(xapiMarkDisconnectedDelay)

    xo.on('clean', () => serversDb.rebuildIndexes())
    xo.on('start', async () => {
      xo.addConfigManager(
        'xenServers',
        () => serversDb.get(),
        servers => serversDb.update(servers)
      )

      const servers = await serversDb.get()

      // Add servers in XenStore
      if (servers.length === 0) {
        const key = 'vm-data/xen-servers'
        const xenStoreServers = await XenStore.read(key)
          .then(JSON.parse)
          .catch(() => [])
        for (const server of xenStoreServers) {
          servers.push(await this.registerXenServer(server))
        }
        ignoreErrors.call(XenStore.rm(key))
      }

      // Connects to existing servers.
      for (const server of servers) {
        if (server.enabled) {
          this.connectXenServer(server.id).catch(error => {
            log.warn('failed to connect to XenServer', {
              host: server.host,
              error,
            })
          })
        }
      }
    })

    // TODO: disconnect servers on stop.
  }

  async registerXenServer({ allowUnauthorized = false, host, label, password, readOnly = false, username }) {
    // FIXME: We are storing passwords which is bad!
    //        Could we use tokens instead?
    // TODO: use plain objects
    const server = await this._servers.create({
      allowUnauthorized,
      enabled: true,
      host,
      label: label || undefined,
      password,
      readOnly,
      username,
    })

    return server.properties
  }

  async unregisterXenServer(id) {
    this.disconnectXenServer(id)::ignoreErrors()

    if (!(await this._servers.remove(id))) {
      throw noSuchObject(id, 'xenServer')
    }
  }

  async updateXenServer(id, { allowUnauthorized, enabled, error, host, label, password, readOnly, username }) {
    const server = await this._getXenServer(id)
    const xapi = this._xapis[id]
    const requireDisconnected =
      allowUnauthorized !== undefined || host !== undefined || password !== undefined || username !== undefined

    if (requireDisconnected && xapi !== undefined && xapi.status !== 'disconnected') {
      throw new Error('this entry require disconnecting the server to update it')
    }

    if (label !== undefined) server.set('label', label || undefined)
    if (host) server.set('host', host)
    if (username) server.set('username', username)
    if (password) server.set('password', password)

    if (error !== undefined) {
      server.set('error', error)
    }

    if (enabled !== undefined) {
      server.set('enabled', enabled)
    }

    if (readOnly !== undefined) {
      server.set('readOnly', readOnly)
      if (xapi !== undefined) {
        xapi.readOnly = readOnly
      }
    }

    if (allowUnauthorized !== undefined) {
      server.set('allowUnauthorized', allowUnauthorized)
    }

    await this._servers.update(server)
  }

  async getXenServer(id) {
    return (await this._getXenServer(id)).properties
  }

  // TODO: this method will no longer be async when servers are
  // integrated to the main collection.
  async _getXenServer(id) {
    const server = await this._servers.first(id)
    if (server === undefined) {
      throw noSuchObject(id, 'xenServer')
    }

    return server
  }

  getXenServerIdByObject(object, type) {
    if (typeof object === 'string') {
      object = this._xo.getObject(object, type)
    }
    const { $pool: poolId } = object
    if (!poolId) {
      throw new Error(`object ${object.id} does not belong to a pool`)
    }

    const serverId = this._serverIdsByPool[poolId]
    if (serverId === undefined) {
      throw new Error(`no connection found for object ${object.id}`)
    }
    return serverId
  }

  _onXenAdd(newXapiObjects, xapiIdsToXo, toRetry, conId, dependents, xapiObjects) {
    const conflicts = this._objectConflicts
    const objects = this._xo._objects

    const serverIdsByPool = this._serverIdsByPool
    forEach(newXapiObjects, function handleObject(xapiObject, xapiId) {
      // handle pool UUID change
      if (xapiObject.$type === 'pool' && serverIdsByPool[xapiObject.$id] === undefined) {
        const obsoletePoolId = findKey(serverIdsByPool, serverId => serverId === conId)
        delete serverIdsByPool[obsoletePoolId]
        serverIdsByPool[xapiObject.$id] = conId
      }

      const { $ref } = xapiObject

      const dependent = dependents[$ref]
      if (dependent !== undefined) {
        delete dependents[$ref]
        return handleObject(xapiObjects[dependent], dependent)
      }

      try {
        const xoObject = xapiObjectToXo(xapiObject, dependents)
        if (!xoObject) {
          return
        }

        const xoId = xoObject.id
        xapiIdsToXo[xapiId] = xoId

        const previous = objects.get(xoId, undefined)
        if (previous && previous._xapiRef !== $ref) {
          const conflicts_ = conflicts[xoId] || (conflicts[xoId] = { __proto__: null })
          conflicts_[conId] = xoObject
        } else {
          objects.set(xoId, xoObject)
        }
      } catch (error) {
        log.error('xapiObjectToXo', { error })

        toRetry[xapiId] = xapiObject
      }
    })
  }

  _onXenRemove(xapiObjects, xapiIdsToXo, toRetry, conId) {
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

  async connectXenServer(id) {
    const server = await this.getXenServer(id)

    if (this._getXenServerStatus(id) !== 'disconnected') {
      throw new Error('the server is already connected')
    }

    const xapi = (this._xapis[server.id] = new Xapi({
      allowUnauthorized: server.allowUnauthorized,
      readOnly: server.readOnly,

      ...this._xapiOptions,

      auth: {
        user: server.username,
        password: server.password,
      },
      url: server.host,
      watchEvents: false,
    }))

    try {
      await xapi.connect()

      // requesting disconnection on the connecting server
      if (this._xapis[server.id] === undefined) {
        xapi.disconnect()::ignoreErrors()
        return
      }

      const serverIdsByPool = this._serverIdsByPool
      const poolId = xapi.pool.$id
      if (serverIdsByPool[poolId] !== undefined) {
        throw new PoolAlreadyConnected(poolId, serverIdsByPool[poolId], server.id)
      }

      serverIdsByPool[poolId] = server.id

      xapi.xo = (() => {
        const conId = server.id

        // Maps ids of XAPI objects to ids of XO objects.
        const xapiIdsToXo = { __proto__: null }

        // Map of XAPI objects which failed to be transformed to XO
        // objects.
        //
        // At each `finish` there will be another attempt to transform
        // until they succeed.
        let toRetry
        let toRetryNext = { __proto__: null }

        const dependents = { __proto__: null }

        const onAddOrUpdate = objects => {
          this._onXenAdd(objects, xapiIdsToXo, toRetryNext, conId, dependents, xapi.objects.all)
        }
        const onRemove = objects => {
          this._onXenRemove(objects, xapiIdsToXo, toRetry, conId, dependents)
        }

        const onFinish = () => {
          if (!isEmpty(toRetry)) {
            onAddOrUpdate(toRetry)
            toRetry = null
          }

          if (!isEmpty(toRetryNext)) {
            toRetry = toRetryNext
            toRetryNext = { __proto__: null }
          }
        }

        const { objects } = xapi

        const addObject = object => {
          // TODO: optimize.
          onAddOrUpdate({ [object.$id]: object })
          return xapiObjectToXo(object, dependents)
        }

        return {
          httpRequest: this._xo.httpRequest.bind(this),

          install() {
            objects.on('add', onAddOrUpdate)
            objects.on('update', onAddOrUpdate)
            objects.on('remove', onRemove)
            objects.on('finish', onFinish)

            onAddOrUpdate(objects.all)
          },
          uninstall() {
            objects.removeListener('add', onAddOrUpdate)
            objects.removeListener('update', onAddOrUpdate)
            objects.removeListener('remove', onRemove)
            objects.removeListener('finish', onFinish)

            onRemove(objects.all)
          },

          addObject,
          getData: (id, key) => {
            const value = (typeof id === 'string' ? xapi.getObject(id) : id).other_config[`xo:${camelToSnakeCase(key)}`]
            return value && JSON.parse(value)
          },
          setData: async (id, key, value) => {
            key = `xo:${camelToSnakeCase(key)}`
            value = value !== null ? JSON.stringify(value) : value

            const object = await xapi.getObject(id)
            if (object.other_config[key] === (value === null ? undefined : value)) {
              return
            }

            await object.update_other_config(key, value)

            // Register the updated object.
            addObject(await xapi._waitObject(id))
          },
        }
      })()

      xapi.xo.install()
      xapi.watchEvents()

      this.updateXenServer(id, { error: null })::ignoreErrors()

      xapi.once('disconnected', () => {
        xapi.xo.uninstall()
        delete this._xapis[server.id]
        delete this._serverIdsByPool[poolId]
        this._xo.emit('server:disconnected', { server, xapi })
      })
      this._xo.emit('server:connected', { server, xapi })
    } catch (error) {
      delete this._xapis[server.id]
      xapi.disconnect()::ignoreErrors()
      this.updateXenServer(id, { error })::ignoreErrors()
      throw error
    }
  }

  async disconnectXenServer(id) {
    const status = this._getXenServerStatus(id)
    if (status === 'disconnected') {
      return
    }

    const xapi = this._xapis[id]
    delete this._xapis[id]

    return xapi.disconnect()
  }

  getAllXapis() {
    return this._xapis
  }

  // Returns the XAPI connection associated to an object.
  getXapi(object, type) {
    return this._xapis[this.getXenServerIdByObject(object, type)]
  }

  // returns the XAPI object corresponding to an XO object/ID
  getXapiObject(xoObjectOrId, type) {
    const xoObject = typeof xoObjectOrId === 'string' ? this._xo.getObject(xoObjectOrId, type) : xoObjectOrId
    return this.getXapi(xoObject).getObjectByRef(xoObject._xapiRef)
  }

  _getXenServerStatus(id) {
    const xapi = this._xapis[id]
    return xapi === undefined
      ? 'disconnected'
      : this._serverIdsByPool[xapi.pool?.$id] === id
      ? 'connected'
      : 'connecting'
  }

  async getAllXenServers() {
    const servers = await this._servers.get()
    const xapis = this._xapis
    forEach(servers, server => {
      const lastEventFetchedTimestamp = xapis[server.id]?.lastEventFetchedTimestamp
      if (
        lastEventFetchedTimestamp !== undefined &&
        Date.now() > lastEventFetchedTimestamp + this._xapiMarkDisconnectedDelay
      ) {
        server.error = xapis[server.id].watchEventsError
      }
      server.status = this._getXenServerStatus(server.id)
      if (server.status === 'connected') {
        server.poolId = xapis[server.id].pool.uuid
      }

      // Do not expose password.
      delete server.password
    })

    return servers
  }

  getXapiVmStats(vmId, granularity) {
    return this._stats.getVmStats(this.getXapi(vmId), vmId, granularity)
  }

  getXapiHostStats(hostId, granularity) {
    return this._stats.getHostStats(this.getXapi(hostId), hostId, granularity)
  }

  getXapiSrStats(srId, granularity) {
    return this._stats.getSrStats(this.getXapi(srId), srId, granularity)
  }

  async mergeXenPools(sourcePoolId, targetPoolId, force = false) {
    const sourceXapi = this.getXapi(sourcePoolId)
    const {
      _auth: { user, password },
      _url: { hostname },
    } = this.getXapi(targetPoolId)

    // We don't want the events of the source XAPI to interfere with
    // the events of the new XAPI.
    sourceXapi.xo.uninstall()

    try {
      await sourceXapi.joinPool(hostname, user, password, force)
    } catch (e) {
      sourceXapi.xo.install()

      throw e
    }

    this.unregisterXenServer(this._serverIdsByPool[sourcePoolId])::ignoreErrors()
  }

  async detachHostFromPool(hostId) {
    const xapi = this.getXapi(hostId)
    const poolId = xapi.pool.$id
    const { address } = xapi.getObject(hostId)

    await xapi.ejectHostFromPool(hostId)

    this.getXenServer(this._serverIdsByPool[poolId])
      .then(async properties => {
        const { id } = await this.registerXenServer({
          ...properties,
          host: address,
        })

        for (const delay of fibonacci()
          .take(5)
          .toMs()
          .map(d => d * 60)) {
          await pDelay(delay)
          try {
            await this.connectXenServer(id)
            break
          } catch (error) {
            if (!(error instanceof PoolAlreadyConnected) && error.code !== 'EHOSTUNREACH') {
              throw error
            }
          }
        }
      })
      ::ignoreErrors()
  }
}
