import isEmpty from 'lodash/isEmpty.js'
import { objectAlreadyExists } from 'xo-common/api-errors.js'

import Collection from '../collection/redis.mjs'

import { parseProp } from './utils.mjs'

// ===================================================================

export const UNIQUE_FIELDS = ['email', 'username']

export class Users extends Collection {
  async _checkUnique(field, value) {
    if (value == null) {
      return
    }

    const existingUser = await this.first({ [field]: value })
    if (existingUser !== undefined) {
      throw objectAlreadyExists({ objectId: existingUser.id, objectType: 'user' })
    }
  }

  async _beforeAdd(user) {
    for (const field of UNIQUE_FIELDS) {
      await this._checkUnique(field, user[field])
    }
  }

  async _beforeUpdate(user, previous) {
    for (const field of UNIQUE_FIELDS) {
      if (user[field] !== previous[field]) {
        await this._checkUnique(field, user[field])
      }
    }
  }

  _serialize(user) {
    let tmp
    user.authProviders = isEmpty((tmp = user.authProviders)) ? undefined : JSON.stringify(tmp)
    user.groups = isEmpty((tmp = user.groups)) ? undefined : JSON.stringify(tmp)
    user.preferences = isEmpty((tmp = user.preferences)) ? undefined : JSON.stringify(tmp)
  }

  _unserialize(user) {
    if (user.permission === undefined) {
      user.permission = 'none'
    }
    user.authProviders = parseProp('user', user, 'authProviders', undefined)
    user.groups = parseProp('user', user, 'groups', [])
    user.preferences = parseProp('user', user, 'preferences', {})
  }
}
