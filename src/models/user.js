import forEach from 'lodash.foreach'
import {hash, needsRehash, verify} from 'hashy'

import Collection from '../collection/redis'
import Model from '../model'

// ===================================================================

const PERMISSIONS = {
  none: 0,
  read: 1,
  write: 2,
  admin: 3
}

// ===================================================================

export default class User extends Model {
  async checkPassword (password) {
    const hash = this.get('pw_hash')

    if (!(hash && await verify(password, hash))) {
      return false
    }

    // There might be no hash if the user authenticate with another
    // method (e.g. LDAP).
    if (needsRehash(hash)) {
      await this.setPassword(password)
    }

    return true
  }

  hasPermission (permission) {
    return PERMISSIONS[this.get('permission')] >= PERMISSIONS[permission]
  }

  setPassword (password) {
    return hash(password).then(hash => {
      return this.set('pw_hash', hash)
    })
  }
}

User.prototype.default = {
  permission: 'none'
}

// -------------------------------------------------------------------

export class Users extends Collection {
  get Model () {
    return User
  }

  async create (email, password, permission = 'none') {
    const user = new User({
      email,
      permission
    })

    if (password != null) {
      await user.setPassword(password)
    }

    return this.add(user)
  }

  async save (user) {
    // Serializes.
    user.groups = JSON.stringify(user.groups)

    return await this.update(user)
  }

  async get (properties) {
    const users = await super.get(properties)

    // Deserializes
    forEach(users, user => {
      const {groups} = user
      try {
        user.groups = groups ? JSON.parse(groups) : []
      } catch (_) {
        console.warn('cannot parse user.groups:', groups)
        user.groups = []
      }
    })

    return users
  }
}
