import isEmpty from 'lodash/isEmpty.js'

import Collection from '../collection/redis.mjs'

import { parseProp } from './utils.mjs'

// ===================================================================

export class Groups extends Collection {
  async _beforeAdd({ name }) {
    if (await this.exists({ name })) {
      throw new Error(`the group ${name} already exists`)
    }
  }

  _beforeUpdate(group, previous) {
    if (group.name !== previous.name) {
      return this._beforeAdd(group)
    }
  }

  _serialize(group) {
    let tmp
    group.users = isEmpty((tmp = group.users)) ? undefined : JSON.stringify(tmp)
  }

  _unserialize(group) {
    group.users = parseProp('group', group, 'users', [])
  }
}
