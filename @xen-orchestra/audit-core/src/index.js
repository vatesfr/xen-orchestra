import assert from 'assert'
import createLogger from '@xen-orchestra/log'
import hash from 'object-hash'
import synchronized from 'decorator-synchronized'
import { invert, omit, sortBy } from 'lodash'

const log = createLogger('xo:audit-core')

// Format: $<algorithm>$<salt>$<encrypted>
//
// http://man7.org/linux/man-pages/man3/crypt.3.html#NOTES
const ALGORITHM_TO_ID = {
  md5: '1',
  sha256: '5',
  sha512: '6',
}

const ID_TO_ALGORITHM = invert(ALGORITHM_TO_ID)

const synchronizedFns = synchronized()

export class AuditCore {
  constructor(storage, { algorithm, retention }) {
    assert(storage !== undefined && algorithm !== undefined)

    this._algorithm = algorithm
    this._retention = retention
    this._storage = storage
  }

  _createHash(data, algorithm = this._algorithm) {
    return `$${ALGORITHM_TO_ID[algorithm]}$$${hash(data, {
      algorithm,
    })}`
  }

  @synchronizedFns
  async add(subject, event, data) {
    const record = {
      data,
      event,
      previousHash: (await this.getData()).hashes.pop(),
      subject,
      time: Date.now(),
    }
    record.id = this._createHash(record)
    await this._storage.add(record.id, record)
    return record
  }

  async checkIntegrity(startHash, endHash) {
    const record = await this._storage.get(endHash)
    if (record === undefined) {
      throw new Error(
        `The record associated to the hash ${hash} doesn't exists`
      )
    }

    if (
      endHash !==
      this._createHash(
        omit(record, 'id'),
        ID_TO_ALGORITHM[endHash.slice(1, endHash.indexOf('$', 1))]
      )
    ) {
      throw new Error(`The hash ${hash} not correspond to the stored record`)
    }

    if (endHash === startHash) {
      return
    }

    if ((endHash = record.previousHash) === undefined) {
      throw new Error(
        `The records between ${startHash} and ${hash} are missing`
      )
    }

    return this.checkIntegrity(startHash, endHash)
  }

  async generateSecuredInterval() {
    const { hashes } = await this.getData()
    if (hashes.length === 0) {
      throw new Error('Empty storage')
    }

    const retention = this._retention
    if (retention !== undefined) {
      const diff = hashes.length - retention
      if (diff > 0) {
        hashes.splice(0, diff)
      }
    }

    const startHash = hashes[0]
    const endHash = hashes.pop()
    await this.checkIntegrity(startHash, endHash)

    const storage = this._storage
    const result = {
      startHash: {
        hash: startHash,
        time: (await storage.get(startHash)).time,
      },
      endHash: {
        hash: endHash,
        time: (await storage.get(endHash)).time,
      },
    }
    await this._storage.update('', globalData => ({
      ...globalData,
      ...result,
    }))

    return result
  }

  async getData() {
    const { '': globalData = {}, ...records } =
      (await this._storage.getAll()) ?? {}
    const sortedRecords = sortBy(records, 'time')
    return {
      '': globalData,
      hashes: sortedRecords.map(({ id }) => id),
      records: sortedRecords,
    }
  }

  async gc() {
    const { startHash } = (await this._storage.get('')) ?? {}
    if (startHash === undefined) {
      return
    }

    const storage = this._storage
    let record = await storage.get(startHash.hash)
    if (record === undefined) {
      throw new Error(
        `the records corresponding to the start hash (${startHash.hash}) doesn't exists`
      )
    }

    const promises = []
    while ((record = await storage.get(record.previousHash)) !== undefined) {
      promises.push(storage.del(record.id))
    }

    return Promise.all(promises)
  }

  @synchronizedFns
  async reWriteHashes() {
    const { records } = await this.getData()
    if (records.length === 0) {
      throw new Error('Empty storage')
    }

    const storage = this._storage
    let previousHash
    for (const { id, ...record } of records) {
      record.previousHash = previousHash
      record.id = this._createHash(record)
      await storage.add(record.id, record)
      storage.del(id).catch(log.warn)

      previousHash = record.id
    }
    return this.generateSecuredInterval()
  }

  async del(hash) {
    await this._storage.del(hash)
    return this.reWriteHashes()
  }
}
