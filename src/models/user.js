import Collection from '../collection/redis'
import Model from '../model'
import { forEach } from '../utils'

// ===================================================================

export default class User extends Model {}

User.prototype.default = {
  permission: 'none'
}

// -------------------------------------------------------------------

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
    user.groups = JSON.stringify(user.groups)

    return /* await */ this.update(user)
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
