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
}

const DATA = [
  [
    {
      id: '87b98aae-32c6-11ea-978f-2e728ce88125',
      ip: '192.168.100.212',
      name: 'toto',
    },
    'add',
    {
      parameters: {
        name: 'resource',
        id: 'b40f49ea-32c6-11ea-aec2-2e728ce88125',
      },
      result: 'success',
    },
  ],
  [
    {
      id: '87b98d2e-32c6-11ea-978f-2e728ce88125',
      ip: '192.168.100.5',
      name: 'titi',
    },
    'del',
    { result: 'success' },
  ],
  [
    {
      id: '87b98e8c-32c6-11ea-978f-2e728ce88125',
      ip: '192.168.100.111',
      name: 'foo',
    },
    'del',
    {
      result: 'success',
    },
  ],
]

describe('auditCore', () => {
  it('test storage lock on storing records', async () => {
    const auditCore = new AuditCore(new DB())
    await Promise.all([auditCore.add(...DATA[0]), auditCore.add(...DATA[1])])
    const records = await asyncIteratorToArray(auditCore.getFrom())
    expect(records.length).toBe(2)
  })

  it('stores audit records, check their integrity, deletes a record and re-check the records integrity', async () => {
    const db = new DB()
    const auditCore = new AuditCore(db)
    for (const [subject, event, data] of DATA) {
      await auditCore.add(subject, event, data)
    }
    const records = await asyncIteratorToArray(auditCore.getFrom())
    expect(records.length).toBe(DATA.length)

    const newestId = await db.getLastId()
    await auditCore.checkIntegrity(NULL_ID, newestId)

    await db.del(records[1].id)
    await expect(auditCore.checkIntegrity(NULL_ID, newestId)).rejects.toThrow()
  })

  it('deletes records starting from an ID and check their integrity', async () => {
    const db = new DB()
    const auditCore = new AuditCore(db)
    for (const [subject, event, data] of DATA) {
      await auditCore.add(subject, event, data)
    }

    const [firstRecord, secondRecord] = (
      await asyncIteratorToArray(auditCore.getFrom())
    ).reverse()
    await auditCore.deleteFrom(secondRecord.id)

    expect(await db.get(firstRecord.id)).toBe(undefined)
    expect(await db.get(secondRecord.id)).toBe(undefined)

    await auditCore.checkIntegrity(secondRecord.id, await db.getLastId())
  })
})
