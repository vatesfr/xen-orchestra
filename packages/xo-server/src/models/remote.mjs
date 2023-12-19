import Collection from '../collection/redis.mjs'
import { serializeError } from '../utils.mjs'

import { parseProp } from './utils.mjs'

// ===================================================================

export class Remotes extends Collection {
  _serialize(remote) {
    const { benchmarks } = remote
    if (benchmarks !== undefined) {
      remote.benchmarks = JSON.stringify(benchmarks)
    }

    const { error } = remote
    if (error !== undefined) {
      remote.error = JSON.stringify(typeof error === 'object' ? serializeError(error) : error)
    }
  }

  _unserialize(remote) {
    remote.benchmarks = parseProp('remote', remote, 'benchmarks')

    const { enabled } = remote
    remote.enabled = typeof enabled === 'boolean' ? enabled : enabled === 'true'

    remote.error = parseProp('remote', remote, 'error', remote.error)
  }
}
