import Collection from '../collection/redis'
import Model from '../model'
import {multiKeyHash} from '../utils'

// ===================================================================

export default class Acl extends Model {}

Acl.create = (subject, object) => {
  return Acl.hash(subject, object).then(hash => new Acl({
    id: hash,
    subject,
    object
  }))
}

Acl.hash = (subject, object) => multiKeyHash(subject, object)

// -------------------------------------------------------------------

export class Acls extends Collection {
  get Model () {
    return Acl
  }

  create (subject, object) {
    return Acl.create(subject, object).then(acl => this.add(acl))
  }

  delete (subject, object) {
    return Acl.hash(subject, object).then(hash => this.remove(hash))
  }
}
