import isEmpty from 'lodash/isEmpty'

import Collection from '../collection/redis'
import Model from '../model'

import { forEach } from '../utils'

import { parseProp } from './utils'

// ===================================================================

export default class Group extends Model {}

// ===================================================================

export class Groups extends Collection {
  get Model() {
    return Group
  }

  create(name) {
    return this.add(new Group({ name }))
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
