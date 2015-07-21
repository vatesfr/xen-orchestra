import Collection from '../collection/redis'
import forEach from 'lodash.foreach'
import Model from '../model'

// ===================================================================

export default class Remote extends Model {}

export class Remotes extends Collection {
  get Model () {
    return Remote
  }

  get idPrefix () {
    return 'remote-'
  }

  create (name, url) {
    return this.add(new Remote({
      name,
      url,
      enabled: false,
      error: ''
    }))
  }

  async save (remote) {
    return await this.update(remote)
  }

  async get (properties) {
    const remotes = await super.get(properties)
    forEach(remotes, remote => {remote.enabled = (remote.enabled === 'true')})
    return remotes
  }
}
