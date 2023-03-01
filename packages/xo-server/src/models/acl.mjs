import Collection from '../collection/redis.mjs'
import { forEach, multiKeyHash } from '../utils.mjs'

// ===================================================================

// Up until now, there were no actions, therefore the default
// action is used to update existing entries.
const DEFAULT_ACTION = 'admin'

// ===================================================================

export class Acls extends Collection {
  create(subject, object, action) {
    return multiKeyHash(subject, object, action).then(hash =>
      this.add({
        id: hash,
        subject,
        object,
        action,
      })
    )
  }

  delete(subject, object, action) {
    return multiKeyHash(subject, object, action).then(hash => this.remove(hash))
  }

  aclExists(subject, object, action) {
    return multiKeyHash(subject, object, action).then(hash => this.exists(hash))
  }

  async get(properties) {
    const acls = await super.get(properties)

    // Finds all records that are missing a action and need to be updated.
    const toUpdate = []
    forEach(acls, acl => {
      if (!acl.action) {
        acl.action = DEFAULT_ACTION
        toUpdate.push(acl)
      }
    })
    if (toUpdate.length) {
      // Removes all existing entries.
      await this.remove(toUpdate.map(_ => _.id))

      // Compute the new ids (new hashes).
      await Promise.all(
        toUpdate.map(acl =>
          multiKeyHash(acl.subject, acl.object, acl.action).then(id => {
            acl.id = id
          })
        )
      )

      // Inserts the new (updated) entries.
      await this.add(toUpdate)
    }

    return acls
  }
}
