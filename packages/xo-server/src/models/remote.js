import Collection from '../collection/redis'
import Model from '../model'
import { forEach } from '../utils'

// ===================================================================

export default class Remote extends Model {}

export class Remotes extends Collection {
  get Model () {
    return Remote
  }

  async get (properties) {
    const remotes = await super.get(properties)
    forEach(remotes, remote => {
      const enabled = remote.enabled === 'true'
      remote.enabled = enabled
      remote.connected = enabled && remote.error === ''
    })
    return remotes
  }
}
