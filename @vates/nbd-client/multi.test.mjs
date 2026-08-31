import { describe, it, mock } from 'node:test'
import assert from 'node:assert'

// MultiNbdClient instantiates NbdClient itself (`import NbdClient from './index.mjs'`), so the
// only way to control individual connections from a unit test is to replace that module with a
// fake before importing multi.mjs.
const created = []
class FakeNbdClient {
  constructor(nbdInfo) {
    this.nbdInfo = nbdInfo
    this.disconnected = false
    // overridden per-test after connect() to script this instance's behavior
    this.readBlock = async () => {
      throw new Error('readBlock not configured for this fake client')
    }
    created.push(this)
  }

  async connect() {}

  async disconnect() {
    this.disconnected = true
  }

  async getMap() {
    return []
  }
}

mock.module('./index.mjs', {
  defaultExport: FakeNbdClient,
})

const { default: MultiNbdClient } = await import('./multi.mjs')

// a single settings entry is enough: connect() reuses candidates across concurrent slots, so
// nbdConcurrency still yields that many distinct FakeNbdClient instances
async function connectWithFakes(nbdConcurrency) {
  created.length = 0
  const client = new MultiNbdClient({ address: 'fake-host' }, { nbdConcurrency })
  await client.connect()
  return { client, fakes: created.slice() }
}

describe('MultiNbdClient.readBlock eviction', () => {
  it('evicts a client whose readBlock rejects and retries on a surviving client', async () => {
    const { client, fakes } = await connectWithFakes(2)
    const [dead, alive] = fakes
    dead.readBlock = async () => {
      throw new Error('connection is dead')
    }
    alive.readBlock = async index => Buffer.from([index])

    // index 0 initially routes to `dead` (0 % 2 === 0)
    const data = await client.readBlock(0)

    assert.deepStrictEqual(data, Buffer.from([0]))
    assert.strictEqual(dead.disconnected, true, 'the dead client should have been disconnected')

    // future reads must no longer be routed to the evicted client: with only `alive` left,
    // every index should now succeed through it
    alive.readBlock = async index => Buffer.from([index])
    const data2 = await client.readBlock(1)
    assert.deepStrictEqual(data2, Buffer.from([1]))
  })

  it('rejects once every client has been evicted, instead of retrying forever', async () => {
    const { client, fakes } = await connectWithFakes(2)
    const boom = new Error('connection is dead')
    for (const fake of fakes) {
      fake.readBlock = async () => {
        throw boom
      }
    }

    await assert.rejects(() => client.readBlock(0), boom)
    assert.ok(
      fakes.every(fake => fake.disconnected),
      'every client should have been evicted (and disconnected) before giving up'
    )
  })

  it('evicting the same dead client from concurrent failed reads is idempotent', async () => {
    const { client, fakes } = await connectWithFakes(2)
    const [dead, alive] = fakes
    dead.readBlock = async () => {
      throw new Error('connection is dead')
    }
    alive.readBlock = async index => Buffer.from([index])

    let disconnectCalls = 0
    dead.disconnect = async () => {
      disconnectCalls++
      dead.disconnected = true
    }

    // routing is round-robin by call order (0, 1, 0) over a 2-client pool: the 1st and 3rd
    // calls both land on `dead` before either failure has been handled, so they race to evict
    // the same client. The exact interleaving isn't guaranteed, only that eviction is safe
    // either way and every read still completes.
    const [data0, data1, data2] = await Promise.all([client.readBlock(10), client.readBlock(11), client.readBlock(12)])

    assert.deepStrictEqual(data0, Buffer.from([10]))
    assert.deepStrictEqual(data1, Buffer.from([11]))
    assert.deepStrictEqual(data2, Buffer.from([12]))
    assert.strictEqual(disconnectCalls, 1, 'the dead client must only be evicted/disconnected once')
  })
})

describe('MultiNbdClient.readBlock routing', () => {
  it('distributes reads round-robin by call order, not by index residue', async () => {
    const { client, fakes } = await connectWithFakes(4)
    const readsPerClient = fakes.map(() => 0)
    fakes.forEach((fake, i) => {
      fake.readBlock = async index => {
        readsPerClient[i]++
        return Buffer.from([index])
      }
    })

    // a CBT-style changed-block set striding by exactly `nbdConcurrency`: under the old
    // `index % clients.length` routing this would collapse entirely onto a single client
    const stridedIndexes = Array.from({ length: 20 }, (_, i) => i * 4)
    for (const index of stridedIndexes) {
      await client.readBlock(index)
    }

    assert.deepStrictEqual(readsPerClient, [5, 5, 5, 5])
  })
})
