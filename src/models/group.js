import Collection from '../collection/redis'
import Model from '../model'

import { forEach } from '../utils'

// ===================================================================

export default class Group extends Model {}

// ===================================================================

export class Groups extends Collection {
  get Model () {
    return Group
  }

  get idPrefix () {
    return 'group:'
  }

  create (name) {
    return this.add(new Group({
      name,
      users: '[]'
    }))
  }

  async save (group) {
    // Serializes.
    group.users = JSON.stringify(group.users)

    return /* await */ this.update(group)
  }

  async get (properties) {
    const groups = await super.get(properties)

    // Deserializes.
    forEach(groups, group => {
      const {users} = group
      try {
        group.users = JSON.parse(users)
      } catch (error) {
        console.warn('cannot parse group.users:', users)
        group.users = []
      }
    })

    return groups
  }
}
