import Config from '@xen-orchestra/mixins/Config.mjs'
import forEach from 'lodash/forEach.js'
import Hooks from '@xen-orchestra/mixins/Hooks.mjs'
import HttpProxy from '@xen-orchestra/mixins/HttpProxy.mjs'
import includes from 'lodash/includes.js'
import isEmpty from 'lodash/isEmpty.js'
import iteratee from 'lodash/iteratee.js'
import mixin from '@xen-orchestra/mixin'
import mixinLegacy from '@xen-orchestra/mixin/legacy.js'
import once from 'lodash/once.js'
import stubTrue from 'lodash/stubTrue.js'
import SslCertificate from '@xen-orchestra/mixins/SslCertificate.mjs'
import Tasks from '@xen-orchestra/mixins/Tasks.mjs'
import { Collection as XoCollection } from 'xo-collection'
import { Index } from 'xo-collection/index.js'
import { createClient as createRedisClient } from 'redis'
import { createDebounceResource } from '@vates/disposable/debounceResource.js'
import { createLogger } from '@xen-orchestra/log'
import { EventEmitter } from 'events'
import { noSuchObject } from 'xo-common/api-errors.js'
import { parseDuration } from '@vates/parse-duration'
import { pipeline } from 'node:stream'
import { UniqueIndex as XoUniqueIndex } from 'xo-collection/unique-index.js'

import mixins from './xo-mixins/index.mjs'
import { generateToken, noop } from './utils.mjs'

// ===================================================================

const log = createLogger('xo:xo')

@mixinLegacy(Object.values(mixins))
export default class Xo extends EventEmitter {
  constructor(opts) {
    super()

    mixin(this, { Config, Hooks, HttpProxy, SslCertificate, Tasks }, [opts])
    // a lot of mixins adds listener for start/stop/… events
    this.hooks.setMaxListeners(0)

    const { config } = opts

    this._objects = new XoCollection()
    this._objects.createIndex('byRef', new XoUniqueIndex('_xapiRef'))
    this._objects.createIndex('type', new Index('type'))

    this._httpRequestWatchers = { __proto__: null }

    // Connects to Redis.
    {
      const { socket: path, uri: url } = config.redis || {}
      const redis = createRedisClient({ socket: { path }, url })
      redis.on('error', error => {
        log.warn('redis error', { error })
      })

      this._redis = redis
      this.hooks.on('start core', () => redis.connect())
      this.hooks.on('stop core', () => redis.quit())
    }

    this.hooks.on('start', () => this._watchObjects())

    const debounceResource = createDebounceResource()
    debounceResource.defaultDelay = parseDuration(config.resourceCacheDelay)
    this.hooks.on('stop', debounceResource.flushAll)

    this.debounceResource = debounceResource

    this.version = opts.appVersion
  }

  get objects() {
    return this._objects
  }

  // -----------------------------------------------------------------

  // Returns an object from its key or UUID.
  getObject(key, type) {
    const {
      all,
      indexes: { byRef },
    } = this._objects

    const obj = all[key] || byRef[key]
    if (!obj) {
      throw noSuchObject(key, type)
    }

    if (
      type != null &&
      ((typeof type === 'string' && type !== obj.type) || !includes(type, obj.type)) // Array
    ) {
      throw noSuchObject(key, type)
    }

    return obj
  }

  hasObject(key, type) {
    try {
      return this.getObject(key, type) !== undefined
    } catch (_) {
      return false
    }
  }

  getObjects({ filter, limit } = {}) {
    const { all } = this._objects

    if (filter === undefined) {
      if (limit === undefined || limit === Infinity) {
        return all
      }
      filter = stubTrue
    } else {
      filter = iteratee(filter)
      if (limit === undefined) {
        limit = Infinity
      }
    }

    const results = { __proto__: null }
    for (const id in all) {
      const object = all[id]
      if (filter(object, id, all)) {
        if (limit-- <= 0) {
          break
        }
        results[id] = object
      }
    }
    return results
  }

  getObjectsByType(type, { filter, limit } = {}) {
    const objects = this._objects.indexes.type[type]

    if (filter === undefined) {
      if (limit === undefined || limit === Infinity) {
        return objects
      }
      filter = stubTrue
    } else {
      filter = iteratee(filter)
      if (limit === undefined) {
        limit = Infinity
      }
    }

    const results = { __proto__: null }
    for (const id in objects) {
      const object = objects[id]
      if (filter(object, id, objects)) {
        if (limit-- <= 0) {
          break
        }
        results[id] = object
      }
    }
    return results
  }

  // -----------------------------------------------------------------

  _handleHttpRequest(req, res, next) {
    const { path } = req

    const { _httpRequestWatchers: watchers } = this
    const watcher = watchers[path]
    if (!watcher) {
      next()
      return
    }
    if (!watcher.persistent) {
      delete watchers[path]
    }

    const { fn, data } = watcher
    new Promise(resolve => {
      resolve(fn.call(this, req, res, data, next))
    }).then(
      result => {
        if (result != null) {
          if (typeof result === 'string' || Buffer.isBuffer(result)) {
            res.end(result)
          } else if (typeof result.pipe === 'function') {
            pipeline(result, res, noop)
          } else {
            res.end(JSON.stringify(result))
          }
        }
      },
      error => {
        log.error('HTTP request error', {
          data,
          error,
          fn: fn.name,
        })

        if (!res.headersSent) {
          res.writeHead(500)
          res.write('unknown error')
        }
        res.end()
      }
    )
  }

  async registerHttpRequest(fn, data, { suffix = '' } = {}) {
    const { _httpRequestWatchers: watchers } = this
    let path

    do {
      path = `/api/${await generateToken()}${suffix}`
    } while (path in watchers)

    watchers[path] = {
      data,
      fn,
    }
    return path
  }

  async registerHttpRequestHandler(path, fn, { data = undefined, persistent = true } = {}) {
    const { _httpRequestWatchers: watchers } = this

    if (path in watchers) {
      throw new Error(`a handler is already registered for ${path}`)
    }

    watchers[path] = {
      data,
      fn,
      persistent,
    }

    return once(() => {
      delete this._httpRequestWatchers[path]
    })
  }

  // -----------------------------------------------------------------

  // Plugins can use this method to expose methods directly on XO.
  defineProperty(name, value, thisArg = null) {
    if (name in this) {
      throw new Error(`Xo#${name} is already defined`)
    }

    // For security, prevent from accessing `this`.
    if (typeof value === 'function') {
      value = (value =>
        function () {
          return value.apply(thisArg, arguments)
        })(value)
    }

    Object.defineProperty(this, name, {
      configurable: true,
      value,
    })

    let unset = () => {
      delete this[name]
      unset = noop
    }
    return () => unset()
  }

  // Convenience method to define multiple properties at once.
  defineProperties(props, thisArg) {
    const unsets = []
    const unset = () => forEach(unsets, unset => unset())

    try {
      forEach(props, (value, name) => {
        unsets.push(this.defineProperty(name, value, thisArg))
      })
    } catch (error) {
      unset()
      throw error
    }

    return unset
  }

  // -----------------------------------------------------------------

  // Watches objects changes.
  //
  // Some should be forwarded to connected clients.
  // Some should be persistently saved.
  _watchObjects() {
    const { _objects: objects } = this

    let entered, exited
    function reset() {
      entered = { __proto__: null }
      exited = { __proto__: null }
    }
    reset()

    function onAdd(items) {
      forEach(items, (item, id) => {
        entered[id] = item
      })
    }
    objects.on('add', onAdd)
    objects.on('update', onAdd)

    objects.on('remove', items => {
      forEach(items, (_, id) => {
        // We don't care about the value here, so we choose `0`
        // because it is small in JSON.
        exited[id] = 0
      })
    })

    objects.on('finish', () => {
      const enteredMessage = !isEmpty(entered) && {
        type: 'enter',
        items: entered,
      }
      const exitedMessage = !isEmpty(exited) && {
        type: 'exit',
        items: exited,
      }

      if (!enteredMessage && !exitedMessage) {
        return
      }

      for (const connection of this.apiConnections) {
        // Notifies only authenticated clients.
        if (connection.has('user_id') && connection.notify) {
          if (enteredMessage) {
            connection.notify('all', enteredMessage)
          }
          if (exitedMessage) {
            connection.notify('all', exitedMessage)
          }
        }
      }

      reset()
    })
  }
}
