import Collection from '../collection/redis.mjs'
import { forEach, serializeError } from '../utils.mjs'

import { parseProp } from './utils.mjs'

// ===================================================================

export class Remotes extends Collection {
  async get(properties) {
    const remotes = await super.get(properties)
    forEach(remotes, remote => {
      remote.benchmarks = parseProp('remote', remote, 'benchmarks')
      remote.enabled = remote.enabled === 'true'
      remote.error = parseProp('remote', remote, 'error', remote.error)
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

        const { error } = remote
        if (error !== undefined) {
          remote.error = JSON.stringify(typeof error === 'object' ? serializeError(error) : error)
        }

        return remote
      })
    )
  }
}
