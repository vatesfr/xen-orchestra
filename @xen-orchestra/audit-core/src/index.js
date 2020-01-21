// see https://github.com/babel/babel/issues/8450
import 'core-js/features/symbol/async-iterator'

import assert from 'assert'
import defer from 'golike-defer'
import hash from 'object-hash'

export class Storage {
  constructor() {
    this._lock = Promise.resolve()
  }

  async acquireLock() {
    const lock = this._lock
    let releaseLock
    this._lock = new Promise(resolve => {
      releaseLock = resolve
    })
    await lock
    return releaseLock
  }
}

// Format: $<algorithm>$<salt>$<encrypted>
//
// http://man7.org/linux/man-pages/man3/crypt.3.html#NOTES
const ID_TO_ALGORITHM = {
  '5': 'sha256',
}

export const NULL_ID = 'nullId'

const HASH_ALGORITHM_ID = '5'
const createHash = (data, algorithmId = HASH_ALGORITHM_ID) =>
  `$${algorithmId}$$${hash(data, {
    algorithm: ID_TO_ALGORITHM[algorithmId],
    excludeKeys: key => key === 'id',
  })}`

export class AuditCore {
  constructor(storage) {
    assert.notStrictEqual(storage, undefined)
    this._storage = storage
  }

  @defer
  async add($defer, subject, event, data) {
    const time = Date.now()
    const storage = this._storage
    $defer(await storage.acquireLock())
    const record = {
      data,
      event,
      previousId: (await storage.getLastId()) ?? NULL_ID,
      subject,
      time,
    }
    record.id = createHash(record)
    await storage.put(record)
    await storage.setLastId(record.id)
    return record
  }

  // TODO: https://github.com/vatesfr/xen-orchestra/pull/4733#discussion_r366897798
  async checkIntegrity(oldest, newest) {
    while (newest !== oldest) {
      const record = await this._storage.get(newest)
      if (record === undefined) {
        const error = new Error('missing record')
        error.id = newest
        throw error
      }
      if (
        newest !== createHash(record, newest.slice(1, newest.indexOf('$', 1)))
      ) {
        const error = new Error('altered record')
        error.id = newest
        error.record = record
        throw error
      }
      newest = record.previousId
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
    assert.notStrictEqual(newest, undefined)
    assert(newest !== undefined)
    for await (const { id } of this.getFrom(newest)) {
      await this._storage.del(id)
    }
  }
}
