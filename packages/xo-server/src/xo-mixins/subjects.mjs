import assert from 'node:assert/strict'
import filter from 'lodash/filter.js'
import { createLogger } from '@xen-orchestra/log'
import { ignoreErrors } from 'promise-toolbox'
import { hash, needsRehash, verify } from 'hashy'
import { invalidCredentials, noSuchObject } from 'xo-common/api-errors.js'

import * as XenStore from '../_XenStore.mjs'
import { Groups } from '../models/group.mjs'
import { Users } from '../models/user.mjs'
import { forEach, isEmpty, lightSet } from '../utils.mjs'

// ===================================================================

const log = createLogger('xo:xo-mixins:subjects')

const addToArraySet = (set, value) => (set !== undefined ? (set.includes(value) ? set : set.concat(value)) : [value])
const removeFromArraySet = (set, value) => set && filter(set, current => current !== value)

// ===================================================================

export default class {
  constructor(app) {
    this._app = app

    const redis = app._redis

    const groupsDb = (this._groups = new Groups({
      connection: redis,
      namespace: 'group',
    }))
    const usersDb = (this._users = new Users({
      connection: redis,
      namespace: 'user',
      indexes: ['email'],
    }))

    app.hooks.on('clean', () => Promise.all([groupsDb.rebuildIndexes(), usersDb.rebuildIndexes()]))
    app.hooks.on('start', async () => {
      app.addConfigManager(
        'groups',
        () => groupsDb.get(),
        groups => Promise.all(groups.map(group => groupsDb.save(group))),
        ['users']
      )
      app.addConfigManager(
        'users',
        () => usersDb.get(),
        users =>
          Promise.all(
            users.map(async user => {
              const userId = user.id
              const conflictUsers = await usersDb.get({ email: user.email })
              if (!isEmpty(conflictUsers)) {
                await Promise.all(conflictUsers.map(({ id }) => id !== userId && this.deleteUser(id)))
              }
              return usersDb.save(user)
            })
          )
      )

      if (!(await usersDb.exists())) {
        const key = 'vm-data/admin-account'
        const { email = 'admin@admin.net', password = 'admin' } = await XenStore.read(key)
          .then(JSON.parse)
          .catch(() => ({}))

        await this.createUser({ email, password, permission: 'admin' })
        log.info(`Default user created: ${email} with password ${password}`)
        ignoreErrors.call(XenStore.rm(key))
      }
    })
  }

  // -----------------------------------------------------------------

  async createUser({ name, password, ...properties }) {
    if (name) {
      properties.email = name
    }

    if (password) {
      properties.pw_hash = await hash(password)
    }

    // TODO: use plain objects
    const user = await this._users.create(properties)

    return user
  }

  async deleteUser(id) {
    const user = await this.getUser(id)

    await this._users.remove(id)

    // Remove tokens of user.
    this._app
      .getAuthenticationTokensForUser(id)
      .then(tokens => {
        forEach(tokens, token => {
          this._app.deleteAuthenticationToken(id)::ignoreErrors()
        })
      })
      ::ignoreErrors()

    // Remove ACLs for this user.
    this._app.getAclsForSubject(id).then(acls => {
      forEach(acls, acl => {
        this._app.removeAcl(id, acl.object, acl.action)::ignoreErrors()
      })
    })

    // Remove the user from all its groups.
    forEach(user.groups, groupId => {
      this.getGroup(groupId)
        .then(group => this._removeUserFromGroup(id, group))
        ::ignoreErrors()
    })
  }

  async updateUser(
    id,
    {
      // TODO: remove
      email,

      authProviders,
      name = email,
      password,
      permission,
      preferences,
    }
  ) {
    const user = await this.getUser(id)

    if (name) {
      user.name = name
    }
    if (permission) {
      user.permission = permission
    }
    if (password) {
      user.pw_hash = await hash(password)
    }

    const newPreferences = { ...user.preferences }
    forEach(preferences, (value, name) => {
      if (value == null) {
        delete newPreferences[name]
      } else {
        newPreferences[name] = value
      }
    })
    user.preferences = isEmpty(newPreferences) ? undefined : newPreferences

    const newAuthProviders = { ...user.authProviders }
    forEach(authProviders, (value, name) => {
      if (value == null) {
        delete newAuthProviders[name]
      } else {
        newAuthProviders[name] = value
      }
    })
    user.authProviders = isEmpty(newAuthProviders) ? undefined : newAuthProviders

    // TODO: remove
    user.email = user.name
    delete user.name

    await this._users.save(user)
  }

  // Merge this method in getUser() when plain objects.
  async _getUser(id) {
    const user = await this._users.first(id)
    if (user === undefined) {
      throw noSuchObject(id, 'user')
    }

    return user
  }

  // TODO: this method will no longer be async when users are
  // integrated to the main collection.
  async getUser(id) {
    const user = await this._getUser(id)

    // TODO: remove when no longer the email property has been
    // completely eradicated.
    user.name = user.email

    return user
  }

  async getAllUsers() {
    return this._users.get()
  }

  async getUserByName(username, returnNullIfMissing) {
    // TODO: change `email` by `username`.
    const user = await this._users.first({ email: username })
    if (user !== undefined) {
      return user
    }

    if (returnNullIfMissing) {
      return null
    }

    throw noSuchObject(username, 'user')
  }

  // Deprecated: use registerUser2 instead
  // Get or create a user associated with an auth provider.
  async registerUser(provider, name) {
    const user = await this.getUserByName(name, true)
    if (user) {
      if (user._provider !== provider) {
        throw new Error(`the name ${name} is already taken`)
      }

      return user
    }

    if (!this._app.config.get('createUserOnFirstSignin')) {
      throw new Error(`registering ${name} user is forbidden`)
    }

    return /* await */ this.createUser({
      name,
      _provider: provider,
    })
  }

  // New implementation of registerUser that:
  //   - allows multiple providers per XO user
  //   - binds a XO user to the provider's user with a unique ID
  // - id: the ID that the provider uses to identify the user
  // - name: the name of the user according to the provider
  // - data: additional data about the user that the provider may want to store
  async registerUser2(providerId, { user: { id, name }, data }) {
    assert.equal(typeof name, 'string')
    assert.notEqual(name, '')

    const users = await this.getAllUsers()

    // Get the XO user bound to the provider's user
    let user = users.find(user => user.authProviders?.[providerId]?.id === id)

    // If that XO user doesn't exist or doesn't have the correct username, there
    // is a chance that there is another XO user that already has that username
    let conflictingUser
    if (user?.email !== name) {
      conflictingUser = users.find(user => user.email === name)

      if (conflictingUser !== undefined) {
        if (!this._app.config.get('authentication.mergeProvidersUsers')) {
          throw new Error(`User with username ${name} already exists`)
        }
        if (user !== undefined) {
          // TODO: merge `conflictingUser` into `user` and delete
          // `conflictingUser`. For now: keep the 2 users. Once implemented:
          // remove the `conflictingUser === undefined` condition on
          // `updateUser`.
        } else {
          user = conflictingUser
        }
      }
    } else if (user !== undefined) {
      // The user exists and is up to date
      return user
    }

    if (user === undefined) {
      if (!this._app.config.get('createUserOnFirstSignin')) {
        throw new Error(`registering ${name} user is forbidden`)
      }
      user = await this.createUser({
        name,
        authProviders: { [providerId]: { id, data } },
      })
    } else {
      // If the user has more than 1 auth provider: don't update the username to
      // avoid conflicts
      await this.updateUser(user.id, {
        name:
          (user.authProviders === undefined || Object.keys(user.authProviders).length < 2) &&
          conflictingUser === undefined // cf: TODO above
            ? name
            : undefined,
        authProviders: {
          ...user.authProviders,
          [providerId]: {
            id,
            data: data !== undefined ? data : user.authProviders?.[providerId]?.data,
          },
        },
      })
    }

    return this.getUser(user.id)
  }

  async changeUserPassword(userId, oldPassword, newPassword) {
    if (!(await this.checkUserPassword(userId, oldPassword, false))) {
      throw invalidCredentials()
    }

    await this.updateUser(userId, { password: newPassword })
  }

  async checkUserPassword(userId, password, updateIfNecessary = true) {
    const { pw_hash: hash } = await this.getUser(userId)
    if (!(hash && (await verify(password, hash)))) {
      return false
    }

    if (updateIfNecessary && needsRehash(hash)) {
      await this.updateUser(userId, { password })
    }

    return true
  }

  // -----------------------------------------------------------------

  async createGroup({ name, provider, providerGroupId }) {
    // TODO: use plain objects.
    const group = await this._groups.create(name, provider, providerGroupId)

    return group
  }

  async deleteGroup(id) {
    const group = await this.getGroup(id)

    await this._groups.remove(id)

    // Remove ACLs for this group.
    this._app.getAclsForSubject(id).then(acls => {
      forEach(acls, acl => {
        this._app.removeAcl(id, acl.object, acl.action)::ignoreErrors()
      })
    })

    // Remove the group from all its users.
    forEach(group.users, userId => {
      this.getUser(userId)
        .then(user => this._removeGroupFromUser(id, user))
        ::ignoreErrors()
    })
  }

  async updateGroup(id, { name }) {
    const group = await this.getGroup(id)

    if (name) group.name = name

    await this._groups.save(group)
  }

  async getGroup(id) {
    const group = await this._groups.first(id)
    if (group === undefined) {
      throw noSuchObject(id, 'group')
    }

    return group
  }

  async getAllGroups() {
    return this._groups.get()
  }

  async addUserToGroup(userId, groupId) {
    const [user, group] = await Promise.all([this.getUser(userId), this.getGroup(groupId)])

    user.groups = addToArraySet(user.groups, groupId)
    group.users = addToArraySet(group.users, userId)

    await Promise.all([this._users.save(user), this._groups.save(group)])
  }

  async _removeUserFromGroup(userId, group) {
    group.users = removeFromArraySet(group.users, userId)
    return this._groups.save(group)
  }

  async _removeGroupFromUser(groupId, user) {
    user.groups = removeFromArraySet(user.groups, groupId)
    return this._users.save(user)
  }

  async removeUserFromGroup(userId, groupId) {
    const [user, group] = await Promise.all([this.getUser(userId), this.getGroup(groupId)])

    await Promise.all([this._removeUserFromGroup(userId, group), this._removeGroupFromUser(groupId, user)])
  }

  async setGroupUsers(groupId, userIds) {
    const group = await this.getGroup(groupId)

    let newUsersIds = lightSet(userIds)
    const oldUsersIds = []
    forEach(group.users, id => {
      if (newUsersIds.has(id)) {
        newUsersIds.delete(id)
      } else {
        oldUsersIds.push(id)
      }
    })
    newUsersIds = newUsersIds.toArray()

    const getUser = ::this.getUser
    const [newUsers, oldUsers] = await Promise.all([
      Promise.all(newUsersIds.map(getUser)),
      Promise.all(oldUsersIds.map(getUser)),
    ])

    forEach(newUsers, user => {
      user.groups = addToArraySet(user.groups, groupId)
    })
    forEach(oldUsers, user => {
      user.groups = removeFromArraySet(user.groups, groupId)
    })

    group.users = userIds

    const saveUser = ::this._users.save
    await Promise.all([
      Promise.all(newUsers.map(saveUser)),
      Promise.all(oldUsers.map(saveUser)),
      this._groups.save(group),
    ])
  }
}
