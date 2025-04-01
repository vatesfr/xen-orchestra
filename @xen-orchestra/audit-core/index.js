'use strict'

const assert = require('assert')
const hash = require('object-hash')
const { createLogger } = require('@xen-orchestra/log')
const { decorateClass } = require('@vates/decorate-with')
const { defer } = require('golike-defer')

const log = createLogger('xo:audit-core')

exports.Storage = class Storage {
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
  5: 'sha256',
}

class AlteredRecordError extends Error {
  constructor(id, nValid, record) {
    super('altered record')

    this.id = id
    this.nValid = nValid
    this.record = record
  }
}
exports.AlteredRecordError = AlteredRecordError

class MissingRecordError extends Error {
  constructor(id, nValid) {
    super('missing record')

    this.id = id
    this.nValid = nValid
  }
}
exports.MissingRecordError = MissingRecordError

const NULL_ID = 'nullId'
exports.NULL_ID = NULL_ID

const HASH_ALGORITHM_ID = '5'
const createHash = (data, algorithmId = HASH_ALGORITHM_ID) =>
  `$${algorithmId}$$${hash(data, {
    algorithm: ID_TO_ALGORITHM[algorithmId],
    excludeKeys: key => key === 'id',
  })}`

class AuditCore {
  constructor(storage) {
    assert.notStrictEqual(storage, undefined)
    this._storage = storage
  }

  async add($defer, subject, event, data) {
    const time = Date.now()
    $defer(await this._storage.acquireLock())
    return this._addUnsafe({
      data,
      event,
      subject,
      time,
    })
  }

  async _addUnsafe({ data, event, subject, time }) {
    const storage = this._storage

    // delete "undefined" properties and normalize data with JSON.stringify
    const record = JSON.parse(
      JSON.stringify({
        data,
        event,
        previousId: (await storage.getLastId()) ?? NULL_ID,
        subject,
        time,
      })
    )
    record.id = createHash(record)
    await storage.put(record)
    await storage.setLastId(record.id)
    return record
  }

  async _importRecord(record) {
    // TODO: we should check the chain continuity, but then we can't import separate chains of logs
    if (record.id !== createHash(record)) {
      throw new Error('Unhealthy chain import')
    }
    await this._storage.put(record)
    return record.id
  }

  async checkIntegrity(oldest, newest) {
    const storage = this._storage

    // handle separated chains case
    if (newest !== (await storage.getLastId())) {
      let isNewestAccessible = false
      for await (const { id } of this.getFrom()) {
        if (id === newest) {
          isNewestAccessible = true
          break
        }
      }
      if (!isNewestAccessible) {
        throw new MissingRecordError(newest, 0)
      }
    }

    let nValid = 0
    while (newest !== oldest) {
      const record = await storage.get(newest)
      if (record === undefined) {
        throw new MissingRecordError(newest, nValid)
      }
      if (newest !== createHash(record, newest.slice(1, newest.indexOf('$', 1)))) {
        throw new AlteredRecordError(newest, nValid, record)
      }
      newest = record.previousId
      nValid++
    }
    return nValid
  }

  get(id) {
    return this._storage.get(id)
  }

  async *getFrom(newest) {
    const storage = this._storage

    let id = newest ?? (await storage.getLastId())
    if (id === undefined) {
      return
    }

    let record
    while ((record = await storage.get(id)) !== undefined) {
      yield record
      id = record.previousId
    }
  }

  async deleteFrom(newest) {
    assert.notStrictEqual(newest, undefined)
    for await (const { id } of this.getFrom(newest)) {
      await this._storage.del(id)
    }
  }

  async deleteRangeAndRewrite($defer, newest, oldest) {
    assert.notStrictEqual(newest, undefined)
    assert.notStrictEqual(oldest, undefined)

    const storage = this._storage
    $defer(await storage.acquireLock())

    assert.notStrictEqual(await storage.get(newest), undefined)
    const oldestRecord = await storage.get(oldest)
    assert.notStrictEqual(oldestRecord, undefined)

    const lastId = await storage.getLastId()
    const recentRecords = []
    for await (const record of this.getFrom(lastId)) {
      if (record.id === newest) {
        break
      }

      recentRecords.push(record)
    }

    for await (const record of this.getFrom(newest)) {
      await storage.del(record.id)
      if (record.id === oldest) {
        break
      }
    }

    await storage.setLastId(oldestRecord.previousId)

    for (const record of recentRecords) {
      try {
        await this._addUnsafe(record)
        await storage.del(record.id)
      } catch (error) {
        log.error(error)
      }
    }
  }
}
exports.AuditCore = AuditCore

decorateClass(AuditCore, {
  add: defer,
  deleteRangeAndRewrite: defer,
})
