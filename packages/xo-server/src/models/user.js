import isEmpty from 'lodash/isEmpty'

import Collection from '../collection/redis'
import Model from '../model'
import { forEach } from '../utils'

import { parseProp } from './utils'

// ===================================================================

export default class User extends Model {}

User.prototype.default = {
  permission: 'none',
}

// -------------------------------------------------------------------

export class Users extends Collection {
  get Model() {
    return User
  }

  async create(properties) {
    const { email } = properties

    // Avoid duplicates.
    if (await this.exists({ email })) {
      throw new Error(`the user ${email} already exists`)
    }

    // Create the user object.
    const user = new User(properties)

    // Adds the user to the collection.
    return /* await */ this.add(user)
  }

  async save(user) {
    // Serializes.
    let tmp
    user.groups = isEmpty((tmp = user.groups)) ? undefined : JSON.stringify(tmp)
    user.preferences = isEmpty((tmp = user.preferences))
      ? undefined
      : JSON.stringify(tmp)

    return /* await */ this.update(user)
  }

  async get(properties) {
    const users = await super.get(properties)

    // Deserializes
    forEach(users, user => {
      user.groups = parseProp('user', user, 'groups', [])
      user.preferences = parseProp('user', user, 'preferences', {})
    })

    return users
  }
}
