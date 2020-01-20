/* eslint-env jest */

import { AuditCore, NULL_ID, Storage } from '.'

const asyncIteratorToArray = async asyncIterator => {
  const array = []
  for await (const entry of asyncIterator) {
    array.push(entry)
  }
  return array
}

class DB extends Storage {
  constructor() {
    super()

    this._db = new Map()
    this._lastId = undefined
  }

  async put(record) {
    this._db.set(record.id, record)
  }

  async setLastId(id) {
    this._lastId = id
  }

  async getLastId() {
    return this._lastId
  }

  async del(id) {
    this._db.delete(id)
  }

  async get(id) {
    return this._db.get(id)
  }

  _clear() {
    return this._db.clear()
  }
}

const DATA = [
  [
    {
      name: 'subject0',
    },
    'event0',
    {},
  ],
  [
    {
      name: 'subject1',
    },
    'event1',
    {},
  ],
  [
    {
      name: 'subject2',
    },
    'event2',
    {},
  ],
]

const db = new DB()
const auditCore = new AuditCore(db)
const storeAuditRecords = async () => {
  await Promise.all(DATA.map(data => auditCore.add(...data)))
  const records = await asyncIteratorToArray(auditCore.getFrom())
  expect(records.length).toBe(DATA.length)
  return records
}

describe('auditCore', () => {
  afterEach(() => db._clear())

  it('detects that a record is missing', async () => {
    const [newestRecord, deletedRecord] = await storeAuditRecords()

    await auditCore.checkIntegrity(NULL_ID, newestRecord.id)

    await db.del(deletedRecord.id)
    await expect(
      auditCore.checkIntegrity(NULL_ID, newestRecord.id)
    ).rejects.toThrow(
      `inability to reach the oldest record (stopped at ${deletedRecord.id})`
    )
  })

  it('detects that a record has been altered', async () => {
    const [newestRecord, alteredRecord] = await storeAuditRecords()

    await db.put({
      ...alteredRecord,
      event: '',
    })
    await expect(
      auditCore.checkIntegrity(NULL_ID, newestRecord.id)
    ).rejects.toThrow(`altered record (stopped at ${alteredRecord.id})`)
  })

  it('confirms interval integrity after deletion of records outside of the interval', async () => {
    const [thirdRecord, secondRecord, firstRecord] = await storeAuditRecords()

    await auditCore.deleteFrom(secondRecord.id)

    expect(await db.get(firstRecord.id)).toBe(undefined)
    expect(await db.get(secondRecord.id)).toBe(undefined)

    await auditCore.checkIntegrity(secondRecord.id, thirdRecord.id)
  })
})
