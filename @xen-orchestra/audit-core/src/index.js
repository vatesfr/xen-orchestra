// see https://github.com/babel/babel/issues/8450
import 'core-js/features/symbol/async-iterator'

import assert from 'assert'
import defer from 'golike-defer'
import hash from 'object-hash'
import { invert } from 'lodash'

export class Storage {
  constructor() {
    this._lock = Promise.resolve()
  }

  async acquire() {
    const lock = this._lock
    let releaseLock
    this._lock = new Promise(resolve => {
      releaseLock = resolve
    })
    await lock
    return () => {
      releaseLock()
    }
  }
}

// Format: $<algorithm>$<salt>$<encrypted>
//
// http://man7.org/linux/man-pages/man3/crypt.3.html#NOTES
const ALGORITHM_TO_ID = {
  sha256: '5',
}

const ID_TO_ALGORITHM = invert(ALGORITHM_TO_ID)

export const NULL_ID = 'nullId'

const HASH_ALGORITHM = 'sha256'
const createHash = (data, algorithm = HASH_ALGORITHM) =>
  `$${ALGORITHM_TO_ID[algorithm]}$$${hash(data, {
    algorithm,
    excludeKeys: key => key === 'id',
  })}`

export class AuditCore {
  constructor(storage) {
    assert(storage !== undefined)
    this._storage = storage
  }

  @defer
  async add($defer, subject, event, data) {
    const storage = this._storage
    $defer(await storage.acquire())
    const record = {
      data,
      event,
      previousId: (await storage.getLastId()) ?? NULL_ID,
      subject,
      time: Date.now(),
    }
    record.id = createHash(record)
    await storage.put(record)
    await storage.setLastId(record.id)
    return record
  }

  async _getOldestValidatedId(oldest, newest) {
    while (newest !== oldest) {
      const record = await this._storage.get(newest)
      if (record === undefined) {
        return {
          id: newest,
          reason: 'inability to reach the oldest record',
        }
      }
      if (
        newest !==
        createHash(
          record,
          ID_TO_ALGORITHM[newest.slice(1, newest.indexOf('$', 1))]
        )
      ) {
        return {
          id: newest,
          reason: 'altered record',
        }
      }
      newest = record.previousId
    }
    return { id: oldest }
  }

  // TODO: https://github.com/vatesfr/xen-orchestra/pull/4733#discussion_r366897798
  async checkIntegrity(oldest, newest) {
    const { id, reason } = await this._getOldestValidatedId(oldest, newest)
    if (id !== oldest) {
      throw new Error(`${reason} (stopped at ${id})`)
    }
  }

  async *getFrom(newest) {
    const storage = this._storage

    let record
    let id = newest ?? (await storage.getLastId())
    while ((record = await storage.get(id)) !== undefined) {
      yield record
      id = record.previousId
    }
  }

  async deleteFrom(newest) {
    for await (const { id } of this.getFrom(newest)) {
      await this._storage.del(id)
    }
  }
}
