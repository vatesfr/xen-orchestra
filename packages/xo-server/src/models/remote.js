import Collection from '../collection/redis.js'
import Model from '../model.js'
import { forEach } from '../utils.js'

import { parseProp } from './utils.js'

// ===================================================================

export default class Remote extends Model {}

export class Remotes extends Collection {
  get Model() {
    return Remote
  }

  async get(properties) {
    const remotes = await super.get(properties)
    forEach(remotes, remote => {
      remote.benchmarks = parseProp('remote', remote, 'benchmarks')
      remote.enabled = remote.enabled === 'true'
    })
    return remotes
  }

  _update(remotes) {
    return super._update(
      remotes.map(remote => {
        const { benchmarks } = remote
        if (benchmarks !== undefined) {
          remote.benchmarks = JSON.stringify(benchmarks)
        }
        return remote
      })
    )
  }
}
