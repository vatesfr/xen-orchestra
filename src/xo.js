import Bluebird from 'bluebird'
import forEach from 'lodash.foreach'
import includes from 'lodash.includes'
import isEmpty from 'lodash.isempty'
import isString from 'lodash.isstring'
import pluck from 'lodash.pluck'
import proxyRequest from 'proxy-http-request'
import {createClient as createRedisClient} from 'then-redis'
import {createClient as createXapiClient} from 'xen-api'
import {EventEmitter} from 'events'
import {parse as parseUrl} from 'url'

import Connection from './connection'
import spec from './spec'
import {$MappedCollection as MappedCollection} from './MappedCollection'
import {Acls} from './models/acl'
import {generateToken} from './utils'
import {Servers} from './models/server'
import {Tokens} from './models/token'
import User, {Users} from './models/user'

// ===================================================================

export default class Xo extends EventEmitter {
  constructor () {
    super()

    // These will be initialized in start()
    this._UUIDsToKeys = null
    this.servers = null
    this.tokens = null
    this.users = null

    // Connections to Xen servers.
    this._xapis = Object.create(null)

    // Connections to users.
    this._nextConId = 0
    this.connections = Object.create(null)

    // Collections of XAPI objects mapped to XO Api.
    this._xobjs = new MappedCollection()
    spec.call(this._xobjs)

    this._proxyRequests = Object.create(null)

    this._authenticationProviders = new Set()

    const taskWatchers = this._taskWatchers = Object.create(null)
    this._xobjs.on('rule=task', (event, tasks) => {
      if (event !== 'enter') return

      forEach(tasks, ({val: task}) => {
        const {ref} = task

        const watcher = taskWatchers[ref]
        if (!watcher) return

        const {status} = task
        if (status === 'success') {
          watcher.resolve(task.result)
        } else if (status === 'failure') {
          watcher.reject(task.error_info)
        } else {
          return
        }

        delete taskWatchers[ref]
      })
    })
  }

  // -----------------------------------------------------------------

  async start (config) {
    // Connects to Redis.
    const redis = createRedisClient(config.redis && config.redis.uri)

    // Creates persistent collections.
    this.acls = new Acls({
      connection: redis,
      prefix: 'xo:acl',
      indexes: ['subject', 'object']
    })
    this.servers = new Servers({
      connection: redis,
      prefix: 'xo:server',
      indexes: ['host']
    })
    this.tokens = new Tokens({
      connection: redis,
      prefix: 'xo:token',
      indexes: ['user_id']
    })
    this.users = new Users({
      connection: redis,
      prefix: 'xo:user',
      indexes: ['email']
    })

    // Proxies tokens/users related events to XO and removes tokens
    // when their related user is removed.
    this.tokens.on('remove', ids => {
      for (let id of ids) {
        this.emit(`token.revoked:${id}`)
      }
    })
    this.users.on('remove', async function (ids) {
      for (let id of ids) {
        this.emit(`user.revoked:${id}`)
      }

      const tokens = await this.tokens.get({ user_id: id })
      for (let token of tokens) {
        this.tokens.remove(token.id)
      }
    }.bind(this))

    // When objects enter or exists, sends a notification to all
    // connected clients.
    {
      let entered = {}
      let exited = {}

      let dispatcherRegistered = false
      const dispatcher = () => {
        const {connections} = this

        if (!isEmpty(entered)) {
          const enterParams = {
            type: 'enter',
            items: pluck(entered, 'val')
          }

          for (let id in connections) {
            const connection = connections[id]

            if (connection.has('user_id')) {
              connection.notify('all', enterParams)
            }
          }

          entered = {}
        }

        if (!isEmpty(entered)) {
          const exitParams = {
            type: 'exit',
            items: pluck(exited, 'val')
          }

          for (let id in connections) {
            const connection = connections[id]

            if (connection.has('user_id')) {
              connection.notify('all', exitParams)
            }
          }

          exited = {}
        }
      }

      this._xobjs.on('any', (event, items) => {
        if (!dispatcherRegistered) {
          dispatcherRegistered = true
          process.nextTick(dispatcher)
        }

        if (event === 'exit') {
          forEach(items, item => {
            const {key} = item

            delete entered[key]
            exited[key] = item
          })
        } else {
          forEach(items, item => {
            const {key} = item

            delete exited[key]
            entered[key] = item
          })
        }
      })
    }

    // Exports the map from UUIDs to keys.
    this._UUIDsToKeys = this._xobjs.get('xo').$UUIDsToKeys

    // Connects to existing servers.
    for (let server of await this.servers.get()) {
      this.connectServer(server).catch(error => {
        console.error(
          `[WARN] ${server.host}:`,
          error[0] || error.stack || error.code || error
        )
      })
    }
  }

  // -----------------------------------------------------------------

  connectServer (server) {
    if (server.properties) {
      server = server.properties
    }

    const xapi = this._xapis[server.id] = createXapiClient({
      url: server.host,
      auth: {
        user: server.username,
        password: server.password
      }
    })

    const {objects} = xapi
    objects.on('add', objects => {
      this._xapis[xapi.pool.$id] = xapi

      this._xobjs.set(objects, {
        add: true,
        update: false,
        remove: false
      })
    })
    objects.on('update', objects => {
      this._xapis[xapi.pool.$id] = xapi

      this._xobjs.set(objects, {
        add: true,
        update: true,
        remove: false
      })
    })
    objects.on('remove', objects => {
      this._xobjs.removeWithPredicate(object => (
        object.genval &&
        object.genval.$id in objects
      ))
    })

    return xapi.connect()
  }

  async disconnectServer (server) {
    const id = (
      server && (
        server.properties && server.properties.id ||
        server.id
      ) ||
      server
    )

    const xapi = this._xapis[id]
    if (!xapi) {
      throw new Error('no such server')
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
  getObject (key, type) {
    // Gracefully handles UUIDs.
    if (key in this._UUIDsToKeys) {
      key = this._UUIDsToKeys[key]
    }

    const obj = this._xobjs.get(key)

    if (type != null && (
      isString(type) && type !== obj.type ||
      !includes(type, obj.type) // Array
    )) {
      throw new Error(`unexpected type ${obj.type} instead of ${type}`)
    }

    return obj
  }

  getObjects (keys) {
    // Returns all objects if no keys have been passed.
    if (!keys) {
      return this._xobjs.get()
    }

    // Resolves all UUIDs.
    const {_UUIDsToKeys: UUIDsToKeys} = this
    for (let i = 0, n = keys.length; i < n; ++i) {
      const key = UUIDsToKeys[keys[i]]
      if (key !=  null) {
        keys[i] = key
      }
    }

    // Fetches all objects and ignores those missing.
    return this._xobjs.get(keys, true)
  }

  // -----------------------------------------------------------------

  createUserConnection (opts) {
    const {connections} = this

    const connection = new Connection(opts)
    const id = connection.id = this._nextConId++
    connection.on('close', () => {
      connections[id]
    })

    connections[id] = connection

    return connection
  }

  // -----------------------------------------------------------------

  async registerProxyRequest (opts) {
    if (isString(opts)) {
      opts = parseUrl(opts)
    } else {
      otps.method = opts.method != null ?
        opts.method.toUpperCase() :
        'GET'

      opts.proxyMethod = opts.proxyMethod != null ?
        opts.proxyMethod.toUpperCase() :
        opts.method
    }

    opts.createdAt = Date.now()

    const url = `/${await generateToken()} `
    this._proxyRequests[url] = opts

    return url
  }

  handleProxyRequest (req, res, next) {
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

  // -----------------------------------------------------------------

  watchTask (ref) {
    let watcher = this._taskWatchers[ref]
    if (!watcher) {
      let resolve, reject
      const promise = new Bluebird((resolve_, reject_) => {
        resolve = resolve_
        reject = reject_
      })

      // Register the watcher.
      watcher = this._taskWatchers[ref] = {
        promise,
        resolve,
        reject
      }

      // Unregister the watcher once the promise is resolved.
      promise.finally(() => {
        delete this._taskWatchers[ref]
      })
    }

    return watcher.promise
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

        const user = await this.users.first(result)
        if (user) return user

        return this.users.create(result.email)
      } catch (error) {
        // Authentication providers may just throw `null` to indicate
        // they could not authenticate the user without any special
        // errors.
        if (error) console.error(error.stack || error)
      }
    }

    return false
  }
}
