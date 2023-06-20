import * as assert from 'assert'
import test from 'node:test'
import crypto from 'node:crypto'
import { VhdAbstract } from 'vhd-lib'
import { DEFAULT_BLOCK_SIZE as VHD_BLOCK_SIZE_BYTES } from 'vhd-lib/_constants.js'
import { VhdEsxiSeSparse } from './VhdEsxiSeSparse.mjs'

/**
 * quick and dirty implementation of a VHD file using a map of blocks
 */
class MapVHDFile extends VhdAbstract {
  blocks = new Map()

  constructor(blocks) {
    super(null)
    this.blocks = blocks
  }

  async readBlock(blockId) {
    const block = this.blocks.get(blockId)
    if (block) return block
    return VhdEsxiSeSparse.allocateZeroBlock(VHD_BLOCK_SIZE_BYTES)
  }

  containsBlock(blockId) {
    return this.blocks.has(blockId)
  }
}

test('VHD empty block allocation', async () => {
  const block = await VhdEsxiSeSparse.allocateZeroBlock(VHD_BLOCK_SIZE_BYTES)
  assert.ok(block.bitmap.every(b => b === 255))
  assert.strictEqual(block.bitmap.length, 512)
  assert.ok(block.data.every(b => b === 0))
  assert.strictEqual(block.data.length, VHD_BLOCK_SIZE_BYTES)
  assert.strictEqual(block.buffer.length, VHD_BLOCK_SIZE_BYTES + 512)
})

// md5 : a379b4cb97f416876ddee5bafe044a5e
const TEST_FILE = '/Users/nraynaud/Documents/Vates/VMDKseSparse/ubuntu-000001-sesparse.vmdk'
// we know this grain is zeroed, and its VHD block contains other normally allocated grains.
const KNOWN_ZERO_GRAIN_ID = 2155093
// we know this grain is in the VMDK, in the same VHD block as the zeroed grain.
const KNOWN_ALLOCATED_GRAIN_ID = 2155100
// we know this grain is not in the VMDK, in the same VHD block as the zeroed grain.
const KNOWN_MISSING_GRAIN_ID = 2155102

const KNOWN_NEED_PARENT_BLOCK_ID = 4209 // same as above
const KNOWN_COMPLETELY_MISSING_BLOCK_ID = 60556

test('single VMDK test', async () => {
  const fakeVhd = new VhdEsxiSeSparse('lol', null, TEST_FILE, null, { lookMissingBlockInParent: false })
  await fakeVhd.readHeaderAndFooter()
  await fakeVhd.readBlockAllocationTable()
  // console.log('footer', fakeVhd.footer)
  // console.log('header', fakeVhd.header)
  assert.strictEqual(fakeVhd.grainSizeBytes, 4096)
  assert.strictEqual(fakeVhd.grainDirOffsetBytes, 2097152)
  assert.strictEqual(fakeVhd.grainDirLogicalSpanBytes, 16777216)
  assert.strictEqual(fakeVhd.grainDirCount, 131072)
  assert.strictEqual(fakeVhd.grainTableOffsetBytes, 3145728)
  assert.strictEqual(fakeVhd.grainTableOffsetBytes, 3145728)
  assert.strictEqual(fakeVhd.grainTablesSizeBytes, 33554432)

  // console.time('readAllBlocks')
  for (let i = 0; i < fakeVhd.header.maxTableEntries; i++) {
    await fakeVhd.readBlock(i)
  }
  // console.timeEnd('readAllBlocks')

  const zero_grain = fakeVhd.compressedTable.findGrain(KNOWN_ZERO_GRAIN_ID)
  // console.log('zero_grain', zero_grain)
  assert.deepEqual(zero_grain, { type: 2 /* SE_SPARSE_GRAIN_ZERO */, grainIndex: NaN })
  const allocated_grain = fakeVhd.compressedTable.findGrain(KNOWN_ALLOCATED_GRAIN_ID)
  // console.log('allocated_grain', allocated_grain)
  assert.deepEqual(allocated_grain, { type: 3 /* SE_SPARSE_GRAIN_ALLOCATED */, grainIndex: 45650 })
  const missing_grain = fakeVhd.compressedTable.findGrain(KNOWN_MISSING_GRAIN_ID)
  // console.log('missing_grain', missing_grain)
  assert.deepEqual(missing_grain, { type: 0 /* SE_SPARSE_GRAIN_NON_ALLOCATED */, grainIndex: NaN })
  const grainToBlockRatio = VHD_BLOCK_SIZE_BYTES / fakeVhd.grainSizeBytes
  const BLOCK_ID_FOR_ZERO_GRAIN = Math.floor(KNOWN_ZERO_GRAIN_ID / grainToBlockRatio)
  assert.strictEqual(BLOCK_ID_FOR_ZERO_GRAIN, 4209)
  assert.strictEqual(await fakeVhd.containsBlock(BLOCK_ID_FOR_ZERO_GRAIN), true)
  const block = await fakeVhd.readBlock(BLOCK_ID_FOR_ZERO_GRAIN)
  const zeroGrainStartInBlock = KNOWN_ZERO_GRAIN_ID % grainToBlockRatio
  assert.ok(
    block.data
      .subarray(zeroGrainStartInBlock * fakeVhd.grainSizeBytes, (zeroGrainStartInBlock + 1) * fakeVhd.grainSizeBytes)
      .every(b => b === 0)
  )
  assert.ok(block.bitmap.every(b => b === 0xff))
  const missingGrainStartInBlock = KNOWN_MISSING_GRAIN_ID % grainToBlockRatio
  const missingBuffer = block.data.subarray(
    missingGrainStartInBlock * fakeVhd.grainSizeBytes,
    (missingGrainStartInBlock + 1) * fakeVhd.grainSizeBytes
  )
  assert.ok(missingBuffer.every(b => b === 0))
  const hash = crypto.createHash('md5').update(block.data).digest('hex')
  // precomputed, I hope it's right
  assert.strictEqual(hash, 'ddb01d7e45e730aa1250781200632543')

  // console.log('readCount', fakeVhd.readCount)
  // console.log('grainDownloads', fakeVhd.grainDownloads, 'grainDownloadsBytes', fakeVhd.grainDownloads * fakeVhd.grainSizeBytes / 1024 / 1024, 'MB')
  // console.log('extraBytesDownloaded', fakeVhd.extraBytesDownloaded / 1024 / 1024, 'MB', fakeVhd.extraBytesDownloaded / (fakeVhd.extraBytesDownloaded + fakeVhd.grainDownloads * fakeVhd.grainSizeBytes) * 100, '% needless traffic')
})

test('VMDK test with parent', async () => {
  const fakeParentData42 = VhdEsxiSeSparse.allocateZeroBlock(VHD_BLOCK_SIZE_BYTES)
  fakeParentData42.data.fill(0x42)
  const fakeParentData43 = VhdEsxiSeSparse.allocateZeroBlock(VHD_BLOCK_SIZE_BYTES)
  fakeParentData43.data.fill(0x43)
  const fakeParentData44 = VhdEsxiSeSparse.allocateZeroBlock(VHD_BLOCK_SIZE_BYTES)
  fakeParentData44.data.fill(0x44)
  const parent = new MapVHDFile(
    new Map([
      [KNOWN_NEED_PARENT_BLOCK_ID, fakeParentData42], // add data missing from the child, but the VHD block exists
      [KNOWN_ZERO_GRAIN_ID, fakeParentData43], // add data that is zeroed in the child
      [KNOWN_COMPLETELY_MISSING_BLOCK_ID, fakeParentData44], // add data that is completely missing from the child
    ])
  )
  const fakeVhd = new VhdEsxiSeSparse('lol', null, TEST_FILE, parent, { lookMissingBlockInParent: true })

  await fakeVhd.readHeaderAndFooter()
  await fakeVhd.readBlockAllocationTable()
  assert.ok(parent.containsBlock(KNOWN_NEED_PARENT_BLOCK_ID))
  assert.ok(fakeVhd.containsBlock(KNOWN_NEED_PARENT_BLOCK_ID))
  assert.ok(fakeVhd.containsBlock(KNOWN_COMPLETELY_MISSING_BLOCK_ID))

  const block = await fakeVhd.readBlock(KNOWN_NEED_PARENT_BLOCK_ID)
  const grainToBlockRatio = VHD_BLOCK_SIZE_BYTES / fakeVhd.grainSizeBytes
  const missingGrainStartInBlock = KNOWN_MISSING_GRAIN_ID % grainToBlockRatio
  const missingBuffer = block.data.subarray(
    missingGrainStartInBlock * fakeVhd.grainSizeBytes,
    (missingGrainStartInBlock + 1) * fakeVhd.grainSizeBytes
  )
  assert.ok(missingBuffer.every(b => b === 0x42))
  // check that they didn't go to the parent when the child is declared zeroed
  const zeroGrainStartInBlock = KNOWN_ZERO_GRAIN_ID % grainToBlockRatio
  const zeroBuffer = block.data.subarray(
    zeroGrainStartInBlock * fakeVhd.grainSizeBytes,
    (zeroGrainStartInBlock + 1) * fakeVhd.grainSizeBytes
  )
  assert.ok(zeroBuffer.every(b => b === 0))
  assert.ok(block.bitmap.every(b => b === 0xff))

  const parentOnlyBlock = await fakeVhd.readBlock(KNOWN_COMPLETELY_MISSING_BLOCK_ID)
  assert.ok(parentOnlyBlock.data.every(b => b === 0x44))
})
