import assert from 'assert'
import findKey from 'lodash/findKey.js'
import pick from 'lodash/pick.js'
import { asyncEach } from '@vates/async-each'
import { BaseError } from 'make-error'
import { createLogger } from '@xen-orchestra/log'
import { createPredicate } from 'value-matcher'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { fibonacci } from 'iterable-backoff'
import { networkInterfaces } from 'os'
import { noSuchObject, incorrectState } from 'xo-common/api-errors.js'
import { parseDuration } from '@vates/parse-duration'
import { pDelay, ignoreErrors } from 'promise-toolbox'

import * as XenStore from '../_XenStore.mjs'
import Xapi from '../xapi/index.mjs'
import xapiObjectToXo from '../xapi-object-to-xo.mjs'
import XapiStats from '../xapi-stats.mjs'
import { camelToSnakeCase, forEach, isEmpty, popProperty } from '../utils.mjs'
import { Servers } from '../models/server.mjs'

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
export default class XenServers {
  constructor(app, { safeMode }) {
    this._objectConflicts = { __proto__: null } // TODO: clean when a server is disconnected.
    this._serverIdsByPool = { __proto__: null }
    this._stats = new XapiStats()
    this._xapis = { __proto__: null }
    this._app = app

    app.config.watchDuration('xapiMarkDisconnectedDelay', xapiMarkDisconnectedDelay => {
      this._xapiMarkDisconnectedDelay = xapiMarkDisconnectedDelay
    })

    app.hooks.on('clean', () => this._servers.rebuildIndexes())

    const connectServers = async () => {
      // Connects to existing servers.
      for (const server of await this._servers.get()) {
        if (server.enabled) {
          this.connectXenServer(server.id).catch(error => {
            log.warn('failed to connect to XenServer', {
              host: server.host,
              error,
            })
          })
        }
      }
    }
    app.hooks.on('core started', () => {
      const serversDb = (this._servers = new Servers({
        connection: app._redis,
        namespace: 'server',
        indexes: ['host'],
      }))

      app.addConfigManager(
        'xenServers',
        () => serversDb.get(),
        servers => serversDb.update(servers).then(connectServers)
      )
    })
    app.hooks.on('start', async () => {
      // Add servers in XenStore
      if (!(await this._servers.exists())) {
        const key = 'vm-data/xen-servers'
        const xenStoreServers = await XenStore.read(key)
          .then(JSON.parse)
          .catch(() => [])
        for (const server of xenStoreServers) {
          await this.registerXenServer(server)
        }
        ignoreErrors.call(XenStore.rm(key))
      }

      if (!safeMode) {
        await connectServers()
      }
    })

    this._applianceUuid = Math.random().toString(36).slice(2)
    app.hooks.on('start', async () => {
      const value = (await XenStore.read('vm')).trim()
      assert(value.startsWith('/vm/'))
      this._applianceUuid = value.slice(4)
    })

    // TODO: disconnect servers on stop.
  }

  async registerXenServer({ allowUnauthorized = false, host, label, password, readOnly = false, username, httpProxy }) {
    // FIXME: We are storing passwords which is bad!
    //        Could we use tokens instead?
    // TODO: use plain objects
    const server = await this._servers.create({
      allowUnauthorized,
      enabled: true,
      host,
      httpProxy,
      label,
      password,
      readOnly,
      username,
    })

    return server
  }

  async unregisterXenServer(id) {
    await this.disconnectXenServer(id)

    if (!(await this._servers.remove(id))) {
      throw noSuchObject(id, 'xenServer')
    }
  }

  async updateXenServer(id, properties) {
    const server = await this.getXenServerWithCredentials(id)
    const xapi = this._xapis[id]

    const requireDisconnected = ['allowUnauthorized', 'host', 'httpProxy', 'password', 'username'].some(
      key => properties[key] !== undefined
    )
    if (requireDisconnected && xapi !== undefined && xapi.status !== 'disconnected') {
      throw new Error('this entry require disconnecting the server to update it')
    }

    let hasChanged = false

    for (const key of [
      'allowUnauthorized',
      'enabled',
      'error',
      'host',
      'httpProxy',
      'label',
      'password',
      'poolNameDescription',
      'poolNameLabel',
      'username',
    ]) {
      let value = properties[key]
      if (value !== undefined) {
        // if value is falsish pass undefined to the model to delete this property
        if (value === null || value === '') {
          value = undefined
        }
        if (value !== server[key]) {
          server[key] = value
          hasChanged = true
        }
      }
    }

    // special handling for readOnly
    const { readOnly } = properties
    if (readOnly !== undefined && readOnly !== server.readOnly) {
      server.readOnly = readOnly
      if (xapi !== undefined) {
        xapi.readOnly = readOnly
      }
      hasChanged = true
    }

    if (hasChanged) {
      await this._servers.update(server)
    }
  }

  async getXenServerWithCredentials(id) {
    const server = await this._servers.first(id)
    if (server === undefined) {
      throw noSuchObject(id, 'xenServer')
    }

    return server
  }

  getXenServerIdByObject(object, type) {
    if (typeof object === 'string') {
      object = this._app.getObject(object, type)
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
    const objects = this._app._objects

    const serverIdsByPool = this._serverIdsByPool
    const self = this

    forEach(newXapiObjects, function handleObject(xapiObject, xapiId) {
      // handle pool UUID change
      if (xapiObject.$type === 'pool' && serverIdsByPool[xapiObject.$id] === undefined) {
        const obsoletePoolId = findKey(serverIdsByPool, serverId => serverId === conId)
        delete serverIdsByPool[obsoletePoolId]
        serverIdsByPool[xapiObject.$id] = conId
      }

      // save pool name and description in server properties
      if (xapiObject.$type === 'pool') {
        self
          .updateXenServer(serverIdsByPool[xapiId], {
            poolNameDescription: xapiObject.name_description,
            poolNameLabel: xapiObject.name_label,
          })
          ::ignoreErrors()
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
        // only log the error if the object was already in `toRetry`
        //
        // otherwise there will be too many logs, some of them irrelevant (transient
        // and simply due to the order objects are processed)
        if (xapiId in toRetry) {
          const { $pool, $ref, $type, uuid } = xapiObject
          log.error('xapiObjectToXo', {
            error,
            xapiObject: { $pool: pick($pool, ['$ref', 'uuid']), $ref, $type, uuid },
          })
        }

        toRetry[xapiId] = xapiObject
      }
    })
  }

  _onXenRemove(xapiObjects, xapiIdsToXo, toRetry, conId) {
    const conflicts = this._objectConflicts
    const objects = this._app._objects

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
    const server = await this.getXenServerWithCredentials(id)
    const serverStatus = this._getXenServerStatus(id)
    if (serverStatus !== 'disconnected') {
      /* throw */ incorrectState({
        actual: serverStatus,
        expected: 'disconnected',
        object: server.id,
        property: 'status',
      })
    }
    await this.updateXenServer(id, { enabled: true })

    const { config } = this._app

    let { poolMarkingInterval, poolMarkingMaxAge, poolMarkingPrefix, ...xapiOptions } = config.get('xapiOptions')
    poolMarkingInterval = parseDuration(poolMarkingInterval)
    poolMarkingMaxAge = parseDuration(poolMarkingMaxAge)

    const xapi = (this._xapis[server.id] = new Xapi({
      allowUnauthorized: server.allowUnauthorized,
      readOnly: server.readOnly,

      ...xapiOptions,
      httpProxy: server.httpProxy,
      guessVhdSizeOnImport: config.get('guessVhdSizeOnImport'),

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

        const markPool = async () => {
          const now = Date.now()

          // cannot mark the pool if it is read-only
          if (xapi.readOnly) {
            return
          }

          const { pool } = xapi

          try {
            await asyncEach(Object.entries(pool.other_config), ([key, value]) => {
              if (key.startsWith(poolMarkingPrefix)) {
                const { lastConnected } = JSON.parse(value)
                if (now - lastConnected > poolMarkingMaxAge) {
                  return pool.update_other_config(key, null)
                }
              }
            })

            const publicUrl = config.getOptional('http.publicUrl')
            const info = {
              lastConnected: now,
              publicUrl,
            }
            if (publicUrl === undefined) {
              info.networkInterfaces = networkInterfaces()
              delete info.networkInterfaces.lo
            }

            await pool.update_other_config(poolMarkingPrefix + this._applianceUuid, JSON.stringify(info))
          } catch (error) {
            log.warn('markPool', { error })
          }
        }
        let markPoolHandle

        return {
          httpRequest: this._app.httpRequest.bind(this),

          install() {
            objects.on('add', onAddOrUpdate)
            objects.on('update', onAddOrUpdate)
            objects.on('remove', onRemove)
            objects.on('finish', onFinish)

            onAddOrUpdate(objects.all)

            markPool()
            markPoolHandle = setInterval(markPool, poolMarkingInterval)
          },
          uninstall() {
            clearInterval(markPoolHandle)

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
            xapi.waitObject(id, addObject)
          },
          getXenServerIdByObject: this.getXenServerIdByObject.bind(this),
          getXenServerWithCredentials: this.getXenServerWithCredentials.bind(this),
        }
      })()

      xapi.xo.install()
      xapi.watchEvents()

      this.updateXenServer(id, { error: null })::ignoreErrors()

      xapi.once('eventFetchingError', function eventFetchingErrorListener() {
        const timeout = setTimeout(() => {
          xapi.xo.uninstall()

          // switch server status from connected to connecting
          delete serverIdsByPool[poolId]
        }, this._xapiMarkDisconnectedDelay)
        xapi.once('eventFetchingSuccess', () => {
          xapi.once('eventFetchingError', eventFetchingErrorListener)
          if (serverIdsByPool[poolId] === undefined) {
            serverIdsByPool[poolId] = server.id
            xapi.xo.install()
          } else {
            clearTimeout(timeout)
          }
        })
      })

      xapi.once('disconnected', () => {
        xapi.xo.uninstall()
        delete this._xapis[server.id]
        delete this._serverIdsByPool[poolId]
        this._app.emit('server:disconnected', { server, xapi })
      })
      this._app.emit('server:connected', { server, xapi })
    } catch (error) {
      delete this._xapis[server.id]
      xapi.disconnect()::ignoreErrors()
      this.updateXenServer(id, { error })::ignoreErrors()
      throw error
    }
  }

  async disconnectXenServer(id) {
    // throw no such object if the server does not exist
    const server = await this.getXenServer(id)
    const status = this._getXenServerStatus(id)
    if (status === 'disconnected' && !server.enabled) {
      /* throw */ incorrectState({
        actual: status,
        expected: ['connected', 'connecting'],
        object: id,
        property: 'status',
      })
    }
    await this.updateXenServer(id, { enabled: false })

    /**
     * if the server is enabled but disconnected, xapi is undefined
     * @type {Xapi | undefined}
     */
    const xapi = this._xapis[id]
    delete this._xapis[id]

    const serverIdsByPool = this._serverIdsByPool
    const poolId = findKey(serverIdsByPool, _ => _ === xapi)
    if (poolId !== undefined) {
      delete serverIdsByPool[id]
    }

    return xapi?.disconnect()
  }

  getAllXapis() {
    return this._xapis
  }

  // Returns the XAPI connection associated to an object.
  getXapi(object, type) {
    return this._xapis[this.getXenServerIdByObject(object, type)]
  }

  // returns the XAPI object corresponding to an XO object/ID
  getXapiObject(xoObjectOrId, xoType) {
    const xoObject = typeof xoObjectOrId === 'string' ? this._app.getObject(xoObjectOrId, xoType) : xoObjectOrId
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

  _decorateXenServer(server) {
    const xapis = this._xapis

    const lastEventFetchedTimestamp = xapis[server.id]?.lastEventFetchedTimestamp
    if (
      lastEventFetchedTimestamp !== undefined &&
      Date.now() > lastEventFetchedTimestamp + this._xapiMarkDisconnectedDelay
    ) {
      server.error = xapis[server.id].watchEventsError
    }
    server.status = this._getXenServerStatus(server.id)
    if (server.status === 'connected') {
      const xapi = xapis[server.id]
      server.poolId = xapi.pool.uuid
      try {
        server.master = xapi.getObjectByRef(xapi.pool.master).uuid
      } catch (error) {
        // Hosts may not be loaded
        if (!noSuchObject.is(error)) {
          throw error
        }
      }
    }
    if (server.label === undefined) {
      server.label = server.poolNameLabel
    }

    // Do not expose password.
    delete server.password
  }

  async getAllXenServers() {
    const servers = await this._servers.get()
    servers.forEach(this._decorateXenServer, this)
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

  async getXenServer(id) {
    const server = await this.getXenServerWithCredentials(id)
    this._decorateXenServer(server)
    return server
  }

  async mergeXenPools(sourcePoolId, targetPoolId, force = false) {
    const sourceXapi = this.getXapi(sourcePoolId)
    const {
      _auth: { user, password },
      _url: { hostnameRaw },
    } = this.getXapi(targetPoolId)

    // We don't want the events of the source XAPI to interfere with
    // the events of the new XAPI.
    sourceXapi.xo.uninstall()

    try {
      await sourceXapi.joinPool(hostnameRaw, user, password, force)
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

    this.getXenServerWithCredentials(this._serverIdsByPool[poolId])
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

  async rollingPoolUpdate($defer, pool, { rebootVm, parentTask } = {}) {
    const app = this._app
    await app.checkFeatureAuthorization('ROLLING_POOL_UPDATE')
    const [schedules, jobs] = await Promise.all([app.getAllSchedules(), app.getAllJobs('backup')])

    const poolId = pool.id

    const jobsOfthePool = []
    jobs.forEach(({ id: jobId, vms }) => {
      if (vms.id !== undefined) {
        for (const vmId of extractIdsFromSimplePattern(vms)) {
          // try/catch to avoid `no such object`
          try {
            if (app.getObject(vmId).$poolId === poolId) {
              jobsOfthePool.push(jobId)
              break
            }
          } catch {}
        }
      } else {
        // Smart mode
        // For smart mode, we take a simplified approach:
        // - if smart mode is explicitly 'resident' or 'not resident' on pools, we
        //   check if it concerns this pool
        // - if not, the job may concern this pool so we add it to `jobsOfThePool`
        if (vms.$pool === undefined || createPredicate(vms.$pool)(poolId)) {
          jobsOfthePool.push(jobId)
        }
      }
    })

    // Disable schedules
    await Promise.all(
      schedules
        .filter(schedule => jobsOfthePool.includes(schedule.jobId) && schedule.enabled)
        .map(async schedule => {
          await app.updateSchedule({ ...schedule, enabled: false })
          $defer(() => app.updateSchedule({ ...schedule, enabled: true }))
        })
    )

    // Disable load balancer
    if ((await app.getOptionalPlugin('load-balancer'))?.loaded) {
      await app.unloadPlugin('load-balancer')
      $defer(() => app.loadPlugin('load-balancer'))
    }

    const xapi = this.getXapi(pool)
    if (await xapi.getField('pool', pool._xapiRef, 'wlb_enabled')) {
      await xapi.call('pool.set_wlb_enabled', pool._xapiRef, false)
      $defer(() => xapi.call('pool.set_wlb_enabled', pool._xapiRef, true))
    }

    const hasParentTask = parentTask !== undefined
    let task = parentTask
    const fn = async () =>
      this.getXapi(pool).rollingPoolUpdate(task, {
        xsCredentials: app.apiContext.user.preferences.xsCredentials,
        rebootVm,
      })

    if (!hasParentTask) {
      task = app.tasks.create({
        name: `Rolling pool update`,
        poolId,
        poolName: pool.name_label,
        progress: 0,
      })
      await task.run(fn)
    } else {
      await fn()
    }
  }
}

decorateClass(XenServers, {
  rollingPoolUpdate: defer,
})
