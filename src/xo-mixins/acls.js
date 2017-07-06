import checkAuthorization from 'xo-acl-resolver'

import {
  ModelAlreadyExists
} from '../collection'
import {
  Acls
} from '../models/acl'
import {
  createRawObject,
  forEach,
  includes,
  mapToArray
} from '../utils'

// ===================================================================

export default class {
  constructor (xo) {
    this._xo = xo

    const aclsDb = this._acls = new Acls({
      connection: xo._redis,
      prefix: 'xo:acl',
      indexes: ['subject', 'object']
    })

    xo.on('start', () => {
      xo.addConfigManager('acls',
        () => aclsDb.get(),
        acls => aclsDb.update(acls),
        [ 'groups', 'users' ]
      )
    })

    xo.on('clean', async () => {
      const acls = await aclsDb.get()
      const toRemove = []
      forEach(acls, ({ subject, object, action, id }) => {
        if (!subject || !object || !action) {
          toRemove.push(id)
        }
      })
      await aclsDb.remove(toRemove)
      return aclsDb.rebuildIndexes()
    })
  }

  async _getAclsForUser (userId) {
    const user = await this._xo.getUser(userId)
    const { groups } = user

    const subjects = groups
      ? groups.concat(userId)
      : [ userId ]

    const acls = []
    const pushAcls = (push => entries => {
      push.apply(acls, entries)
    })(acls.push)

    await Promise.all(mapToArray(
      subjects,
      subject => this.getAclsForSubject(subject).then(pushAcls)
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

  async getAclsForSubject (subjectId) {
    return this._acls.get({ subject: subjectId })
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
    const user = await this._xo.getUser(userId)

    // Special case for super XO administrators.
    if (user.permission === 'admin') {
      return true
    }

    return checkAuthorization(
      await this.getPermissionsForUser(userId),
      id => this._xo.getObject(id),
      permissions
    )
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
}
