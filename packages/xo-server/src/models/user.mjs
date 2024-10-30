import isEmpty from 'lodash/isEmpty.js'

import Collection from '../collection/redis.mjs'

import { parseProp } from './utils.mjs'

// ===================================================================

export class Users extends Collection {
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

  async create(properties) {
    const { email } = properties

    // Avoid duplicates.
    if (await this.exists({ email })) {
      throw new Error(`the user ${email} already exists`)
    }

    // Adds the user to the collection.
    return /* await */ this.add(properties)
  }

  async update(properties) {
    const { id, email } = properties

    const currentUser = await this.first({ id })
    const emailUser = await this.first({ email })
    const emailExists = emailUser !== undefined

    if (emailExists && currentUser.id !== emailUser.id) {
      throw new Error(`the user ${email} already exists`)
    }

    return super.update(properties)
  }
}
