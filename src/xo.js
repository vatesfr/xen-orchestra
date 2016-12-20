import includes from 'lodash/includes'
import XoCollection from 'xo-collection'
import XoUniqueIndex from 'xo-collection/unique-index'
import {createClient as createRedisClient} from 'redis'
import {EventEmitter} from 'events'
import { noSuchObject } from 'xo-common/api-errors'

import mixins from './xo-mixins'
import Connection from './connection'
import LevelDbLogger from './loggers/leveldb'
import {
  mixin
} from './decorators'
import {
  createRawObject,
  forEach,
  generateToken,
  isEmpty,
  isFunction,
  isString,
  mapToArray,
  noop
} from './utils'

// ===================================================================

@mixin(mapToArray(mixins))
export default class Xo extends EventEmitter {
  constructor (config) {
    super()

    this._config = config

    this._objects = new XoCollection()
    this._objects.createIndex('byRef', new XoUniqueIndex('_xapiRef'))

    // Connections to users.
    this._nextConId = 0
    this._connections = createRawObject()

    this._httpRequestWatchers = createRawObject()

    // Connects to Redis.
    const redisConf = config.redis
    this._redis = createRedisClient(redisConf && {
      rename_commands: redisConf.renameCommands,
      url: redisConf.uri
    })
  }

  // -----------------------------------------------------------------

  async clean () {
    const handleCleanError = error => {
      console.error(
        '[WARN] clean error:',
        error && error.stack || error
      )
    }
    await Promise.all(mapToArray(
      this.listeners('clean'),

      listener => new Promise(resolve => {
        resolve(listener.call(this))
      }).catch(handleCleanError)
    ))
  }

  // -----------------------------------------------------------------

  async start () {
    this.start = noop

    this._watchObjects()

    // ---------------------------------------------------------------

    const handleStartError = error => {
      console.error(
        '[WARN] start error:',
        error && error.stack || error
      )
    }
    await Promise.all(mapToArray(
      this.listeners('start'),

      listener => new Promise(resolve => {
        resolve(listener.call(this))
      }).catch(handleStartError)
    ))
    this.removeAllListeners('start')

    this.emit('started')
    this.removeAllListeners('started')
  }

  // -----------------------------------------------------------------

  async stop () {
    this.stop = noop

    const handleStopError = error => {
      console.error(
        '[WARN] stop error:',
        error && error.stack || error
      )
    }
    await Promise.all(mapToArray(
      this.listeners('stop'),

      listener => new Promise(resolve => {
        resolve(listener.call(this))
      }).catch(handleStopError)
    ))
    this.removeAllListeners('stop')

    this.emit('stopped')
    this.removeAllListeners('stopped')
  }

  // -----------------------------------------------------------------

  getLogger (namespace) {
    return this.getStore('logs').then(store => new LevelDbLogger(
      store,
      namespace
    ))
  }

  // -----------------------------------------------------------------

  // Returns an object from its key or UUID.
  //
  // TODO: should throw a NoSuchObject error on failure.
  getObject (key, type) {
    const {
      all,
      indexes: {
        byRef
      }
    } = this._objects

    const obj = all[key] || byRef[key]
    if (!obj) {
      throw noSuchObject(key, type)
    }

    if (type != null && (
      isString(type) && type !== obj.type ||
      !includes(type, obj.type) // Array
    )) {
      throw noSuchObject(key, type)
    }

    return obj
  }

  getObjects (keys) {
    const {
      all,
      indexes: {
        byRef
      }
    } = this._objects

    // Returns all objects if no keys have been passed.
    if (!keys) {
      return all
    }

    // Fetches all objects and ignores those missing.
    const result = []
    forEach(keys, key => {
      const object = all[key] || byRef[key]
      if (object) {
        result.push(object)
      }
    })
    return result
  }

  // -----------------------------------------------------------------

  createUserConnection () {
    const {_connections: connections} = this

    const connection = new Connection()
    const id = connection.id = this._nextConId++

    connections[id] = connection
    connection.on('close', () => {
      delete connections[id]
    })

    return connection
  }

  // -----------------------------------------------------------------

  _handleHttpRequest (req, res, next) {
    const {url} = req

    const {_httpRequestWatchers: watchers} = this
    const watcher = watchers[url]
    if (!watcher) {
      next()
      return
    }
    if (!watcher.persistent) {
      delete watchers[url]
    }

    const {fn, data} = watcher
    new Promise(resolve => {
      resolve(fn.call(this, req, res, data, next))
    }).then(
      result => {
        if (result != null) {
          res.end(JSON.stringify(result))
        }
      },
      error => {
        console.error('HTTP request error', error.stack || error)

        if (!res.headersSent) {
          res.writeHead(500)
        }
        res.end('unknown error')
      }
    )
  }

  async registerHttpRequest (fn, data, { suffix = '' } = {}) {
    const {_httpRequestWatchers: watchers} = this

    const url = await (function generateUniqueUrl () {
      return generateToken().then(token => {
        const url = `/api/${token}${suffix}`

        return url in watchers
          ? generateUniqueUrl()
          : url
      })
    })()

    watchers[url] = {
      data,
      fn
    }

    return url
  }

  async registerHttpRequestHandler (url, fn, {
    data = undefined,
    persistent = true
  } = {}) {
    const {_httpRequestWatchers: watchers} = this

    if (url in watchers) {
      throw new Error(`a handler is already registered for ${url}`)
    }

    watchers[url] = {
      data,
      fn,
      persistent
    }
  }

  async unregisterHttpRequestHandler (url) {
    delete this._httpRequestWatchers[url]
  }

  // -----------------------------------------------------------------

  // Plugins can use this method to expose methods directly on XO.
  defineProperty (name, value) {
    if (name in this) {
      throw new Error(`Xo#${name} is already defined`)
    }

    // For security, prevent from accessing `this`.
    if (isFunction(value)) {
      value = (value => function () {
        return value.apply(null, arguments)
      })(value)
    }

    Object.defineProperty(this, name, {
      configurable: true,
      value
    })

    let unset = () => {
      delete this[name]
      unset = noop
    }
    return () => unset()
  }

  // -----------------------------------------------------------------

  // Watches objects changes.
  //
  // Some should be forwarded to connected clients.
  // Some should be persistently saved.
  _watchObjects () {
    const {
      _connections: connections,
      _objects: objects
    } = this

    let entered, exited
    function reset () {
      entered = createRawObject()
      exited = createRawObject()
    }
    reset()

    function onAdd (items) {
      forEach(items, (item, id) => {
        entered[id] = item
      })
    }
    objects.on('add', onAdd)
    objects.on('update', onAdd)

    objects.on('remove', (items) => {
      forEach(items, (_, id) => {
        // We don't care about the value here, so we choose `0`
        // because it is small in JSON.
        exited[id] = 0
      })
    })

    objects.on('finish', () => {
      const enteredMessage = !isEmpty(entered) && {
        type: 'enter',
        items: entered
      }
      const exitedMessage = !isEmpty(exited) && {
        type: 'exit',
        items: exited
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
