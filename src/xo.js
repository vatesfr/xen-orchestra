// import XoView from 'xo-collection/view'
import createJsonSchemaValidator from 'is-my-json-valid'
import endsWith from 'lodash.endswith'
import escapeStringRegexp from 'escape-string-regexp'
import eventToPromise from 'event-to-promise'
import filter from 'lodash.filter'
import fs from 'fs-promise'
import includes from 'lodash.includes'
import isFunction from 'lodash.isfunction'
import isString from 'lodash.isstring'
import levelup from 'level-party'
import sortBy from 'lodash.sortby'
import startsWith from 'lodash.startswith'
import sublevel from 'level-sublevel'
import XoCollection from 'xo-collection'
import XoUniqueIndex from 'xo-collection/unique-index'
import {createClient as createRedisClient} from 'redis'
import {EventEmitter} from 'events'
import {
  needsRehash,
  verify
} from 'hashy'

import checkAuthorization from './acl'
import Connection from './connection'
import LevelDbLogger from './loggers/leveldb'
import Xapi from './xapi'
import xapiObjectToXo from './xapi-object-to-xo'
import XapiStats from './xapi-stats'
import {Acls} from './models/acl'
import {
  createRawObject,
  forEach,
  generateToken,
  isEmpty,
  mapToArray,
  noop,
  safeDateFormat
} from './utils'
import {Groups} from './models/group'
import {
  InvalidCredential,
  InvalidParameters,
  JsonRpcError,
  NoSuchObject
} from './api-errors'
import {Jobs} from './models/job'
import {ModelAlreadyExists} from './collection'
import {PluginsMetadata} from './models/plugin-metadata'
import {Remotes} from './models/remote'
import {Schedules} from './models/schedule'
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

class NoSuchPlugin extends NoSuchObject {
  constructor (id) {
    super(id, 'plugin')
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

class NoSuchSchedule extends NoSuchObject {
  constructor (id) {
    super(id, 'schedule')
  }
}

class NoSuchJob extends NoSuchObject {
  constructor (id) {
    super(id, 'job')
  }
}

class NoSuchRemote extends NoSuchObject {
  constructor (id) {
    super(id, 'remote')
  }
}

// ===================================================================

export default class Xo extends EventEmitter {
  constructor (config) {
    super()

    this._config = config

    this._objects = new XoCollection()
    this._objects.createIndex('byRef', new XoUniqueIndex('_xapiRef'))

    // These will be initialized in start()
    //
    // TODO: remove and put everything in the `_objects` collection.
    this._acls = null
    this._groups = null
    this._pluginsMetadata = null
    this._servers = null
    this._tokens = null
    this._users = null
    this._UUIDsToKeys = null

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
    this._leveldb = null // Initialized in start().
    this._plugins = createRawObject()

    this._watchObjects()
  }

  // -----------------------------------------------------------------

  async start () {
    const { _config: config } = this

    await fs.mkdirp(config.datadir)

    this._leveldb = sublevel(levelup(`${config.datadir}/leveldb`, {
      valueEncoding: 'json'
    }))

    // ---------------------------------------------------------------

    // Connects to Redis.
    const redis = createRedisClient(config.redis && config.redis.uri)

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
    this._pluginsMetadata = new PluginsMetadata({
      connection: redis,
      prefix: 'xo:plugin-metadata'
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
    this._jobs = new Jobs({
      connection: redis,
      prefix: 'xo:job',
      indexes: ['user_id', 'key']
    })
    this._schedules = new Schedules({
      connection: redis,
      prefix: 'xo:schedule',
      indexes: ['user_id', 'job']
    })
    this._remotes = new Remotes({
      connection: redis,
      prefix: 'xo:remote',
      indexes: ['enabled']
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

  async getAllJobs () {
    return await this._jobs.get()
  }

  async getJob (id) {
    const job = await this._jobs.first(id)
    if (!job) {
      throw new NoSuchJob(id)
    }

    return job.properties
  }

  async createJob (userId, job) {
    // TODO: use plain objects
    const job_ = await this._jobs.create(userId, job)
    return job_.properties
  }

  async updateJob (job) {
    return await this._jobs.save(job)
  }

  async removeJob (id) {
    return await this._jobs.remove(id)
  }

  // -----------------------------------------------------------------

  async _getSchedule (id) {
    const schedule = await this._schedules.first(id)
    if (!schedule) {
      throw new NoSuchSchedule(id)
    }

    return schedule
  }

  async getSchedule (id) {
    return (await this._getSchedule(id)).properties
  }

  async getAllSchedules () {
    return await this._schedules.get()
  }

  async createSchedule (userId, {job, cron, enabled}) {
    const schedule_ = await this._schedules.create(userId, job, cron, enabled)
    const schedule = schedule_.properties
    if (this.scheduler) {
      this.scheduler.add(schedule)
    }
    return schedule
  }

  async updateSchedule (id, {job, cron, enabled}) {
    const schedule = await this._getSchedule(id)

    if (job) schedule.set('job', job)
    if (cron) schedule.set('cron', cron)
    if (enabled !== undefined) schedule.set('enabled', enabled)

    await this._schedules.save(schedule)
    if (this.scheduler) {
      this.scheduler.update(schedule.properties)
    }
  }

  async removeSchedule (id) {
    await this._schedules.remove(id)
    if (this.scheduler) {
      this.scheduler.remove(id)
    }
  }

  // -----------------------------------------------------------------

  _developRemote (remote) {
    const _remote = { ...remote }
    if (startsWith(_remote.url, 'file://')) {
      _remote.type = 'local'
      _remote.path = _remote.url.slice(6)
    } else if (startsWith(_remote.url, 'nfs://')) {
      _remote.type = 'nfs'
      const url = _remote.url.slice(6)
      const [host, share] = url.split(':')
      _remote.path = '/tmp/xo-server/mounts/' + _remote.id
      _remote.host = host
      _remote.share = share
    }
    return _remote
  }

  async getAllRemotes () {
    return mapToArray(await this._remotes.get(), this._developRemote)
  }

  async _getRemote (id) {
    const remote = await this._remotes.first(id)
    if (!remote) {
      throw new NoSuchRemote(id)
    }

    return remote
  }

  async getRemote (id) {
    return this._developRemote((await this._getRemote(id)).properties)
  }

  async listRemote (id) {
    const remote = await this.getRemote(id)
    return this._listRemote(remote)
  }

  async _listRemote (remote) {
    const fsRemotes = {
      nfs: true,
      local: true
    }
    if (remote.type in fsRemotes) {
      const files = await fs.readdir(remote.path)
      return filter(files, file => endsWith(file, '.xva'))
    }
    throw new Error('Unhandled remote type')
  }

  async createRemote ({name, url}) {
    let remote = await this._remotes.create(name, url)
    return await this.updateRemote(remote.get('id'), {enabled: true})
  }

  async updateRemote (id, {name, url, enabled, error}) {
    const remote = await this._getRemote(id)
    this._updateRemote(remote, {name, url, enabled, error})
    const props = await this.remoteHandler.sync(this._developRemote(remote.properties))
    this._updateRemote(remote, props)
    return await this._developRemote(this._remotes.save(remote).properties)
  }

  _updateRemote (remote, {name, url, enabled, error}) {
    if (name) remote.set('name', name)
    if (url) remote.set('url', url)
    if (enabled !== undefined) remote.set('enabled', enabled)
    if (error) {
      remote.set('error', error)
    } else {
      remote.set('error', '')
    }
  }

  async removeRemote (id) {
    const remote = await this.getRemote(id)
    await this.remoteHandler.forget(remote)
    await this._remotes.remove(id)
  }

  async syncAllRemotes () {
    const remotes = await this.getAllRemotes()
    forEach(remotes, remote => {
      this.updateRemote(remote.id, {})
    })
  }

  async disableAllRemotes () {
    const remotes = await this.getAllRemotes()
    this.remoteHandler.disableAll(remotes)
  }

  async initRemotes () {
    const remotes = await this.getAllRemotes()
    if (!remotes || !remotes.length) {
      await this.createRemote({name: 'default', url: 'file://var/lib/xoa-backups'})
    }
  }

  async importVmFromRemote (id, file, host) {
    const remote = await this.getRemote(id)
    const stream = fs.createReadStream(remote.path + '/' + file)
    try {
      await eventToPromise(stream, 'readable')
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('VM to import not found in this remote')
      }
      throw error
    }
    const xapi = this.getXAPI(host)
    await xapi.importVm(stream)
  }

  // -----------------------------------------------------------------

  async backupVm ({vm, pathToFile, compress, onlyMetadata}) {
    const targetStream = fs.createWriteStream(pathToFile, { flags: 'wx' })
    const promise = eventToPromise(targetStream, 'finish')

    const sourceStream = await this.getXAPI(vm).exportVm(vm._xapiId, {
      compress,
      onlyMetadata: onlyMetadata || false
    })
    sourceStream.pipe(targetStream)

    await promise
  }

  async rollingBackupVm ({vm, path, tag, depth, compress, onlyMetadata}) {
    await fs.ensureDir(path)
    const files = await fs.readdir(path)

    const reg = new RegExp('^[^_]+_' + escapeStringRegexp(`${tag}_${vm.name_label}.xva`))
    const backups = sortBy(filter(files, (fileName) => reg.test(fileName)))

    const date = safeDateFormat(new Date())
    const backupFullPath = `${path}/${date}_${tag}_${vm.name_label}.xva`

    await this.backupVm({vm, pathToFile: backupFullPath, compress, onlyMetadata})

    const promises = []
    for (let surplus = backups.length - (depth - 1); surplus > 0; surplus--) {
      const oldBackup = backups.shift()
      promises.push(fs.unlink(`${path}/${oldBackup}`))
    }
    await Promise.all(promises)

    return backupFullPath
  }

  async rollingSnapshotVm (vm, tag, depth) {
    const xapi = this.getXAPI(vm)
    vm = xapi.getObject(vm._xapiId)

    const reg = new RegExp('^rollingSnapshot_[^_]+_' + escapeStringRegexp(tag) + '_')
    const snapshots = sortBy(filter(vm.$snapshots, snapshot => reg.test(snapshot.name_label)), 'name_label')
    const date = safeDateFormat(new Date())

    await xapi.snapshotVm(vm.$id, `rollingSnapshot_${date}_${tag}_${vm.name_label}`)

    const promises = []
    for (let surplus = snapshots.length - (depth - 1); surplus > 0; surplus--) {
      const oldSnap = snapshots.shift()
      promises.push(xapi.deleteVm(oldSnap.uuid, true))
    }
    await Promise.all(promises)
  }

  async rollingDrCopyVm ({vm, sr, tag, depth}) {
    tag = 'DR_' + tag
    const reg = new RegExp('^' + escapeStringRegexp(`${vm.name_label}_${tag}_`) + '[0-9]{8}T[0-9]{6}Z$')

    const targetXapi = this.getXAPI(sr)
    sr = targetXapi.getObject(sr._xapiId)
    const sourceXapi = this.getXAPI(vm)
    vm = sourceXapi.getObject(vm._xapiId)

    const vms = []
    forEach(sr.$VDIs, vdi => {
      const vbds = vdi.$VBDs
      const vm = vbds && vbds[0] && vbds[0].$VM
      if (vm && reg.test(vm.name_label)) {
        vms.push(vm)
      }
    })
    const olderCopies = sortBy(vms, 'name_label')

    const copyName = `${vm.name_label}_${tag}_${safeDateFormat(new Date())}`
    const drCopy = await sourceXapi.remoteCopyVm(vm.$id, targetXapi, sr.$id, {
      nameLabel: copyName
    })
    await targetXapi.addTag(drCopy.$id, 'Disaster Recovery')

    const promises = []
    for (let surplus = olderCopies.length - (depth - 1); surplus > 0; surplus--) {
      const oldDRVm = olderCopies.shift()
      promises.push(targetXapi.deleteVm(oldDRVm.$id, true))
    }
    await Promise.all(promises)
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

  async registerXenServer ({host, username, password}) {
    // FIXME: We are storing passwords which is bad!
    //        Could we use tokens instead?
    // TODO: use plain objects
    const server = await this._servers.create({host, username, password, enabled: 'true'})

    return server.properties
  }

  async unregisterXenServer (id) {
    this.disconnectXenServer(id).catch(() => {})

    if (!await this._servers.remove(id)) { // eslint-disable-line space-before-keywords
      throw new NoSuchXenServer(id)
    }
  }

  async updateXenServer (id, {host, username, password, enabled}) {
    const server = await this._getXenServer(id)

    if (host) server.set('host', host)
    if (username) server.set('username', username)
    if (password) server.set('password', password)

    if (enabled !== undefined) {
      server.set('enabled', enabled ? 'true' : undefined)
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

  _onXenAdd (xapiObjects, xapiIdsToXo) {
    const {_objects: objects} = this
    forEach(xapiObjects, (xapiObject, xapiId) => {
      const xoObject = xapiObjectToXo(xapiObject)

      if (xoObject) {
        xapiIdsToXo[xapiId] = xoObject.id

        objects.set(xoObject)
      }
    })
  }

  _onXenRemove (xapiObjects, xapiIdsToXo) {
    const {_objects: objects} = this
    forEach(xapiObjects, (_, xapiId) => {
      const xoId = xapiIdsToXo[xapiId]

      if (xoId) {
        delete xapiIdsToXo[xapiId]

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
      }
    })

    xapi.xo = (() => {
      const xapiIdsToXo = createRawObject()
      const onAddOrUpdate = objects => {
        this._onXenAdd(objects, xapiIdsToXo)
      }
      const onRemove = objects => {
        this._onXenRemove(objects, xapiIdsToXo)
      }
      const onFinish = () => {
        this._xapis[xapi.pool.$id] = xapi
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

  // Returns the XAPI connection associated to an object.
  getXAPI (object, type) {
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
    const xapi = this.getXAPI(vm)
    return this._xapiStats.getVmPoints(xapi, vm._xapiId, granularity)
  }

  getXapiHostStats (host, granularity) {
    const xapi = this.getXAPI(host)
    return this._xapiStats.getHostPoints(xapi, host._xapiId, granularity)
  }

  async mergeXenPools (sourceId, targetId, force = false) {
    const sourceXapi = this.getXAPI(sourceId)
    const {
      _auth: { user, password },
      _url: { hostname }
    } = this.getXAPI(targetId)

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

  _getRawPlugin (id) {
    const plugin = this._plugins[id]
    if (!plugin) {
      throw new NoSuchPlugin(id)
    }
    return plugin
  }

  async _getPluginMetadata (id) {
    const metadata = await this._pluginsMetadata.first(id)
    return metadata
      ? metadata.properties
      : null
  }

  async _registerPlugin (
    name,
    instance,
    configurationSchema,
    legacyConfiguration
  ) {
    const id = name

    const plugin = this._plugins[id] = {
      configured: !configurationSchema,
      configurationSchema,
      id,
      instance,
      name,
      unloadable: isFunction(instance.unload)
    }

    const metadata = await this._getPluginMetadata(id)
    let autoload = true
    let configuration = legacyConfiguration

    if (metadata) {
      ({
        autoload,
        configuration
      } = metadata)
    } else {
      console.log(`[NOTICE] migration config of ${name} plugin to database`)
      await this._pluginsMetadata.save({
        id,
        autoload,
        configuration
      })
    }

    // Configure plugin if necessary. (i.e. configurationSchema)
    // Load plugin.
    // Ignore configuration and loading errors.
    Promise.resolve()
      .then(() => {
        if (!plugin.configured) {
          return this._configurePlugin(plugin, configuration)
        }
      })
      .then(() => {
        if (autoload) {
          return this.loadPlugin(id)
        }
      })
      .catch(noop)
  }

  async _getPlugin (id) {
    const {
      configurationSchema,
      loaded,
      name,
      unloadable
    } = this._getRawPlugin(id)
    const {
      autoload,
      configuration
    } = (await this._getPluginMetadata(id)) || {}

    return {
      id,
      name,
      autoload,
      loaded,
      unloadable,
      configuration,
      configurationSchema
    }
  }

  async getPlugins () {
    return await Promise.all(
      mapToArray(this._plugins, ({ id }) => this._getPlugin(id))
    )
  }

  // Validate the configuration and configure the plugin instance.
  async _configurePlugin (plugin, configuration) {
    if (!plugin.configurationSchema) {
      throw new InvalidParameters('plugin not configurable')
    }

    const validate = createJsonSchemaValidator(plugin.configurationSchema)
    if (!validate(configuration)) {
      throw new InvalidParameters(validate.errors)
    }

    // Sets the plugin configuration.
    await plugin.instance.configure({
      // Shallow copy of the configuration object to avoid most of the
      // errors when the plugin is altering the configuration object
      // which is handed over to it.
      ...configuration
    })
    plugin.configured = true
  }

  // Validate the configuration, configure the plugin instance and
  // save the new configuration.
  async configurePlugin (id, configuration) {
    const plugin = this._getRawPlugin(id)

    await this._configurePlugin(plugin, configuration)

    // Saves the configuration.
    await this._pluginsMetadata.merge(id, { configuration })
  }

  async disablePluginAutoload (id) {
    // TODO: handle case where autoload is already disabled.

    await this._pluginsMetadata.merge(id, { autoload: false })
  }

  async enablePluginAutoload (id) {
    // TODO: handle case where autoload is already enabled.

    await this._pluginsMetadata.merge(id, { autoload: true })
  }

  async loadPlugin (id) {
    const plugin = this._getRawPlugin(id)
    if (plugin.loaded) {
      throw new InvalidParameters('plugin already loaded')
    }

    if (!plugin.configured) {
      throw new InvalidParameters('plugin not configured')
    }

    await plugin.instance.load()
    plugin.loaded = true
  }

  async unloadPlugin (id) {
    const plugin = this._getRawPlugin(id)
    if (!plugin.loaded) {
      throw new InvalidParameters('plugin already unloaded')
    }

    if (plugin.unloadable === false) {
      throw new InvalidParameters('plugin cannot be unloaded')
    }

    await plugin.instance.unload()
    plugin.loaded = false
  }

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
