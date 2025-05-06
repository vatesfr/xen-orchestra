import { DiskBlock, FileAccessor, RandomAccessDisk } from '@xen-orchestra/disk-transform'

import { strictEqual } from 'node:assert'
import { VmdkDisk } from './Vmdk.mjs'
import { dirname, join } from 'node:path'

const GRAIN_SIZE = 512
const EMPTY_GRAIN = Buffer.alloc(GRAIN_SIZE, 0)
const EMPTY_GRAIN_KEY = -1
const TABLE_SIZE = 4096
/**
 * Cowd has
 *  * a grain directory , telling the address of the grain tables
 *  * multiples grain table telling the adress of the grains
 *  * 4 bit per entry in grain table ( so 2TB max file size )
 *  * 512 bytes grain size
 *  * no compression
 *  *
 */
export class VmdkCowd extends RandomAccessDisk {
  #accessor: FileAccessor
  #path: string
  #descriptor: number | undefined
  #grainDirectory: Buffer | undefined
  #size: number | undefined
  #grainIndex = new Map<number, number>()
  constructor(accessor: FileAccessor, path: string) {
    super()
    this.#accessor = accessor
    this.#path = path
  }

  async readBlock(index: number): Promise<DiskBlock> {
    if (this.#descriptor === undefined) {
      throw new Error("Can't read block before calling init")
    }
    const grainOffset = this.#grainIndex.get(index)
    if (grainOffset === undefined) {
      throw new Error("Can't read bunallocated block")
    }
    if (grainOffset === EMPTY_GRAIN_KEY) {
      return {
        index,
        data: EMPTY_GRAIN,
      }
    }

    const grain = Buffer.alloc(GRAIN_SIZE, 0)
    await this.#accessor.read(this.#descriptor, grain, grainOffset)
    return {
      index,
      data: grain,
    }
  }
  getVirtualSize(): number {
    if (this.#size === undefined) {
      throw new Error("Can't getVirtualSize before calling init")
    }
    return this.#size
  }
  getBlockSize(): number {
    return 512
  }

  async init(): Promise<void> {
    this.#descriptor = await this.#accessor.open(this.#path)
    const buffer = Buffer.alloc(2048)
    await this.#accessor.read(this.#descriptor, buffer, 0)

    strictEqual(buffer.slice(0, 4).toString('ascii'), 'COWD')
    strictEqual(buffer.readUInt32LE(4), 1) // version
    strictEqual(buffer.readUInt32LE(8), 3) // flags
    const numSectors = buffer.readUInt32LE(12)
    const grainSize = buffer.readUInt32LE(16)
    strictEqual(grainSize, 1) // 1 grain should be 1 sector long
    strictEqual(buffer.readUInt32LE(20), 4) // grain directory position in sectors

    const nbGrainDirectoryEntries = buffer.readUInt32LE(24)
    this.#size = numSectors * 512

    // a grain directory entry contains the address of a grain table
    // a grain table can adresses at most 4096 grain of 512 Bytes of data
    this.#grainDirectory = Buffer.alloc(nbGrainDirectoryEntries * 4)
    // load the grain directory
    await this.#accessor.read(this.#descriptor, this.#grainDirectory, 2048)

    for (let tableIndex = 0; tableIndex < this.#grainDirectory.length / 4; tableIndex++) {
      const grainTableOffset = this.#grainDirectory.readUInt32LE(tableIndex * 4)
      if (grainTableOffset === 0) {
        continue // empty grain table
      }
      const grainTable = Buffer.alloc(TABLE_SIZE * 4, 0)
      await this.#accessor.read(this.#descriptor, grainTable, grainTableOffset)
      for (let grainIndex = 0; grainIndex < grainTable.length / 4; grainIndex++) {
        const grainOffset = grainTable.readUInt32LE(grainIndex * 4)
        if (grainOffset === 0) {
          // the content from parent : it is the chain concern, not this disk
        } else if (grainOffset === 1) {
          this.#grainIndex.set(TABLE_SIZE * tableIndex + grainIndex, EMPTY_GRAIN_KEY)
        } else if (grainOffset > 1) {
          // non empty grain, read from file
          strictEqual(
            grainIndex < Number.MAX_SAFE_INTEGER / GRAIN_SIZE,
            true,
            `Cowd can only handle offset up to ${Number.MAX_SAFE_INTEGER} (2^${Math.log2(Number.MAX_SAFE_INTEGER)}) -1 bytes`
          )
          this.#grainIndex.set(TABLE_SIZE * tableIndex + grainIndex, grainOffset * GRAIN_SIZE)
        }
      }
    }
  }
  async close(): Promise<void> {
    this.#descriptor && this.#accessor.close(this.#descriptor)
  }
  isDifferencing(): boolean {
    return true
  }
  getBlockIndexes(): Array<number> {
    if (this.#grainDirectory === undefined) {
      throw new Error("Can't getBlockIndexes before calling init")
    }
    const indexes = []
    for (let i = 0; i < this.#grainDirectory.length / 4; i++) {
      if (this.hasBlock(i)) {
        indexes.push(i)
      }
    }
    return indexes
  }
  hasBlock(index: number): boolean {
    if (this.#grainDirectory === undefined) {
      throw new Error("Can't hasBlock before calling init")
    }
    // only check if a grain table exist for on of the sector of the block
    // the great news is that a grain size has 4096 entries of 512B = 2M
    // and a vhd block is also 2M
    // so we only need to check if a grain table exists (it's not created without data)

    return this.#grainDirectory.readUInt32LE(index * 4) !== 0
  }
}
