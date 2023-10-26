import isEmpty from 'lodash/isEmpty.js'

import Collection from '../collection/redis.mjs'

import { parseProp } from './utils.mjs'

// ===================================================================

export class Groups extends Collection {
  _serialize(group) {
    let tmp
    group.users = isEmpty((tmp = group.users)) ? undefined : JSON.stringify(tmp)
  }

  _unserialize(group) {
    group.users = parseProp('group', group, 'users', [])
  }

  create(name, provider, providerGroupId) {
    return this.add({ name, provider, providerGroupId })
  }
}
