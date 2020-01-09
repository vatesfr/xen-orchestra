/* eslint-env jest */

import { AuditCore } from '.'

class Storage extends Map {
  async add(id, record) {
    this.set(id, record)
  }

  async update(id, cb) {
    this.set(id, cb(this.get(id)))
  }

  async del(id) {
    this.delete(id)
  }

  async getAll() {
    const collection = {}
    this.forEach((value, key) => {
      collection[key] = value
    })
    return collection
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

const HASHES_ALGORITHM = 'sha256'
describe('auditCore', () => {
  it('stores audit records, generate secured interval, deletes a record, check the records integrity and re-write hashes', async () => {
    const storage = new Storage()
    const auditCore = new AuditCore(storage, {
      algorithm: HASHES_ALGORITHM,
      retention: 3,
    })
    for (const [subject, event, data] of DATA) {
      await auditCore.add(subject, event, data)
    }

    const { startHash, endHash } = await auditCore.generateSecuredInterval()

    const { hashes } = await auditCore.getData()
    await storage.del(hashes[1])
    await expect(
      auditCore.checkIntegrity(startHash.hash, endHash.hash)
    ).rejects.toThrow()

    await auditCore.reWriteHashes()
  })

  test('.gc()', async () => {
    const retention = DATA.length - 1
    const auditCore = new AuditCore(new Storage(), {
      algorithm: HASHES_ALGORITHM,
      retention,
    })
    for (const [subject, event, data] of DATA) {
      await auditCore.add(subject, event, data)
    }

    await auditCore.generateSecuredInterval()

    const getDataSize = () =>
      auditCore.getData().then(({ hashes }) => hashes.length)

    expect(await getDataSize()).toBe(DATA.length)

    await auditCore.gc()

    expect(await getDataSize()).toBe(retention)
  })
})
