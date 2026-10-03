import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { setTimeout as pDelay } from 'node:timers/promises'

import { NBD_WRITE_CONCURRENCY, NBD_WRITE_SIZE, NbdDiskWriter } from './NbdDiskWriter.mjs'

const MiB = 1024 * 1024

// an export in memory, which records what is done to it
class FakeClient {
  calls = []
  inFlight = 0
  maxInFlight = 0
  canFlush = true

  constructor(exportSize, { failFlush = false } = {}) {
    this.data = Buffer.alloc(exportSize, 0xee)
    this.exportSize = BigInt(exportSize)
    this.failFlush = failFlush
  }

  async writeBlock(index, data, size) {
    const offset = index * size
    assert.ok(offset + data.length <= this.data.length, 'write beyond the export')
    assert.ok(data.length <= NBD_WRITE_SIZE, 'request too large')
    this.maxInFlight = Math.max(this.maxInFlight, ++this.inFlight)
    await pDelay(1)
    data.copy(this.data, offset)
    this.inFlight--
  }

  async flush() {
    this.calls.push('flush')
    if (this.failFlush) {
      throw new Error('flush failed')
    }
  }

  async disconnect() {
    this.calls.push('disconnect')
  }
}

// the disk-transform interface used by the writer
function fakeDisk(blockSize, blocks) {
  return {
    released: 0,
    getBlockSize: () => blockSize,
    async *diskBlocks() {
      for (const [index, data] of blocks) {
        yield { index, data, release: () => this.released++ }
      }
    },
  }
}

describe('NbdDiskWriter', () => {
  it('writes the blocks at their place, several at a time, and leaves the rest untouched', async () => {
    const client = new FakeClient(64 * MiB)
    const writer = new NbdDiskWriter(client, async () => {})
    const indexes = Array.from({ length: 20 }, (_, i) => i + 5)
    const disk = fakeDisk(
      2 * MiB,
      indexes.map(index => [index, Buffer.alloc(2 * MiB, index)])
    )

    assert.equal(await writer.writeDisk(disk), 20 * 2 * MiB)
    assert.equal(client.maxInFlight, NBD_WRITE_CONCURRENCY)
    assert.equal(disk.released, 20)
    for (const index of indexes) {
      assert.ok(client.data.subarray(index * 2 * MiB, (index + 1) * 2 * MiB).every(byte => byte === index))
    }
    assert.ok(
      client.data.subarray(0, 5 * 2 * MiB).every(byte => byte === 0xee),
      'not written'
    )
  })

  it('splits the blocks larger than a request', async () => {
    const client = new FakeClient(16 * MiB)
    const writer = new NbdDiskWriter(client, async () => {})
    const data = Buffer.concat([Buffer.alloc(2 * MiB, 1), Buffer.alloc(2 * MiB, 2)])
    await writer.writeDisk(fakeDisk(4 * MiB, [[2, data]]))
    assert.ok(client.data.subarray(8 * MiB, 12 * MiB).equals(data))
  })

  it('handles a disk a bit larger or smaller than the export', async () => {
    // larger: only zeroes can be beyond the export
    const small = new FakeClient(3 * MiB)
    const writer = new NbdDiskWriter(small, async () => {})
    const tail = Buffer.concat([Buffer.alloc(MiB, 7), Buffer.alloc(MiB)])
    await writer.writeDisk(
      fakeDisk(2 * MiB, [
        [1, tail],
        [2, Buffer.alloc(2 * MiB)],
      ])
    )
    assert.ok(small.data.subarray(2 * MiB).every(byte => byte === 7))
    await assert.rejects(
      writer.writeDisk(fakeDisk(2 * MiB, [[1, Buffer.alloc(2 * MiB, 1)]])),
      /beyond the end of the export/
    )

    // smaller: the last block is completed with zeroes
    const large = new FakeClient(6 * MiB)
    await new NbdDiskWriter(large, async () => {}).writeDisk(fakeDisk(2 * MiB, [[1, Buffer.alloc(MiB, 3)]]))
    assert.ok(large.data.subarray(2 * MiB, 3 * MiB).every(byte => byte === 3))
    assert.ok(large.data.subarray(3 * MiB, 4 * MiB).every(byte => byte === 0))
    assert.ok(
      large.data.subarray(4 * MiB).every(byte => byte === 0xee),
      'not written'
    )
  })

  it('stops when the import is canceled', async () => {
    const client = new FakeClient(8 * MiB)
    const writer = new NbdDiskWriter(client, async () => {})
    const cancelToken = {
      throwIfRequested() {
        throw new Error('canceled')
      },
    }
    await assert.rejects(
      writer.writeDisk(fakeDisk(2 * MiB, [[0, Buffer.alloc(2 * MiB, 1)]]), { cancelToken }),
      /canceled/
    )
    assert.ok(client.data.every(byte => byte === 0xee))
  })

  it('flushes, disconnects then closes the export, and reports any failure', async () => {
    const calls = []
    const client = new FakeClient(2 * MiB)
    client.calls = calls
    await new NbdDiskWriter(client, async () => calls.push('close')).close()
    assert.deepEqual(calls, ['flush', 'disconnect', 'close'])

    // the data are only guaranteed by a successful close of the export
    const failingClose = new NbdDiskWriter(new FakeClient(2 * MiB), async () => {
      throw new Error('close failed')
    })
    await assert.rejects(failingClose.close(), /close failed/)

    // a failed flush still frees the connection and the export
    const failingFlush = new FakeClient(2 * MiB, { failFlush: true })
    const exportCalls = []
    failingFlush.calls = exportCalls
    await assert.rejects(new NbdDiskWriter(failingFlush, async () => exportCalls.push('close')).close(), /flush failed/)
    assert.deepEqual(exportCalls, ['flush', 'disconnect', 'close'])
  })

  it('aborts without throwing, closing the export only once', async () => {
    let closes = 0
    const writer = new NbdDiskWriter(new FakeClient(2 * MiB), async () => {
      closes++
      throw new Error('close failed')
    })
    await writer.abort()
    await writer.abort()
    assert.equal(closes, 1)
  })
})
