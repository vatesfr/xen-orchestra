import isEmpty from 'lodash/isEmpty'

import Collection from '../collection/redis'
import Model from '../model'

import { parseProp } from './utils'

// ===================================================================

export default class User extends Model {}

User.prototype.default = {
  permission: 'none',
}

// -------------------------------------------------------------------

const serialize = user => {
  let tmp
  return {
    ...user,
    authProviders: isEmpty((tmp = user.authProviders)) ? undefined : JSON.stringify(tmp),
    groups: isEmpty((tmp = user.groups)) ? undefined : JSON.stringify(tmp),
    preferences: isEmpty((tmp = user.preferences)) ? undefined : JSON.stringify(tmp),
  }
}

const deserialize = user => ({
  ...user,
  authProviders: parseProp('user', user, 'authProviders', undefined),
  groups: parseProp('user', user, 'groups', []),
  preferences: parseProp('user', user, 'preferences', {}),
})

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
    const user = new User(serialize(properties))

    // Adds the user to the collection.
    return /* await */ this.add(user)
  }

  async save(user) {
    return /* await */ this.update(serialize(user))
  }

  async get(properties) {
    return (await super.get(properties)).map(deserialize)
  }
}
