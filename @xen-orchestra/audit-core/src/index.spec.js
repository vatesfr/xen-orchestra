/* eslint-env jest */

import { AuditCore, FIRST_RECORD_ID } from '.'

import { asyncIteratorToArray } from './_asyncIteratorToArray'

class Storage {
  constructor() {
    this._db = new Map()
  }

  async put(id, record) {
    const db = this._db
    if (db.get(id) !== undefined) {
      throw new Error('the entry already exists')
    }
    db.set(id, record)
  }

  async del(id) {
    this._db.delete(id)
  }

  async get(id) {
    return this._db.get(id)
  }

  async set(id, record) {
    this._db.set(id, record)
  }

  async getLastId() {
    return Array.from(this._db.keys()).pop()
  }

  async setLastRecord(record) {
    this._db.set(await this.getLastId(), record)
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
  it('stores audit records, check their integrity, deletes a record and re-check the records integrity', async () => {
    const storage = new Storage()
    const auditCore = new AuditCore(storage)
    for (const [subject, event, data] of DATA) {
      await auditCore.add(subject, event, data)
    }
    const records = await asyncIteratorToArray(auditCore.getFrom())
    expect(records.length).toBe(DATA.length)

    const newestId = await storage.getLastId()
    await auditCore.checkIntegrity(FIRST_RECORD_ID, newestId)

    await storage.del(records[1].id)
    await expect(
      auditCore.checkIntegrity(FIRST_RECORD_ID, newestId)
    ).rejects.toThrow()
  })

  it('deletes records starting from an ID', async () => {
    const storage = new Storage()
    const auditCore = new AuditCore(storage)
    for (const [subject, event, data] of DATA) {
      await auditCore.add(subject, event, data)
    }

    const [firstRecord, secondRecord] = (
      await asyncIteratorToArray(auditCore.getFrom())
    ).reverse()
    await auditCore.deleteFrom(secondRecord.id)
    expect(await storage.get(firstRecord.id)).toBe(undefined)
    expect(await storage.get(secondRecord.id)).toBe(undefined)
  })
})
