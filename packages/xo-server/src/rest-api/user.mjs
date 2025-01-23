import pick from 'lodash/pick.js'
import AbstractCollection from './AbstractCollection.mjs'
import CM from 'complex-matcher'

class User extends AbstractCollection {
  constructor(app) {
    super(app, 'user')
  }

  async getObject(id) {
    const user = await this.getApp().getUser(id)
    delete user.pw_hash

    return user
  }

  async getObjects(filter, limit, fields) {
    filter = filter !== undefined ? CM.parse(filter).createPredicate() : undefined
    limit = Number(limit)

    let users = await this.getApp().getAllUsers()
    if (filter !== undefined) {
      users = users.filter(filter)
    }

    if (Number.isInteger(limit)) {
      users = users.slice(0, limit)
    }

    if (fields === undefined) {
      users = users.map(user => user.id)
    } else if (fields !== '*') {
      const properties = fields.split(',')
      users = users.map(obj => pick(obj, properties))
    }

    return users
  }
}

export default User
