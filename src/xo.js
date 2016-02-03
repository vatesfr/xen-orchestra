import checkAuthorization from 'xo-acl-resolver'
import filter from 'lodash.filter'
import fs from 'fs-promise'
import includes from 'lodash.includes'
import isFunction from 'lodash.isfunction'
import isString from 'lodash.isstring'
import levelup from 'level-party'
import sublevel from 'level-sublevel'
import XoCollection from 'xo-collection'
import XoUniqueIndex from 'xo-collection/unique-index'
import {createClient as createRedisClient} from 'redis'
import {EventEmitter} from 'events'
import {
  needsRehash,
  verify
} from 'hashy'

import mixins from './xo-mixins'
import Connection from './connection'
import LevelDbLogger from './loggers/leveldb'
import Xapi from './xapi'
import xapiObjectToXo from './xapi-object-to-xo'
import XapiStats from './xapi-stats'
import {Acls} from './models/acl'
import {
  mixin
} from './decorators'
import {
  createRawObject,
  forEach,
  generateToken,
  isEmpty,
  mapToArray,
  noop,
  popProperty
} from './utils'
import {Groups} from './models/group'
import {
  InvalidCredential,
  JsonRpcError,
  NoSuchObject
} from './api-errors'
import {ModelAlreadyExists} from './collection'
import {Servers} from './models/server'
import Token, {Tokens} from './models/token'
import {Users} from './models/user'

// ===================================================================

class NoSuchAuthenticationToken extends NoSuchObject {
  constructor (id) {
    super(id, 'authentication token')
  }
}

class NoSuchGroup extends NoSuchObject {
  constructor (id) {
    super(id, 'group')
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

@mixin(mapToArray(mixins))
export default class Xo extends EventEmitter {
  constructor (config) {
    super()

    this._config = config

    this._objects = new XoCollection()
    this._objects.createIndex('byRef', new XoUniqueIndex('_xapiRef'))

    // Connections to Xen servers.
    this._xapis = createRawObject()

    // Stats utils.
    this._xapiStats = new XapiStats()

    // Connections to users.
    this._nextConId = 0
    this._connections = createRawObject()

    this._authenticationFailures = createRawObject()
    this._authenticationProviders = new Set()
    this._httpRequestWatchers = createRawObject()
    this._xenObjConflicts = createRawObject() // TODO: clean when a server is disconnected.

    // Connects to Redis.
    this._redis = createRedisClient(config.redis && config.redis.uri)
  }

  // -----------------------------------------------------------------

  async start () {
    this.start = noop

    const { _config: config } = this

    this._watchObjects()

    await fs.mkdirp(config.datadir)

    this._leveldb = sublevel(levelup(`${config.datadir}/leveldb`, {
      valueEncoding: 'json'
    }))

    // ---------------------------------------------------------------

    const redis = this._redis

    // Creates persistent collections.
    this._acls = new Acls({
      connection: redis,
      prefix: 'xo:acl',
      indexes: ['subject', 'object']
    })
    this._groups = new Groups({
      connection: redis,
      prefix: 'xo:group'
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

    // ---------------------------------------------------------------

    // Connects to existing servers.
    const servers = await this._servers.get()
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

    // TODO: disconnect all servers.

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
    return new LevelDbLogger(
      this._leveldb.sublevel('logs'),
      namespace
    )
  }

  // -----------------------------------------------------------------

  async _getAclsForUser (userId) {
    const subjects = (await this.getUser(userId)).groups.concat(userId)

    const acls = []
    const pushAcls = (function (push) {
      return function (entries) {
        push.apply(acls, entries)
      }
    })(acls.push)

    const {_acls: collection} = this
    await Promise.all(mapToArray(
      subjects,
      subject => collection.get({subject}).then(pushAcls)
    ))

    return acls
  }

  async addAcl (subjectId, objectId, action) {
    try {
      await this._acls.create(subjectId, objectId, action)
    } catch (error) {
      if (!(error instanceof ModelAlreadyExists)) {
        throw error
      }
    }
  }

  async removeAcl (subjectId, objectId, action) {
    await this._acls.delete(subjectId, objectId, action)
  }

  // TODO: remove when new collection.
  async getAllAcls () {
    return this._acls.get()
  }

  async getPermissionsForUser (userId) {
    const [
      acls,
      permissionsByRole
    ] = await Promise.all([
      this._getAclsForUser(userId),
      this._getPermissionsByRole()
    ])

    const permissions = createRawObject()
    for (const { action, object: objectId } of acls) {
      const current = (
        permissions[objectId] ||
        (permissions[objectId] = createRawObject())
      )

      const permissionsForRole = permissionsByRole[action]
      if (permissionsForRole) {
        for (const permission of permissionsForRole) {
          current[permission] = 1
        }
      } else {
        current[action] = 1
      }
    }
    return permissions
  }

  async hasPermissions (userId, permissions) {
    const user = await this.getUser(userId)

    // Special case for super XO administrators.
    if (user.permission === 'admin') {
      return true
    }

    return checkAuthorization(
      await this.getPermissionsForUser(userId),
      id => this.getObject(id),
      permissions
    )
  }

  // -----------------------------------------------------------------

  async createUser (email, properties) {
    // TODO: use plain objects
    const user = await this._users.create(email, properties)

    return user.properties
  }

  async deleteUser (id) {
    const user = await this.getUser(id)

    await this._users.remove(id)

    // Remove tokens of user.
    this._getAuthenticationTokensForUser(id)
      .then(tokens => {
        forEach(tokens, token => {
          this._tokens.remove(token.id)
            .catch(noop)
        })
      })
      .catch(noop) // Ignore any failures.

    // Remove the user from all its groups.
    forEach(user.groups, groupId => {
      this.getGroup(groupId)
        .then(group => this._removeUserFromGroup(id, group))
        .catch(noop) // Ignore any failures.
    })
  }

  async updateUser (id, {email, password, permission}) {
    const user = await this._getUser(id)

    if (email) user.set('email', email)
    if (permission) user.set('permission', permission)
    if (password) {
      await user.setPassword(password)
    }

    await this._users.save(user.properties)
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
    const user = (await this._getUser(id)).properties

    // TODO: remove when no longer the email property has been
    // completely eradicated.
    user.name = user.email

    return user
  }

  async getUserByName (username, returnNullIfMissing) {
    // TODO: change `email` by `username`.
    const user = await this._users.first({ email: username })
    if (user) {
      return user.properties
    }

    if (returnNullIfMissing) {
      return null
    }

    throw new NoSuchUser(username)
  }

  // Get or create a user associated with an auth provider.
  async registerUser (provider, name) {
    let user = await this.getUserByName(name, true)
    if (user) {
      if (user._provider !== provider) {
        throw new Error(`the name ${name} is already taken`)
      }

      return user
    }

    if (!this._config.createUserOnFirstSignin) {
      throw new Error(`registering ${name} user is forbidden`)
    }

    return await this.createUser(name, {
      _provider: provider
    })
  }

  async changeUserPassword (userId, oldPassword, newPassword) {
    if (!(await this.checkUserPassword(userId, oldPassword, false))) {
      throw new InvalidCredential()
    }

    await this.updateUser(userId, { password: newPassword })
  }

  async checkUserPassword (userId, password, updateIfNecessary = true) {
    const { pw_hash: hash } = await this.getUser(userId)
    if (!(
      hash &&
      await verify(password, hash)
    )) {
      return false
    }

    if (updateIfNecessary && needsRehash(hash)) {
      await this.updateUser(userId, { password })
    }

    return true
  }

  // -----------------------------------------------------------------

  async createGroup ({name}) {
    // TODO: use plain objects.
    const group = (await this._groups.create(name)).properties

    group.users = JSON.parse(group.users)
    return group
  }

  async deleteGroup (id) {
    const group = await this.getGroup(id)

    await this._groups.remove(id)

    // Remove the group from all its users.
    forEach(group.users, userId => {
      this.getUser(userId)
        .then(user => this._removeGroupFromUser(id, user))
        .catch(noop) // Ignore any failures.
    })
  }

  async updateGroup (id, {name}) {
    const group = await this.getGroup(id)

    if (name) group.name = name

    await this._groups.save(group)
  }

  async getGroup (id) {
    const group = (await this._groups.first(id))
    if (!group) {
      throw new NoSuchGroup(id)
    }

    return group.properties
  }

  async addUserToGroup (userId, groupId) {
    const [user, group] = await Promise.all([
      this.getUser(userId),
      this.getGroup(groupId)
    ])

    const {groups} = user
    if (!includes(groups, groupId)) {
      user.groups.push(groupId)
    }

    const {users} = group
    if (!includes(users, userId)) {
      group.users.push(userId)
    }

    await Promise.all([
      this._users.save(user),
      this._groups.save(group)
    ])
  }

  async _removeUserFromGroup (userId, group) {
    // TODO: maybe not iterating through the whole arrays?
    group.users = filter(group.users, id => id !== userId)
    return this._groups.save(group)
  }

  async _removeGroupFromUser (groupId, user) {
    // TODO: maybe not iterating through the whole arrays?
    user.groups = filter(user.groups, id => id !== groupId)
    return this._users.save(user)
  }

  async removeUserFromGroup (userId, groupId) {
    const [user, group] = await Promise.all([
      this.getUser(userId),
      this.getGroup(groupId)
    ])

    await Promise.all([
      this._removeUserFromGroup(userId, group),
      this._removeGroupFromUser(groupId, user)
    ])
  }

  async setGroupUsers (groupId, userIds) {
    const group = await this.getGroup(groupId)

    const newUsersIds = createRawObject()
    const oldUsersIds = createRawObject()
    forEach(userIds, id => {
      newUsersIds[id] = null
    })
    forEach(group.users, id => {
      if (id in newUsersIds) {
        delete newUsersIds[id]
      } else {
        oldUsersIds[id] = null
      }
    })

    const [newUsers, oldUsers] = await Promise.all([
      Promise.all(mapToArray(newUsersIds, (_, id) => this.getUser(id))),
      Promise.all(mapToArray(oldUsersIds, (_, id) => this.getUser(id)))
    ])

    forEach(newUsers, user => {
      const {groups} = user
      if (!includes(groups, groupId)) {
        user.groups.push(groupId)
      }
    })
    forEach(oldUsers, user => {
      user.groups = filter(user.groups, id => id !== groupId)
    })

    group.users = userIds

    await Promise.all([
      Promise.all(mapToArray(newUsers, this._users.save, this._users)),
      Promise.all(mapToArray(oldUsers, this._users.save, this._users)),
      this._groups.save(group)
    ])
  }

  // -----------------------------------------------------------------

  async _getPermissionsByRole () {
    const roles = await this.getRoles()

    const permissions = createRawObject()
    for (const role of roles) {
      permissions[role.id] = role.permissions
    }
    return permissions
  }

  // TODO: delete when merged with the new collection.
  async getRoles () {
    return [
      {
        id: 'viewer',
        name: 'Viewer',
        permissions: [
          'view'
        ]
      },
      {
        id: 'operator',
        name: 'Operator',
        permissions: [
          'view',
          'operate'
        ]
      },
      {
        id: 'admin',
        name: 'Admin',
        permissions: [
          'view',
          'operate',
          'administrate'
        ]
      }
    ]
  }

  // Returns an array of roles which have a given permission.
  async getRolesForPermission (permission) {
    const roles = []

    forEach(await this.getRoles(), role => {
      if (includes(role.permissions, permission)) {
        roles.push(role.id)
      }
    })

    return roles
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

  async registerXenServer ({host, username, password, readOnly = false}) {
    // FIXME: We are storing passwords which is bad!
    //        Could we use tokens instead?
    // TODO: use plain objects
    const server = await this._servers.create({
      host,
      username,
      password,
      readOnly: readOnly ? 'true' : undefined,
      enabled: 'true'
    })

    return server.properties
  }

  async unregisterXenServer (id) {
    this.disconnectXenServer(id).catch(noop)

    if (!await this._servers.remove(id)) { // eslint-disable-line space-before-keywords
      throw new NoSuchXenServer(id)
    }
  }

  async updateXenServer (id, {host, username, password, readOnly, enabled}) {
    const server = await this._getXenServer(id)

    if (host) server.set('host', host)
    if (username) server.set('username', username)
    if (password) server.set('password', password)

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

  _onXenAdd (xapiObjects, xapiIdsToXo, toRetry, conId) {
    const conflicts = this._xenObjConflicts
    const objects = this._objects

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
    const conflicts = this._xenObjConflicts
    const objects = this._objects

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
      url: server.host,
      auth: {
        user: server.username,
        password: server.password
      },
      readOnly: Boolean(server.readOnly)
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
      const onFinish = () => {
        if (xapi.pool) {
          this._xapis[xapi.pool.$id] = xapi
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

      return {
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
        }
      }
    })()

    xapi.xo.install()

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

  async disconnectXenServer (id) {
    const xapi = this._xapis[id]
    if (!xapi) {
      throw new NoSuchXenServer(id)
    }

    delete this._xapis[id]
    if (xapi.pool) {
      delete this._xapis[xapi.pool.id]
    }

    xapi.xo.uninstall()
    return xapi.disconnect()
  }

  getXAPI () {
    throw new Error(`Use <Xo#getXapi()> (camel case) instead.`)
  }

  // Returns the XAPI connection associated to an object.
  getXapi (object, type) {
    if (isString(object)) {
      object = this.getObject(object, type)
    }

    const { $pool: poolId } = object
    if (!poolId) {
      throw new Error(`object ${object.id} does not belong to a pool`)
    }

    const xapi = this._xapis[poolId]
    if (!xapi) {
      throw new Error(`no connection found for object ${object.id}`)
    }

    return xapi
  }

  getXapiVmStats (vm, granularity) {
    const xapi = this.getXapi(vm)
    return this._xapiStats.getVmPoints(xapi, vm._xapiId, granularity)
  }

  getXapiHostStats (host, granularity) {
    const xapi = this.getXapi(host)
    return this._xapiStats.getHostPoints(xapi, host._xapiId, granularity)
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
