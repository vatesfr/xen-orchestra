import forEach from 'lodash.foreach'
import map from 'lodash.map'

import Collection from '../collection/redis'
import Model from '../model'
import {multiKeyHash} from '../utils'

// ===================================================================

// Up until now, there were no roles, therefore the default role is
// used for existing entries.
const DEFAULT_ROLE = 'admin'

// ===================================================================

export default class Acl extends Model {}

Acl.create = (subject, object, role) => {
  return Acl.hash(subject, object, role).then(hash => new Acl({
    id: hash,
    subject,
    object,
    role
  }))
}

Acl.hash = (subject, object, role) => multiKeyHash(subject, object, role)

// -------------------------------------------------------------------

export class Acls extends Collection {
  get Model () {
    return Acl
  }

  create (subject, object, role) {
    return Acl.create(subject, object, role).then(acl => this.add(acl))
  }

  delete (subject, object, role = DEFAULT_ROLE) {
    return Acl.hash(subject, object, role).then(hash => this.remove(hash))
  }

  async get (properties) {
    const acls = await super.get(properties)

    // Finds all records that are missing a role and need to be updated.
    const toUpdate = []
    forEach(acls, acl => {
      if (!acl.role) {
        acl.role = DEFAULT_ROLE
        toUpdate.push(acl)
      }
    })
    if (toUpdate.length) {
      // Removes all existing entries.
      await this.remove(map(toUpdate, 'id'))

      // Compute the new ids (new hashes).
      const {hash} = Acl
      await Promise.all(map(
        toUpdate,
        (acl) => hash(acl.subject, acl.object, acl.role).then(id => {
          acl.id = id
        })
      ))

      // Inserts the new (updated) entries.
      await this.add(toUpdate)
    }

    return acls
  }
}
