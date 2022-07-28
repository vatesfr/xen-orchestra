import isEmpty from 'lodash/isEmpty.js'

import Collection from '../collection/redis.mjs'

import { parseProp } from './utils.mjs'

// ===================================================================

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
  permission: 'none',
  ...user,
  authProviders: parseProp('user', user, 'authProviders', undefined),
  groups: parseProp('user', user, 'groups', []),
  preferences: parseProp('user', user, 'preferences', {}),
})

export class Users extends Collection {
  async create(properties) {
    const { email } = properties

    // Avoid duplicates.
    if (await this.exists({ email })) {
      throw new Error(`the user ${email} already exists`)
    }

    // Adds the user to the collection.
    return /* await */ this.add(serialize(properties))
  }

  async save(user) {
    return /* await */ this.update(serialize(user))
  }

  async get(properties) {
    return (await super.get(properties)).map(deserialize)
  }
}
