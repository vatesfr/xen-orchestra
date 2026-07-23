import { describe, it } from 'node:test'
import assert from 'node:assert'

import { NbdDisk } from './NbdDisk.mjs'

const KiB = 1024
const MiB = 1024 * KiB
const TiB = 1024 * 1024 * MiB

const SOURCE_BLOCK_SIZE = 2 * MiB // VHD_BLOCK_SIZE, the block size used when importing from VMware
const CLUSTER_SIZE = 64 * KiB // qcow2 cluster size

// hasBlock() only needs the dataMap (passed through the constructor) and the
// block size, so we can exercise it without a live NBD connection.
describe('NbdDisk.hasBlock', () => {
  it('reports allocated and unallocated blocks correctly', () => {
    const dataMap = [
      { type: 0, offset: 0, length: SOURCE_BLOCK_SIZE }, // block 0
      { type: 0, offset: 5 * SOURCE_BLOCK_SIZE, length: SOURCE_BLOCK_SIZE }, // block 5
    ]
    const disk = new NbdDisk({}, SOURCE_BLOCK_SIZE, { dataMap })

    assert.strictEqual(disk.hasBlock(0), true)
    assert.strictEqual(disk.hasBlock(1), false)
    assert.strictEqual(disk.hasBlock(4), false)
    assert.strictEqual(disk.hasBlock(5), true)
    assert.strictEqual(disk.hasBlock(6), false)
  })

  it('handles repeated and out-of-order queries with the resume cursor', () => {
    const dataMap = [
      { type: 0, offset: 0, length: SOURCE_BLOCK_SIZE }, // block 0
      { type: 0, offset: 5 * SOURCE_BLOCK_SIZE, length: SOURCE_BLOCK_SIZE }, // block 5
    ]
    const disk = new NbdDisk({}, SOURCE_BLOCK_SIZE, { dataMap })

    // repeated indexes (the qcow2 path queries each 2MB block ~32 times as it
    // walks 64KB clusters) must return a stable answer
    assert.strictEqual(disk.hasBlock(5), true)
    assert.strictEqual(disk.hasBlock(5), true)
    assert.strictEqual(disk.hasBlock(6), false)
    assert.strictEqual(disk.hasBlock(6), false)

    // querying backwards must still be correct (falls back to a full scan)
    assert.strictEqual(disk.hasBlock(0), true)
    assert.strictEqual(disk.hasBlock(5), true)
  })

  it('throws on overlapping ranges (would break the resume cursor)', () => {
    const dataMap = [
      { type: 0, offset: 0, length: SOURCE_BLOCK_SIZE },
      { type: 0, offset: SOURCE_BLOCK_SIZE / 2, length: SOURCE_BLOCK_SIZE }, // overlaps the previous range
    ]
    assert.throws(() => new NbdDisk({}, SOURCE_BLOCK_SIZE, { dataMap }), /overlapping ranges/)
  })

  it('merges touching ranges and drops zero-length / non type-0 entries', () => {
    const dataMap = [
      { type: 0, offset: 2 * SOURCE_BLOCK_SIZE, length: SOURCE_BLOCK_SIZE }, // [2, 3)
      { type: 0, offset: 0, length: SOURCE_BLOCK_SIZE / 2 }, // [0, .5)
      { type: 0, offset: SOURCE_BLOCK_SIZE, length: SOURCE_BLOCK_SIZE }, // [1, 2)
      { type: 0, offset: SOURCE_BLOCK_SIZE / 2, length: SOURCE_BLOCK_SIZE / 2 }, // [.5, 1), touches [0, .5)
      { type: 1, offset: 10 * SOURCE_BLOCK_SIZE, length: SOURCE_BLOCK_SIZE }, // wrong type: ignored
      { type: 0, offset: 7 * SOURCE_BLOCK_SIZE, length: 0 }, // zero length: ignored
    ]
    const disk = new NbdDisk({}, SOURCE_BLOCK_SIZE, { dataMap })

    assert.strictEqual(disk.hasBlock(0), true)
    assert.strictEqual(disk.hasBlock(1), true)
    assert.strictEqual(disk.hasBlock(2), true)
    assert.strictEqual(disk.hasBlock(3), false)
    assert.strictEqual(disk.hasBlock(7), false) // zero-length range dropped
    assert.strictEqual(disk.hasBlock(10), false) // non type-0 range dropped
  })
})

describe('NbdDisk.getBlockIndexesCount', () => {
  const cases = {
    'aligned, disjoint blocks': [
      { type: 0, offset: 0, length: SOURCE_BLOCK_SIZE }, // block 0
      { type: 0, offset: 5 * SOURCE_BLOCK_SIZE, length: SOURCE_BLOCK_SIZE }, // block 5
    ],
    'a range spanning several blocks': [
      { type: 0, offset: SOURCE_BLOCK_SIZE / 2, length: 3 * SOURCE_BLOCK_SIZE }, // blocks 0,1,2,3
    ],
    'two disjoint extents sharing block 0 (needs dedup)': [
      { type: 0, offset: 0, length: SOURCE_BLOCK_SIZE / 2 }, // [0, .5) => block 0
      { type: 0, offset: 3 * (SOURCE_BLOCK_SIZE / 4), length: SOURCE_BLOCK_SIZE }, // [.75, 1.75) => blocks 0,1
    ],
    'touching sub-block fragments': [
      { type: 0, offset: 0, length: SOURCE_BLOCK_SIZE / 2 },
      { type: 0, offset: SOURCE_BLOCK_SIZE / 2, length: SOURCE_BLOCK_SIZE / 2 },
      { type: 0, offset: SOURCE_BLOCK_SIZE, length: SOURCE_BLOCK_SIZE },
    ],
    empty: [],
  }

  for (const [name, dataMap] of Object.entries(cases)) {
    it(`matches getBlockIndexes().length: ${name}`, () => {
      const disk = new NbdDisk({}, SOURCE_BLOCK_SIZE, { dataMap })
      assert.strictEqual(disk.getBlockIndexesCount(), disk.getBlockIndexes().length)
    })
  }

  it('matches getBlockIndexes().length on the large sparse map', () => {
    const virtualSize = Math.floor(3.5 * TiB)
    const NB_RANGES = 113528
    const dataMap = []
    for (let i = 0; i < NB_RANGES; i++) {
      dataMap.push({ type: 0, offset: Math.floor((i / NB_RANGES) * virtualSize), length: CLUSTER_SIZE })
    }
    const disk = new NbdDisk({}, SOURCE_BLOCK_SIZE, { dataMap })
    assert.strictEqual(disk.getBlockIndexesCount(), disk.getBlockIndexes().length)
  })
})
