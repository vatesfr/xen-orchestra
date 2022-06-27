import isEmpty from 'lodash/isEmpty.js'

import Collection from '../collection/redis.mjs'

import { forEach } from '../utils.mjs'

import { parseProp } from './utils.mjs'

// ===================================================================

export class Groups extends Collection {
  create(name, provider, providerGroupId) {
    return this.add({ name, provider, providerGroupId })
  }

  async save(group) {
    // Serializes.
    let tmp
    group.users = isEmpty((tmp = group.users)) ? undefined : JSON.stringify(tmp)

    return /* await */ this.update(group)
  }

  async get(properties) {
    const groups = await super.get(properties)

    // Deserializes.
    forEach(groups, group => {
      group.users = parseProp('group', group, 'users', [])
    })

    return groups
  }
}
