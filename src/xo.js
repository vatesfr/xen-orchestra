import Bluebird from 'bluebird'
import createDebug from 'debug'
import forEach from 'lodash.foreach'
import includes from 'lodash.includes'
import isEmpty from 'lodash.isempty'
import isString from 'lodash.isstring'
import proxyRequest from 'proxy-http-request'
import XoCollection from 'xo-collection'
import XoUniqueIndex from 'xo-collection/unique-index'
// import XoView from 'xo-collection/view'
import {createClient as createRedisClient} from 'then-redis'
import {EventEmitter} from 'events'
import {parse as parseUrl} from 'url'

import * as xapiObjectsToXo from './xapi-objects-to-xo'
import Connection from './connection'
import User, {Users} from './models/user'
import Xapi from './xapi'
import {Acls} from './models/acl'
import {autobind} from './decorators'
import {generateToken} from './utils'
import {JsonRpcError, NoSuchObject, Unauthorized} from './api-errors'
import {ModelAlreadyExists} from './collection'
import {Servers} from './models/server'
import {Tokens} from './models/token'

// ===================================================================

const debug = createDebug('xo:xo')

// ===================================================================

class NoSuchAuthenticationToken extends NoSuchObject {
  constructor (id) {
    super(id, 'authentication token')
  }
}

class NoSuchUser extends NoSuchObject {
  constructor (id) {
    super(id, 'user')
  }
}

class NoSuchXenServer extends NoSuchObject {
  constructor (id) {
    super(id, 'xen server')
  }
}

// ===================================================================

const PERSITENT_TYPES = {

}
const isObjectPersistent = object => object.$type in PERSITENT_TYPES

const PUBLIC_TYPES = {

}
const isObjectPublic = object => object.$type in PUBLIC_TYPES

// ===================================================================

export default class Xo extends EventEmitter {
  constructor () {
    super()

    this._objects = new XoCollection()
    this._objects.createIndex('byRef', new XoUniqueIndex('ref'))

    // These will be initialized in start()
    //
    // TODO: remove and put everything in the `_objects` collection.
    this._acls = null
    this._servers = null
    this._tokens = null
    this._users = null
    this._UUIDsToKeys = null

    // Connections to Xen servers.
    this._xapis = Object.create(null)

    // Connections to users.
    this._nextConId = 0
    this._connections = Object.create(null)

    this._httpRequestWatchers = Object.create(null)

    // TODO: remove when no longer necessary.
    this._proxyRequests = Object.create(null)

    this._authenticationProviders = new Set()

    this._watchObjects()
  }

  // -----------------------------------------------------------------

  async start (config) {
    // Connects to Redis.
    const redis = createRedisClient(config.redis && config.redis.uri)

    // Creates persistent collections.
    this._acls = new Acls({
      connection: redis,
      prefix: 'xo:acl',
      indexes: ['subject', 'object']
    })
    this._servers = new Servers({
      connection: redis,
      prefix: 'xo:server',
      indexes: ['host']
    })
    this._tokens = new Tokens({
      connection: redis,
      prefix: 'xo:token',
      indexes: ['user_id']
    })
    this._users = new Users({
      connection: redis,
      prefix: 'xo:user',
      indexes: ['email']
    })

    // Proxies tokens/users related events to XO and removes tokens
    // when their related user is removed.
    this._tokens.on('remove', ids => {
      for (let id of ids) {
        this.emit(`token.revoked:${id}`)
      }
    })
    this._users.on('remove', async function (ids) {
      for (let id of ids) {
        this.emit(`user.revoked:${id}`)
        const tokens = await this._tokens.get({ user_id: id })
        for (let token of tokens) {
          this._tokens.remove(token.id)
        }
      }
    }.bind(this))

    // Connects to existing servers.
    for (let server of await this._servers.get()) {
      this.connectXenServer(server.id).catch(error => {
        console.error(
          `[WARN] ${server.host}:`,
          error[0] || error.stack || error.code || error
        )
      })
    }
  }

  // -----------------------------------------------------------------

  async addAcl (subject, object) {
    subject = (await this.getUser(subject)).id
    object = this.getObject(object).id

    try {
      await this._acls.create(subject, object)
    } catch (error) {
      if (!(error instanceof ModelAlreadyExists)) {
        throw error
      }
    }
  }

  async removeAcl (subject, object) {
    await this._acls.delete(subject, object)
  }

  async getAclsForSubject (subject) {
    return this._acls.get({ subject })
  }

  // TODO: remove when new collection.
  async getAllAcls () {
    return this._acls.get()
  }

  async canAccess (userId, objectId) {
    if (!await this._acls.exists({subject: userId, object: objectId})) {
      throw new Unauthorized()
    }
  }

  // -----------------------------------------------------------------

  async createUser ({email, password, permission}) {
    // TODO: use plain objects
    const user = await this._users.create(email, password, permission)

    return user.properties
  }

  async deleteUser (id) {
    if (!await this._users.remove(id)) {
      throw new NoSuchUser(id)
    }
  }

  async updateUser (id, {email, password, permission}) {
    const user = await this._getUser(id)

    if (email) user.set('email', email)
    if (password) user.setPassword(password)
    if (permission) user.set('permission', permission)

    await this._users.update(user)
  }

  // Merge this method in getUser() when plain objects.
  async _getUser (id) {
    const user = await this._users.first(id)
    if (!user) {
      throw new NoSuchUser(id)
    }

    return user
  }

  // TODO: this method will no longer be async when users are
  // integrated to the main collection.
  async getUser (id) {
    return (await this._getUser(id)).properties
  }

  // -----------------------------------------------------------------

  async createAuthenticationToken ({userId}) {
    // TODO: use plain objects
    const token = await this._tokens.generate(userId)

    return token.properties
  }

  async deleteAuthenticationToken (id) {
    if (!await this._token.remove(id)) {
      throw new NoSuchAuthenticationToken(id)
    }
  }

  async getAuthenticationToken (id) {
    const token = await this._tokens.first(id)
    if (!token) {
      throw new NoSuchAuthenticationToken(id)
    }

    return token.properties
  }

  // -----------------------------------------------------------------

  async registerXenServer ({host, username, password}) {
    // FIXME: We are storing passwords which is bad!
    //        Could we use tokens instead?
    // TODO: use plain objects
    const server = await this._servers.add({host, username, password})

    return server.properties
  }

  async unregisterXenServer (id) {
    this.disconnectXenServer(id).catch(() => {})

    if (!await this._servers.remove(id)) {
      throw new NoSuchXenServer(id)
    }
  }

  async updateXenServer (id, {host, username, password}) {
    const server = await this._getXenServer(id)

    if (host) server.set('host', host)
    if (username) server.set('username', username)
    if (password) server.set('password', password)

    await this._servers.update(server)
  }

  // TODO: this method will no longer be async when servers are
  // integrated to the main collection.
  async _getXenServer (id) {
    const server = await this._servers.first(id)
    if (!server) {
      throw new NoSuchXenServer(id)
    }

    return server
  }

  @autobind
  _onXenAdd (xapiObjects) {
    const {_objects: objects} = this
    forEach(xapiObjects, (xapiObject, id) => {
      const transform = xapiObjectsToXo[xapiObject.$type]
      if (!transform) {
        return
      }

      const xoObject = transform(xapiObject)
      xoObject.id = id
      xoObject.ref = xapiObject.$ref
      if (!xoObject.type) {
        xoObject.type = xapiObject.$type
      }

      const {$pool: pool} = xapiObject
      Object.defineProperties(xoObject, {
        poolRef: { value: pool.$ref },
        $poolId: {
          enumerable: true,
          value: pool.$id
        },
        ref: { value: xapiObject.$ref }
      })

      objects.set(id, xoObject)
    })
  }

  @autobind
  _onXenRemove (xapiObjects) {
    const {_objects: objects} = this
    forEach(xapiObjects, (_, id) => {
      if (objects.has(id)) {
        objects.remove(id)
      }
    })
  }

  // TODO the previous state should be marked as connected.
  async connectXenServer (id) {
    const server = (await this._getXenServer(id)).properties

    const xapi = this._xapis[server.id] = new Xapi({
      url: server.host,
      auth: {
        user: server.username,
        password: server.password
      }
    })

    const {objects} = xapi
    objects.on('add', this._onXenAdd)
    objects.on('update', this._onXenAdd)
    objects.on('remove', this._onXenRemove)

    // Each time objects are refreshed, registers the connection with
    // the pool identifier.
    objects.on('finish', () => {
      this._xapis[xapi.pool.$id] = xapi
    })

    try {
      await xapi.connect()
    } catch (error) {
      if (error.code === 'SESSION_AUTHENTICATION_FAILED') {
        throw new JsonRpcError('authentication failed')
      }
      if (error.code === 'EHOSTUNREACH') {
        throw new JsonRpcError('host unreachable')
      }
      throw error
    }
  }

  // TODO the previous state should be marked as disconnected.
  async disconnectXenServer (id) {
    const xapi = this._xapis[id]
    if (!xapi) {
      throw new NoSuchXenServer(id)
    }

    delete this._xapis[id]
    if (xapi.pool) {
      delete this._xapis[xapi.pool.id]
    }

    return xapi.disconnect()
  }

  // Returns the XAPI connection associated to an object.
  getXAPI (object, type) {
    if (isString(object)) {
      object = this.getObject(object, type)
    }

    const {$poolId: poolId} = object
    if (!poolId) {
      throw new Error(`object ${object.id} does not belong to a pool`)
    }

    const xapi = this._xapis[poolId]
    if (!xapi) {
      throw new Error(`no connection found for object ${object.id}`)
    }

    return xapi
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
    delete watchers[url]

    const {fn, data} = watcher
    Bluebird.try(fn, [req, res, data]).then(
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

  async registerHttpRequest (fn, data) {
    const {_httpRequestWatchers: watchers} = this

    const url = await (function generateUniqueUrl () {
      return generateToken().then(token => {
        const url = `/api/${token}`

        return url in watchers ?
          generateUniqueUrl() :
          url
      })
    })()

    watchers[url] = {
      fn,
      data
    }

    return url
  }

  // -----------------------------------------------------------------

  // TODO: remove when no longer necessary.
  _handleProxyRequest (req, res, next) {
    const {url} = req
    const request = this._proxyRequests[url]
    if (!request || req.method !== request.proxyMethod) {
      next()
      return
    }

    // A proxy request can only be used once.
    delete this._proxyRequests[url]

    proxyRequest(request, req, res)

    if (request.onSuccess) {
      res.on('finish', request.onSuccess)
    }

    const onFailure = request.onFailure || (() => {})

    req.on('close', onFailure)

    const closeConnection = () => {
      if (!res.headerSent) {
        res.writeHead(500)
      }
      res.end()

      onFailure()
    }
    req.on('error', error => {
      console.warn('request error', error.stack || error)
      closeConnection()
    })
    res.on('error', error => {
      console.warn('response error', error.stack || error)
      closeConnection()
    })
  }
  async registerProxyRequest (opts) {
    if (isString(opts)) {
      opts = parseUrl(opts)
    } else {
      opts.method = opts.method != null ?
        opts.method.toUpperCase() :
        'GET'

      opts.proxyMethod = opts.proxyMethod != null ?
        opts.proxyMethod.toUpperCase() :
        opts.method
    }

    opts.createdAt = Date.now()

    const url = `/${await generateToken()}`
    this._proxyRequests[url] = opts

    return url
  }

  // -----------------------------------------------------------------

  registerAuthenticationProvider (provider) {
    return this._authenticationProviders.add(provider)
  }

  unregisterAuthenticationProvider (provider) {
    return this._authenticationProviders.remove(provider)
  }

  async authenticateUser (credentials) {
    // TODO: remove when email has been replaced by username.
    if (credentials.email) {
      credentials.username = credentials.email
    } else if (credentials.username) {
      credentials.email = credentials.username
    }

    for (let provider of this._authenticationProviders) {
      try {
        const result = await provider(credentials)

        if (result instanceof User) {
          return result
        }

        // TODO: replace by email by username.
        if (result.username) {
          result.email = result.username
          delete result.username
        }

        const user = await this._users.first(result)
        if (user) return user

        return this._users.create(result.email)
      } catch (error) {
        // Authentication providers may just throw `null` to indicate
        // they could not authenticate the user without any special
        // errors.
        if (error) console.error(error.stack || error)
      }
    }

    return false
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
      entered = Object.create(null)
      exited = Object.create(null)
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
