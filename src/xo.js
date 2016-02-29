import includes from 'lodash.includes'
import isFunction from 'lodash.isfunction'
import isString from 'lodash.isstring'
import XoCollection from 'xo-collection'
import XoUniqueIndex from 'xo-collection/unique-index'
import {createClient as createRedisClient} from 'redis'
import {EventEmitter} from 'events'

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
  mapToArray,
  noop
} from './utils'
import {
  NoSuchObject
} from './api-errors'
import Token, {Tokens} from './models/token'

// ===================================================================

class NoSuchAuthenticationToken extends NoSuchObject {
  constructor (id) {
    super(id, 'authentication token')
  }
}

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

    this._authenticationFailures = createRawObject()
    this._authenticationProviders = new Set()
    this._httpRequestWatchers = createRawObject()

    // Connects to Redis.
    this._redis = createRedisClient(config.redis && config.redis.uri)
  }

  // -----------------------------------------------------------------

  async start () {
    this.start = noop

    this._watchObjects()

    // ---------------------------------------------------------------

    const redis = this._redis

    // Creates persistent collections.
    this._tokens = new Tokens({
      connection: redis,
      prefix: 'xo:token',
      indexes: ['user_id']
    })

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

  async createAuthenticationToken ({userId}) {
    const token = new Token({
      id: await generateToken(),
      user_id: userId,
      expiration: Date.now() + 1e3 * 60 * 60 * 24 * 30 // 1 month validity.
    })

    await this._tokens.add(token)

    // TODO: use plain properties directly.
    return token.properties
  }

  async deleteAuthenticationToken (id) {
    if (!await this._tokens.remove(id)) { // eslint-disable-line space-before-keywords
      throw new NoSuchAuthenticationToken(id)
    }
  }

  async getAuthenticationToken (id) {
    let token = await this._tokens.first(id)
    if (!token) {
      throw new NoSuchAuthenticationToken(id)
    }

    token = token.properties

    if (!(
      token.expiration > Date.now()
    )) {
      this._tokens.remove(id).catch(noop)

      throw new NoSuchAuthenticationToken(id)
    }

    return token
  }

  async _getAuthenticationTokensForUser (userId) {
    return this._tokens.get({ user_id: userId })
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
      throw new NoSuchObject(key, type)
    }

    if (type != null && (
      isString(type) && type !== obj.type ||
      !includes(type, obj.type) // Array
    )) {
      throw new NoSuchObject(key, type)
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
      resolve(fn(req, res, data, next))
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

  registerAuthenticationProvider (provider) {
    return this._authenticationProviders.add(provider)
  }

  unregisterAuthenticationProvider (provider) {
    return this._authenticationProviders.delete(provider)
  }

  async _authenticateUser (credentials) {
    for (const provider of this._authenticationProviders) {
      try {
        // A provider can return:
        // - `null` if the user could not be authenticated
        // - the identifier of the authenticated user
        // - an object with a property `username` containing the name
        //   of the authenticated user
        const result = await provider(credentials)

        // No match.
        if (!result) {
          continue
        }

        return result.username
          ? await this.registerUser(undefined, result.username)
          : await this.getUser(result)
      } catch (error) {
        // Authentication providers may just throw `null` to indicate
        // they could not authenticate the user without any special
        // errors.
        if (error) console.error(error.stack || error)
      }
    }

    return false
  }

  async authenticateUser (credentials) {
    // TODO: remove when email has been replaced by username.
    if (credentials.email) {
      credentials.username = credentials.email
    } else if (credentials.username) {
      credentials.email = credentials.username
    }

    const { _authenticationFailures: failures } = this

    const { username } = credentials
    const now = Date.now()
    let lastFailure
    if (
      username &&
      (lastFailure = failures[username]) &&
      (lastFailure + 2e3) > now
    ) {
      throw new Error('too fast authentication tries')
    }

    const user = await this._authenticateUser(credentials)
    if (user) {
      delete failures[username]
    } else {
      failures[username] = now
    }

    return user
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
        if (connection.has('user_id')) {
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
