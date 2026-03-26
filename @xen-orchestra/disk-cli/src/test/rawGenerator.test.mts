import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { rawGenerator } from '../commands/transform.mjs'
import type { RandomAccessDisk } from '@xen-orchestra/disk-transform'

// ---------------------------------------------------------------------------
// Helper: collect all chunks from rawGenerator into a single Buffer
// ---------------------------------------------------------------------------

async function collect(disk: RandomAccessDisk): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of rawGenerator(disk)) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

// ---------------------------------------------------------------------------
// Helper: build a minimal mock disk
// ---------------------------------------------------------------------------

function makeDisk(opts: {
  blockSize: number
  virtualSize: number
  present?: Set<number>
  fillByte?: number
}): RandomAccessDisk {
  const { blockSize, virtualSize, present = new Set(), fillByte = 0xab } = opts
  return {
    getBlockSize: () => blockSize,
    getVirtualSize: () => virtualSize,
    hasBlock: (i: number) => present.has(i),
    readBlock: async (i: number) => ({ data: Buffer.alloc(blockSize, fillByte + i) }),
  } as unknown as RandomAccessDisk
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('rawGenerator', () => {
  test('empty disk (virtualSize=0) yields nothing', async () => {
    const disk = makeDisk({ blockSize: 512, virtualSize: 0 })
    const out = await collect(disk)
    assert.strictEqual(out.length, 0)
  })

  test('single present block yields its data', async () => {
    const disk = makeDisk({ blockSize: 512, virtualSize: 512, present: new Set([0]), fillByte: 0x42 })
    const out = await collect(disk)
    assert.strictEqual(out.length, 512)
    assert.ok(
      out.every(b => b === 0x42),
      'all bytes should be fill byte'
    )
  })

  test('absent block yields zeros', async () => {
    const disk = makeDisk({ blockSize: 512, virtualSize: 512 }) // present is empty
    const out = await collect(disk)
    assert.strictEqual(out.length, 512)
    assert.ok(
      out.every(b => b === 0),
      'absent block should yield zeros'
    )
  })

  test('mixed present/absent blocks', async () => {
    // 3 blocks: block 0 present, block 1 absent, block 2 present
    const disk = makeDisk({ blockSize: 512, virtualSize: 3 * 512, present: new Set([0, 2]), fillByte: 0x01 })
    const out = await collect(disk)
    assert.strictEqual(out.length, 3 * 512)
    // block 0: fill byte 0x01
    assert.ok(out.subarray(0, 512).every(b => b === 0x01))
    // block 1: zeros (absent)
    assert.ok(out.subarray(512, 1024).every(b => b === 0))
    // block 2: fill byte 0x03 (0x01 + blockIndex 2)
    assert.ok(out.subarray(1024).every(b => b === 0x03))
  })

  test('last block is trimmed when virtualSize is not a multiple of blockSize', async () => {
    // virtualSize=768, blockSize=512 → last block should be 256 bytes
    const disk = makeDisk({ blockSize: 512, virtualSize: 768, present: new Set([0, 1]), fillByte: 0x10 })
    const out = await collect(disk)
    assert.strictEqual(out.length, 768)
    // First block: 512 bytes of 0x10
    assert.ok(out.subarray(0, 512).every(b => b === 0x10))
    // Second (last) block: only 256 bytes (trimmed), value 0x11
    assert.ok(out.subarray(512).every(b => b === 0x11))
  })

  test('last block is NOT trimmed when virtualSize is an exact multiple of blockSize', async () => {
    const disk = makeDisk({ blockSize: 512, virtualSize: 1024, present: new Set([0, 1]) })
    const out = await collect(disk)
    assert.strictEqual(out.length, 1024)
  })

  test('total output length equals virtualSize for all-present disk', async () => {
    const virtualSize = 3 * 512 + 200 // not an exact multiple
    const present = new Set([0, 1, 2])
    const disk = makeDisk({ blockSize: 512, virtualSize, present })
    const out = await collect(disk)
    assert.strictEqual(out.length, virtualSize)
  })

  test('total output length equals virtualSize for all-absent disk', async () => {
    const virtualSize = 2 * 512 + 100
    const disk = makeDisk({ blockSize: 512, virtualSize }) // no blocks present
    const out = await collect(disk)
    assert.strictEqual(out.length, virtualSize)
  })
})
