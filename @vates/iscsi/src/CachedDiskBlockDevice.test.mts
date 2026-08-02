import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { RandomAccessDisk, type DiskBlock } from '@xen-orchestra/disk-transform'

import { CachedDiskBlockDevice } from './CachedDiskBlockDevice.mjs'
import type { BlockDevice } from './backend.mjs'

const DISK_BLOCK_SIZE = 4096
const BLOCK_COUNT = 4
const DISK_SIZE = BLOCK_COUNT * DISK_BLOCK_SIZE

const bytePattern = (i: number) => (i * 31 + 11) & 0xff

/** Sparse source: only blocks 0 and 2 exist, like a differencing chain. */
class StubDisk extends RandomAccessDisk {
  readBlockCalls: Array<number> = []
  closed = false
  /** set to hold every fetch open until it resolves */
  pause?: Promise<void>

  constructor(readonly allocated: Set<number> = new Set([0, 2])) {
    super()
  }

  getBlockSize(): number {
    return DISK_BLOCK_SIZE
  }
  getVirtualSize(): number {
    return DISK_SIZE
  }
  isDifferencing(): boolean {
    return false
  }
  getBlockIndexes(): Array<number> {
    return [...this.allocated]
  }
  hasBlock(index: number): boolean {
    return this.allocated.has(index)
  }
  async init(): Promise<void> {}
  async close(): Promise<void> {
    this.closed = true
  }
  async readBlock(index: number): Promise<DiskBlock> {
    if (!this.allocated.has(index)) {
      throw new Error(`Block ${index} not found in chain`)
    }
    this.readBlockCalls.push(index)
    if (this.pause !== undefined) {
      await this.pause
    }
    const data = Buffer.alloc(DISK_BLOCK_SIZE)
    for (let i = 0; i < data.length; i++) {
      data[i] = bytePattern(index * DISK_BLOCK_SIZE + i)
    }
    return { index, data }
  }
}

/** In-memory stand-in for the local VDI. */
class StubCache implements BlockDevice {
  readonly content: Buffer
  writes: Array<{ offset: number; length: number }> = []
  closed = false
  flushed = 0
  failNextWrite = false

  constructor(size = DISK_SIZE) {
    this.content = Buffer.alloc(size)
  }

  getSize(): number {
    return this.content.length
  }
  getBlockSize(): number {
    return 512
  }
  async read(offset: number, length: number): Promise<Buffer> {
    return Buffer.from(this.content.subarray(offset, offset + length))
  }
  async write(offset: number, data: Buffer): Promise<void> {
    if (this.failNextWrite) {
      this.failNextWrite = false
      throw new Error('cache write failed')
    }
    this.writes.push({ offset, length: data.length })
    data.copy(this.content, offset)
  }
  async flush(): Promise<void> {
    this.flushed++
  }
  async close(): Promise<void> {
    this.closed = true
  }
}

const expectedAt = (offset: number, length: number, allocated: Set<number>): Buffer => {
  const expected = Buffer.alloc(length)
  for (let i = 0; i < length; i++) {
    const absolute = offset + i
    if (allocated.has(Math.floor(absolute / DISK_BLOCK_SIZE))) {
      expected[i] = bytePattern(absolute)
    }
  }
  return expected
}

const make = async (allocated?: Set<number>, cacheSize?: number) => {
  const disk = new StubDisk(allocated)
  const cache = new StubCache(cacheSize)
  const device = new CachedDiskBlockDevice({ disk, cache })
  await device.open()
  return { cache, device, disk }
}

describe('open', () => {
  it('exposes the disk capacity and a fully cold bitmap', async () => {
    const { device } = await make()
    assert.equal(device.getSize(), DISK_SIZE)
    assert.equal(device.getBlockSize(), 512)
    assert.deepEqual(device.getMaterialized(), { blocks: 0, total: BLOCK_COUNT })
  })

  it('refuses a cache smaller than the disk', async () => {
    const device = new CachedDiskBlockDevice({ disk: new StubDisk(), cache: new StubCache(DISK_SIZE - 512) })
    await assert.rejects(device.open(), /smaller than the disk/)
  })
})

describe('read', () => {
  it('materializes a block on first read and serves later ones from the cache', async () => {
    const { device, disk, cache } = await make()

    assert.deepEqual(await device.read(0, 512), expectedAt(0, 512, disk.allocated))
    assert.deepEqual(disk.readBlockCalls, [0])
    // the whole source block was written, not just the part that was read
    assert.deepEqual(cache.writes, [{ offset: 0, length: DISK_BLOCK_SIZE }])
    assert.deepEqual(device.getMaterialized(), { blocks: 1, total: BLOCK_COUNT })

    // a second read of a different part of the same block does not go back
    assert.deepEqual(await device.read(1024, 512), expectedAt(1024, 512, disk.allocated))
    assert.deepEqual(disk.readBlockCalls, [0])
    assert.equal(cache.writes.length, 1)
  })

  it('marks a hole as present without writing it', async () => {
    const { device, disk, cache } = await make()

    assert.deepEqual(await device.read(DISK_BLOCK_SIZE, 512), Buffer.alloc(512))
    assert.deepEqual(disk.readBlockCalls, [])
    assert.deepEqual(cache.writes, [])
    assert.deepEqual(device.getMaterialized(), { blocks: 1, total: BLOCK_COUNT })
  })

  it('stitches a range spanning a present and a missing block', async () => {
    const { device, disk } = await make()
    const offset = DISK_BLOCK_SIZE - 512
    const length = DISK_BLOCK_SIZE + 1024

    assert.deepEqual(await device.read(offset, length), expectedAt(offset, length, disk.allocated))
    assert.deepEqual(disk.readBlockCalls, [0, 2])
  })

  it('fetches a block once for concurrent overlapping reads', async () => {
    const { device, disk } = await make()
    // hold the fetch open until both reads are in flight
    let release = () => {}
    disk.pause = new Promise<void>(resolve => {
      release = resolve
    })

    const first = device.read(0, 1024)
    const second = device.read(512, 1024)
    await new Promise(resolve => setImmediate(resolve))
    release()

    assert.deepEqual(await first, expectedAt(0, 1024, disk.allocated))
    assert.deepEqual(await second, expectedAt(512, 1024, disk.allocated))
    assert.deepEqual(disk.readBlockCalls, [0])
  })

  it('rejects a read past the end of the disk', async () => {
    const { device } = await make()
    await assert.rejects(device.read(DISK_SIZE - 256, 512), /out of range/)
  })

  it('clamps the tail block to the disk size', async () => {
    // 3 blocks + half a block, so the last source block runs past the end
    class ShortDisk extends StubDisk {
      getVirtualSize(): number {
        return 3 * DISK_BLOCK_SIZE + 2048
      }
    }
    const disk = new ShortDisk(new Set([3]))
    const cache = new StubCache(3 * DISK_BLOCK_SIZE + 2048)
    const device = new CachedDiskBlockDevice({ disk, cache })
    await device.open()

    await device.read(3 * DISK_BLOCK_SIZE, 2048)
    assert.deepEqual(cache.writes, [{ offset: 3 * DISK_BLOCK_SIZE, length: 2048 }])
  })
})

describe('write', () => {
  it('lands in the cache and is readable back, without touching the source', async () => {
    const { device, cache, disk } = await make()
    const payload = Buffer.alloc(512, 0xee)

    await device.write(0, payload)

    assert.deepEqual(await device.read(0, 512), payload)
    // the block was materialized first, since the write covers only part of it
    assert.deepEqual(disk.readBlockCalls, [0])
    // ... and the bytes after the write are still the source's
    assert.deepEqual(await device.read(512, 512), expectedAt(512, 512, disk.allocated))
    assert.equal(cache.closed, false)
  })

  it('skips the fetch when the write covers whole blocks', async () => {
    const { device, disk } = await make()

    await device.write(0, Buffer.alloc(DISK_BLOCK_SIZE, 0xee))

    assert.deepEqual(disk.readBlockCalls, [])
    assert.deepEqual(device.getMaterialized(), { blocks: 1, total: BLOCK_COUNT })
  })

  it('leaves the block cold when the cache write fails', async () => {
    const { device, cache, disk } = await make()
    cache.failNextWrite = true

    await assert.rejects(device.write(0, Buffer.alloc(DISK_BLOCK_SIZE, 0xee)), /cache write failed/)

    assert.deepEqual(device.getMaterialized(), { blocks: 0, total: BLOCK_COUNT })
    // so a later read still materializes from the source
    await device.read(0, 512)
    assert.deepEqual(disk.readBlockCalls, [0])
  })
})

describe('flush and close', () => {
  it('flushes the cache', async () => {
    const { device, cache } = await make()
    await device.flush()
    assert.equal(cache.flushed, 1)
  })

  it('closes the cache and the disk', async () => {
    const { device, cache, disk } = await make()
    await device.close()
    assert.equal(cache.closed, true)
    assert.equal(disk.closed, true)
  })

  it('still closes the disk when closing the cache fails', async () => {
    const { device, cache, disk } = await make()
    cache.close = async () => {
      throw new Error('nope')
    }
    await assert.rejects(device.close(), /nope/)
    assert.equal(disk.closed, true)
  })
})
