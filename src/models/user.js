import isEmpty from 'lodash/isEmpty'

import Collection from '../collection/redis'
import Model from '../model'
import { forEach } from '../utils'

// ===================================================================

export default class User extends Model {}

User.prototype.default = {
  permission: 'none'
}

// -------------------------------------------------------------------

const parseProp = (obj, name) => {
  const value = obj[name]
  if (value == null) {
    return
  }
  try {
    return JSON.parse(value)
  } catch (error) {
    console.warn('cannot parse user[%s] (%s):', name, value, error)
  }
}

export class Users extends Collection {
  get Model () {
    return User
  }

  async create (email, properties = {}) {
    // Avoid duplicates.
    if (await this.exists({email})) {
      throw new Error(`the user ${email} already exists`)
    }

    // Adds the email to the user's properties.
    properties.email = email

    // Create the user object.
    const user = new User(properties)

    // Adds the user to the collection.
    return /* await */ this.add(user)
  }

  async save (user) {
    // Serializes.
    let tmp
    if (!isEmpty(tmp = user.groups)) {
      user.groups = JSON.stringify(tmp)
    }
    if (!isEmpty(tmp = user.preferences)) {
      user.preferences = JSON.stringify(tmp)
    }

    return /* await */ this.update(user)
  }

  async get (properties) {
    const users = await super.get(properties)

    // Deserializes
    forEach(users, user => {
      let tmp
      user.groups = ((tmp = parseProp(user, 'groups')) && tmp.length)
        ? tmp
        : undefined
      user.preferences = parseProp(user, 'preferences')
    })

    return users
  }
}
