'use strict'

const assert = require('assert/strict')
const { afterEach, describe, it } = require('tap').mocha

const { AlteredRecordError, AuditCore, MissingRecordError, NULL_ID, Storage } = require('.')

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
  assert.equal(records.length, DATA.length)
  return records
}

describe('auditCore', () => {
  afterEach(() => db._clear())

  it('detects that a record is missing', async () => {
    const [newestRecord, deletedRecord] = await storeAuditRecords()

    const nValidRecords = await auditCore.checkIntegrity(NULL_ID, newestRecord.id)
    assert.equal(nValidRecords, DATA.length)

    await db.del(deletedRecord.id)
    await assert.rejects(
      auditCore.checkIntegrity(NULL_ID, newestRecord.id),
      new MissingRecordError(deletedRecord.id, 1)
    )
  })

  it('detects that a record has been altered', async () => {
    const [newestRecord, alteredRecord] = await storeAuditRecords()

    alteredRecord.event = ''
    await db.put(alteredRecord)

    await assert.rejects(
      auditCore.checkIntegrity(NULL_ID, newestRecord.id),
      new AlteredRecordError(alteredRecord.id, 1, alteredRecord)
    )
  })

  it('confirms interval integrity after deletion of records outside of the interval', async () => {
    const [thirdRecord, secondRecord, firstRecord] = await storeAuditRecords()

    await auditCore.deleteFrom(secondRecord.id)

    assert.equal(await db.get(firstRecord.id), undefined)
    assert.equal(await db.get(secondRecord.id), undefined)

    await auditCore.checkIntegrity(secondRecord.id, thirdRecord.id)
  })
})
