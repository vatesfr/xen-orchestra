import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { RandomAccessDisk, type DiskBlock, type ProgressHandler } from '@xen-orchestra/disk-transform'

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

  it('resumes from an initial bitmap of the right length', async () => {
    // all blocks allocated, so the not-yet-cached one below is a real fetch,
    // not a hole (which would never call readBlock regardless of the bitmap)
    const disk = new StubDisk(new Set([0, 1, 2, 3]))
    const cache = new StubCache()
    const initialBitmap = Buffer.alloc(BLOCK_COUNT)
    initialBitmap[0] = 1
    initialBitmap[2] = 1
    const device = new CachedDiskBlockDevice({ disk, cache, initialBitmap })
    await device.open()

    assert.deepEqual(device.getMaterialized(), { blocks: 2, total: BLOCK_COUNT })
    // already marked cached: served from the (empty) cache store, source untouched
    assert.deepEqual(await device.read(0, 512), Buffer.alloc(512))
    assert.deepEqual(disk.readBlockCalls, [])
    // not marked cached: still fetched from the source as usual
    assert.deepEqual(await device.read(DISK_BLOCK_SIZE, 512), expectedAt(DISK_BLOCK_SIZE, 512, disk.allocated))
    assert.deepEqual(disk.readBlockCalls, [1])
  })

  it('discards an initial bitmap of the wrong length and starts cold', async () => {
    const disk = new StubDisk()
    const cache = new StubCache()
    const device = new CachedDiskBlockDevice({ disk, cache, initialBitmap: Buffer.alloc(BLOCK_COUNT - 1, 1) })
    await device.open()

    assert.deepEqual(device.getMaterialized(), { blocks: 0, total: BLOCK_COUNT })
    assert.deepEqual(await device.read(0, 512), expectedAt(0, 512, disk.allocated))
    assert.deepEqual(disk.readBlockCalls, [0])
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

  it('materializes the block even when the write covers it entirely', async () => {
    const { device, disk } = await make()

    await device.write(0, Buffer.alloc(DISK_BLOCK_SIZE, 0xee))

    // the fetch cannot be skipped: see the race covered by the next test
    assert.deepEqual(disk.readBlockCalls, [0])
    assert.deepEqual(device.getMaterialized(), { blocks: 1, total: BLOCK_COUNT })
  })

  it('is not overwritten by a fetch already in flight when it lands', async () => {
    const { device, disk } = await make()
    // hold block 0's fetch open, so the write lands while it is in flight
    let release = () => {}
    disk.pause = new Promise<void>(resolve => {
      release = resolve
    })

    const reading = device.read(0, 512)
    await new Promise(resolve => setImmediate(resolve))

    const payload = Buffer.alloc(DISK_BLOCK_SIZE, 0xee)
    const writing = device.write(0, payload)
    await new Promise(resolve => setImmediate(resolve))
    release()

    await reading
    await writing

    // the source block was fetched once, and its bytes did not come back on top
    assert.deepEqual(disk.readBlockCalls, [0])
    assert.deepEqual(await device.read(0, DISK_BLOCK_SIZE), payload)
  })
})

describe('hydrate', () => {
  it('materializes every block the source has, holes included', async () => {
    const { device, disk, cache } = await make()

    await device.hydrate()

    assert.deepEqual(device.getMaterialized(), { blocks: BLOCK_COUNT, total: BLOCK_COUNT })
    // only the allocated ones were actually fetched...
    assert.deepEqual([...disk.readBlockCalls].sort(), [0, 2])
    // ...and the whole disk now reads correctly straight from the cache
    assert.deepEqual(await cache.read(0, DISK_SIZE), expectedAt(0, DISK_SIZE, disk.allocated))
  })

  it('skips blocks already materialized by an earlier read', async () => {
    const { device, disk } = await make()
    await device.read(0, 512)
    assert.deepEqual(disk.readBlockCalls, [0])

    await device.hydrate()

    // block 0 was not fetched a second time
    assert.deepEqual(disk.readBlockCalls, [0, 2])
    assert.deepEqual(device.getMaterialized(), { blocks: BLOCK_COUNT, total: BLOCK_COUNT })
  })

  it('is a no-op once fully materialized', async () => {
    const { device, disk } = await make()
    await device.hydrate()
    disk.readBlockCalls.length = 0

    await device.hydrate()

    assert.deepEqual(disk.readBlockCalls, [])
  })

  it('stops on an aborted signal, keeping what it already cached', async () => {
    const disk = new StubDisk(new Set([0, 1, 2, 3]))
    const cache = new StubCache()
    const device = new CachedDiskBlockDevice({ disk, cache })
    await device.open()

    // every block but the first parks, so the hydration is still mid-flight
    // when it is aborted
    let release = () => {}
    const parked = new Promise<void>(resolve => {
      release = resolve
    })
    disk.readBlock = async index => {
      if (index > 0) {
        await parked
      }
      return { index, data: Buffer.alloc(DISK_BLOCK_SIZE, index) }
    }
    const controller = new AbortController()

    const hydrating = device.hydrate({ concurrency: 1, signal: controller.signal })
    for (let turn = 0; turn < 20 && device.getMaterialized().blocks === 0; turn++) {
      await new Promise(resolve => setImmediate(resolve))
    }
    assert.deepEqual(device.getMaterialized(), { blocks: 1, total: BLOCK_COUNT })

    controller.abort()

    // aborting is a failure, not a silent partial success
    await assert.rejects(hydrating)
    // and the block already cached stays cached, so a later hydration resumes
    assert.deepEqual(device.getMaterialized(), { blocks: 1, total: BLOCK_COUNT })
    release() // let the parked fetch finish rather than leaving it dangling
  })

  it('refuses to start on an already-aborted signal', async () => {
    const { device, disk } = await make()
    const controller = new AbortController()
    controller.abort()

    await assert.rejects(device.hydrate({ signal: controller.signal }))

    assert.deepEqual(disk.readBlockCalls, [])
    assert.deepEqual(device.getMaterialized(), { blocks: 0, total: BLOCK_COUNT })
  })

  it('respects the concurrency limit', async () => {
    const disk = new StubDisk(new Set([0, 1, 2, 3]))
    const cache = new StubCache()
    const device = new CachedDiskBlockDevice({ disk, cache })
    await device.open()

    let inFlight = 0
    let maxInFlight = 0
    const releases: Array<() => void> = []
    disk.readBlock = async index => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise<void>(resolve => releases.push(resolve))
      inFlight--
      return { index, data: Buffer.alloc(DISK_BLOCK_SIZE) }
    }

    const hydrating = device.hydrate({ concurrency: 2 })
    // let the first batch start
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(maxInFlight, 2)
    while (releases.length > 0) {
      releases.shift()!()
      await new Promise(resolve => setImmediate(resolve))
    }
    await hydrating

    assert.equal(maxInFlight, 2)
  })
})

describe('progress handler', () => {
  class StubProgressHandler implements ProgressHandler {
    calls: Array<number> = []
    doneCalls = 0
    throwSync = false
    rejectAsync = false
    async setProgress(fraction: number): Promise<void> {
      this.calls.push(fraction)
      if (this.throwSync) {
        throw new Error('sync failure')
      }
      if (this.rejectAsync) {
        throw new Error('async failure')
      }
    }
    done(): void {
      this.doneCalls++
    }
  }

  it('reports the materialized fraction as blocks are read, once each', async () => {
    const disk = new StubDisk()
    const cache = new StubCache()
    const progressHandler = new StubProgressHandler()
    const device = new CachedDiskBlockDevice({ disk, cache, progressHandler })
    await device.open()

    await device.read(0, 512)
    // let the fire-and-forget notification run
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(progressHandler.calls, [1 / BLOCK_COUNT])

    // a hole is a materialization too, just with nothing to write
    await device.read(DISK_BLOCK_SIZE, 512)
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(progressHandler.calls, [1 / BLOCK_COUNT, 2 / BLOCK_COUNT])

    // re-reading an already materialized block reports nothing new
    await device.read(0, 512)
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(progressHandler.calls, [1 / BLOCK_COUNT, 2 / BLOCK_COUNT])
  })

  it('reports a fully-covered write the same way as a read', async () => {
    const disk = new StubDisk()
    const cache = new StubCache()
    const progressHandler = new StubProgressHandler()
    const device = new CachedDiskBlockDevice({ disk, cache, progressHandler })
    await device.open()

    await device.write(0, Buffer.alloc(DISK_BLOCK_SIZE, 0xee))
    await new Promise(resolve => setImmediate(resolve))

    assert.deepEqual(progressHandler.calls, [1 / BLOCK_COUNT])
  })

  it('does not let a synchronously throwing handler break the read', async () => {
    const disk = new StubDisk()
    const cache = new StubCache()
    const progressHandler = new StubProgressHandler()
    progressHandler.throwSync = true
    const device = new CachedDiskBlockDevice({ disk, cache, progressHandler })
    await device.open()

    assert.deepEqual(await device.read(0, 512), expectedAt(0, 512, disk.allocated))
    assert.deepEqual(device.getMaterialized(), { blocks: 1, total: BLOCK_COUNT })
  })

  it('does not let a rejecting handler surface as an unhandled rejection', async () => {
    const disk = new StubDisk()
    const cache = new StubCache()
    const progressHandler = new StubProgressHandler()
    progressHandler.rejectAsync = true
    const device = new CachedDiskBlockDevice({ disk, cache, progressHandler })
    await device.open()

    assert.deepEqual(await device.read(0, 512), expectedAt(0, 512, disk.allocated))
    // give the rejected promise's `.catch` a turn to run before the test ends
    await new Promise(resolve => setImmediate(resolve))
  })

  it('calls done() once every block is cached, via hydrate', async () => {
    const disk = new StubDisk(new Set([0, 1, 2, 3]))
    const cache = new StubCache()
    const progressHandler = new StubProgressHandler()
    const device = new CachedDiskBlockDevice({ disk, cache, progressHandler })
    await device.open()

    await device.hydrate()
    await new Promise(resolve => setImmediate(resolve))

    assert.deepEqual(progressHandler.calls, [0.25, 0.5, 0.75, 1])
    assert.equal(progressHandler.doneCalls, 1)
  })

  it('calls done() once every block is cached, via on-demand reads alone', async () => {
    const disk = new StubDisk(new Set([0, 1, 2, 3]))
    const cache = new StubCache()
    const progressHandler = new StubProgressHandler()
    const device = new CachedDiskBlockDevice({ disk, cache, progressHandler })
    await device.open()

    await device.read(0, DISK_BLOCK_SIZE * BLOCK_COUNT)
    await new Promise(resolve => setImmediate(resolve))

    assert.equal(progressHandler.doneCalls, 1)
  })

  it('does not call done() before every block is cached', async () => {
    const disk = new StubDisk(new Set([0, 1, 2, 3]))
    const cache = new StubCache()
    const progressHandler = new StubProgressHandler()
    const device = new CachedDiskBlockDevice({ disk, cache, progressHandler })
    await device.open()

    await device.read(0, 512)
    await new Promise(resolve => setImmediate(resolve))

    assert.equal(progressHandler.doneCalls, 0)
  })

  it('does not let a throwing done() surface as an unhandled rejection', async () => {
    const disk = new StubDisk(new Set([0, 1, 2, 3]))
    const cache = new StubCache()
    const progressHandler = new StubProgressHandler()
    progressHandler.done = () => {
      throw new Error('done failure')
    }
    const device = new CachedDiskBlockDevice({ disk, cache, progressHandler })
    await device.open()

    await device.hydrate()
    await new Promise(resolve => setImmediate(resolve))
  })
})

describe('onBlockCached', () => {
  it('fires with the index of each newly cached block, once each', async () => {
    const disk = new StubDisk(new Set([0, 1, 2, 3]))
    const cache = new StubCache()
    const cached: Array<number> = []
    const device = new CachedDiskBlockDevice({ disk, cache, onBlockCached: index => cached.push(index) })
    await device.open()

    await device.read(0, 512)
    assert.deepEqual(cached, [0])

    // a hole is a materialization too
    await device.read(DISK_BLOCK_SIZE, 512)
    assert.deepEqual(cached, [0, 1])

    // re-reading an already materialized block does not fire again
    await device.read(0, 512)
    assert.deepEqual(cached, [0, 1])
  })

  it('does not fire for a block resumed from the initial bitmap', async () => {
    const disk = new StubDisk()
    const cache = new StubCache()
    const initialBitmap = Buffer.alloc(BLOCK_COUNT)
    initialBitmap[0] = 1
    const cached: Array<number> = []
    const device = new CachedDiskBlockDevice({ disk, cache, initialBitmap, onBlockCached: index => cached.push(index) })
    await device.open()

    await device.read(0, 512)
    assert.deepEqual(cached, [])
  })

  it('does not let a synchronously throwing callback break the read', async () => {
    const disk = new StubDisk()
    const cache = new StubCache()
    const device = new CachedDiskBlockDevice({
      disk,
      cache,
      onBlockCached: () => {
        throw new Error('persistence failure')
      },
    })
    await device.open()

    assert.deepEqual(await device.read(0, 512), expectedAt(0, 512, disk.allocated))
    assert.deepEqual(device.getMaterialized(), { blocks: 1, total: BLOCK_COUNT })
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
