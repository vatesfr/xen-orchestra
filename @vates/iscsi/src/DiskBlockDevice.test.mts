import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { RandomAccessDisk, type DiskBlock } from '@xen-orchestra/disk-transform'

import { DiskBlockDevice } from './DiskBlockDevice.mjs'

const BLOCK_SIZE = 4096

/**
 * Sparse in-memory {@link RandomAccessDisk}: `blocks` maps a block index to its
 * content, every other index is unallocated and must never be read (the real
 * `RemoteVhdDiskChain` throws in that case, which is what this asserts).
 */
class StubDisk extends RandomAccessDisk {
  readBlockCalls: Array<number> = []
  closed = false

  constructor(
    readonly blocks: Map<number, Buffer>,
    readonly virtualSize: number,
    readonly blockSize: number = BLOCK_SIZE
  ) {
    super()
  }

  getBlockSize(): number {
    return this.blockSize
  }
  getVirtualSize(): number {
    return this.virtualSize
  }
  isDifferencing(): boolean {
    return false
  }
  getBlockIndexes(): Array<number> {
    return [...this.blocks.keys()]
  }
  hasBlock(index: number): boolean {
    return this.blocks.has(index)
  }
  async init(): Promise<void> {}
  async close(): Promise<void> {
    this.closed = true
  }
  async readBlock(index: number): Promise<DiskBlock> {
    const data = this.blocks.get(index)
    if (data === undefined) {
      throw new Error(`Block ${index} not found`)
    }
    this.readBlockCalls.push(index)
    return { index, data }
  }
}

const filled = (byte: number, length = BLOCK_SIZE) => Buffer.alloc(length, byte)

// 4 blocks, only 0 and 2 allocated
const makeDevice = async (blockSize?: number) => {
  const disk = new StubDisk(
    new Map([
      [0, filled(0xaa)],
      [2, filled(0xcc)],
    ]),
    4 * BLOCK_SIZE
  )
  const device = new DiskBlockDevice({ disk, blockSize })
  await device.open()
  return { disk, device }
}

describe('open', () => {
  it('exposes the disk capacity and the requested block size', async () => {
    const { device } = await makeDevice()
    assert.equal(device.getSize(), 4 * BLOCK_SIZE)
    assert.equal(device.getBlockSize(), 512)
  })

  it('rejects a disk block size that is not a multiple of the LUN block size', async () => {
    const disk = new StubDisk(new Map(), 4096, 600)
    await assert.rejects(new DiskBlockDevice({ disk }).open(), /not a multiple of the LUN block size/)
  })

  it('rejects a capacity that is not a multiple of the LUN block size', async () => {
    const disk = new StubDisk(new Map(), BLOCK_SIZE + 100)
    await assert.rejects(new DiskBlockDevice({ disk }).open(), /not a positive multiple/)
  })

  it('rejects an invalid block size', () => {
    const disk = new StubDisk(new Map(), BLOCK_SIZE)
    assert.throws(() => new DiskBlockDevice({ disk, blockSize: 0 }), /positive integer/)
  })

  it('refuses I/O before open()', () => {
    const disk = new StubDisk(new Map(), BLOCK_SIZE)
    assert.throws(() => new DiskBlockDevice({ disk }).getSize(), /open\(\) must be called/)
  })
})

describe('read', () => {
  it('reads a whole allocated block', async () => {
    const { device } = await makeDevice()
    assert.deepEqual(await device.read(0, BLOCK_SIZE), filled(0xaa))
  })

  it('reads an unaligned slice inside one block', async () => {
    const { device, disk } = await makeDevice()
    assert.deepEqual(await device.read(BLOCK_SIZE * 2 + 512, 1024), filled(0xcc, 1024))
    // a single source block was fetched, not the whole disk
    assert.deepEqual(disk.readBlockCalls, [2])
  })

  it('zero-fills unallocated blocks instead of reading them', async () => {
    const { device, disk } = await makeDevice()
    assert.deepEqual(await device.read(BLOCK_SIZE, BLOCK_SIZE), Buffer.alloc(BLOCK_SIZE))
    assert.deepEqual(disk.readBlockCalls, [])
  })

  it('stitches a range spanning allocated and unallocated blocks', async () => {
    const { device } = await makeDevice()
    const data = await device.read(BLOCK_SIZE - 512, BLOCK_SIZE + 1024)
    assert.deepEqual(
      data,
      Buffer.concat([
        filled(0xaa, 512), // tail of block 0
        Buffer.alloc(BLOCK_SIZE), // block 1, unallocated
        filled(0xcc, 512), // head of block 2
      ])
    )
  })

  it('reads the last block of the disk', async () => {
    const { device } = await makeDevice()
    assert.deepEqual(await device.read(3 * BLOCK_SIZE, BLOCK_SIZE), Buffer.alloc(BLOCK_SIZE))
  })

  it('returns an empty buffer for a zero-length read', async () => {
    const { device, disk } = await makeDevice()
    assert.equal((await device.read(0, 0)).length, 0)
    assert.deepEqual(disk.readBlockCalls, [])
  })

  it('rejects a read past the end of the disk', async () => {
    const { device } = await makeDevice()
    await assert.rejects(device.read(4 * BLOCK_SIZE - 512, 1024), /out of range/)
    await assert.rejects(device.read(-512, 512), /out of range/)
  })

  it('zero-pads a source block shorter than announced', async () => {
    const disk = new StubDisk(new Map([[0, filled(0xaa, 1024)]]), BLOCK_SIZE)
    const device = new DiskBlockDevice({ disk })
    await device.open()
    assert.deepEqual(await device.read(0, BLOCK_SIZE), Buffer.concat([filled(0xaa, 1024)], BLOCK_SIZE))
  })
})

describe('write', () => {
  it('always fails', async () => {
    const { device } = await makeDevice()
    await assert.rejects(device.write(), /read-only/)
  })
})

describe('close', () => {
  it('closes the underlying disk', async () => {
    const { device, disk } = await makeDevice()
    await device.close()
    assert.equal(disk.closed, true)
  })
})
