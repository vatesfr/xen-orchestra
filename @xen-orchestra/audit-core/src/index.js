import assert from 'assert'
import hash from 'object-hash'
import synchronized from 'decorator-synchronized'
import { invert } from 'lodash'

// Format: $<algorithm>$<salt>$<encrypted>
//
// http://man7.org/linux/man-pages/man3/crypt.3.html#NOTES
const ALGORITHM_TO_ID = {
  md5: '1',
  sha256: '5',
  sha512: '6',
}

const ID_TO_ALGORITHM = invert(ALGORITHM_TO_ID)

export const FIRST_RECORD_ID =
  'd71c3697567bf73a5731f8061c65f523019b49f2ed58067164577a58db5c53ac'

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

  @synchronized()
  async add(subject, event, data) {
    const storage = this._storage
    const record = {
      data,
      event,
      previousId: (await storage.getLastId()) ?? FIRST_RECORD_ID,
      subject,
      time: Date.now(),
    }
    record.id = createHash(record)
    await storage.put(record.id, record)
    return record
  }

  async checkCorrespondence(newest) {
    while (newest !== FIRST_RECORD_ID) {
      const record = await this._storage.get(newest)
      if (
        record === undefined ||
        newest !==
          createHash(
            record,
            ID_TO_ALGORITHM[newest.slice(1, newest.indexOf('$', 1))]
          )
      ) {
        return newest
      }
      newest = record.previousId
    }
    return FIRST_RECORD_ID
  }

  async checkIntegrity(oldest, newest) {
    const oldestVerifiedId = await this.checkCorrespondence(newest)
    if (oldestVerifiedId !== oldest) {
      throw new Error(
        `The records between ${oldest} and ${oldestVerifiedId} are altered`
      )
    }
  }

  async *getRecords() {
    const storage = this._storage

    let record
    let id = await storage.getLastId()
    while ((record = await storage.get(id)) !== undefined) {
      yield record
      id = record.previousId
    }
  }
}
