import createLogger from '@xen-orchestra/log'
import XoCollection from 'xo-collection'
import XoUniqueIndex from 'xo-collection/unique-index'
import mixin from '@xen-orchestra/mixin'
import { createClient as createRedisClient } from 'redis'
import { EventEmitter } from 'events'
import { noSuchObject } from 'xo-common/api-errors'
import { forEach, includes, isEmpty, iteratee, map as mapToArray, stubTrue } from 'lodash'

import mixins from './xo-mixins'
import Connection from './connection'
import { generateToken, noop } from './utils'

// ===================================================================

const log = createLogger('xo:xo')

@mixin(mapToArray(mixins))
export default class Xo extends EventEmitter {
  constructor(config) {
    super()

    // a lot of mixins adds listener for start/stop/… events
    this.setMaxListeners(0)

    this._config = config

    this._objects = new XoCollection()
    this._objects.createIndex('byRef', new XoUniqueIndex('_xapiRef'))

    // Connections to users.
    this._nextConId = 0
    this._connections = { __proto__: null }

    this._httpRequestWatchers = { __proto__: null }

    // Connects to Redis.
    {
      const { renameCommands, socket: path, uri: url } = config.redis || {}

      this._redis = createRedisClient({
        path,
        rename_commands: renameCommands,
        url,
      })
    }

    this.on('start', () => this._watchObjects())
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

  // -----------------------------------------------------------------

  createUserConnection() {
    const { _connections: connections } = this

    const connection = new Connection()
    const id = (connection.id = this._nextConId++)

    connections[id] = connection
    connection.on('close', () => {
      delete connections[id]
    })

    return connection
  }

  // -----------------------------------------------------------------

  _handleHttpRequest(req, res, next) {
    const { url } = req

    const { _httpRequestWatchers: watchers } = this
    const watcher = watchers[url]
    if (!watcher) {
      next()
      return
    }
    if (!watcher.persistent) {
      delete watchers[url]
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
            result.pipe(res)
          } else {
            res.end(JSON.stringify(result))
          }
        }
      },
      error => {
        log.error('HTTP request error', { error })

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
    let url

    do {
      url = `/api/${await generateToken()}${suffix}`
    } while (url in watchers)

    watchers[url] = {
      data,
      fn,
    }
    return url
  }

  async registerHttpRequestHandler(url, fn, { data = undefined, persistent = true } = {}) {
    const { _httpRequestWatchers: watchers } = this

    if (url in watchers) {
      throw new Error(`a handler is already registered for ${url}`)
    }

    watchers[url] = {
      data,
      fn,
      persistent,
    }
  }

  async unregisterHttpRequestHandler(url) {
    delete this._httpRequestWatchers[url]
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
    const { _connections: connections, _objects: objects } = this

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

      forEach(connections, connection => {
        // Notifies only authenticated clients.
        if (connection.has('user_id') && connection.notify) {
          if (enteredMessage) {
            connection.notify('all', enteredMessage)
          }
          if (exitedMessage) {
            connection.notify('all', exitedMessage)
          }
        }
      })

      reset()
    })
  }
}
