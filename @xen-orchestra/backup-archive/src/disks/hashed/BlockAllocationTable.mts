import { createLogger } from '@xen-orchestra/log'
import { asBlockHash, BlockHash, HASH_SIZE } from './hbdPaths.mjs'
import { readChunkStrict } from '@vates/read-chunk'
import { Readable } from 'node:stream'

const { warn } = createLogger('xo:backup-archive:bat')

const ZERO_ENTRY = Buffer.alloc(HASH_SIZE)

// a whole number of entries per read: no entry is ever split across two chunks
const CHUNK_ENTRIES = 2048 // 64 KiB

export class BlockAllocationTable {
  #bat: Buffer
  #maxBlockCount: number

  static allocate(maxBlockCount: number): BlockAllocationTable {
    return new BlockAllocationTable(Buffer.alloc(maxBlockCount * HASH_SIZE), maxBlockCount)
  }

  resize(maxBlockCount: number): void {
    const batLength = maxBlockCount * HASH_SIZE
    if (batLength > this.#bat.length) {
      const bat = Buffer.alloc(maxBlockCount * HASH_SIZE)
      this.#bat.copy(bat, 0, 0, Math.min(this.#bat.length, bat.length))
      this.#bat = bat
    } else {
      this.#bat = this.#bat.subarray(0, batLength)
    }
    this.#maxBlockCount = maxBlockCount
  }

  static fromBuffer(buffer: Buffer, maxBlockCount: number, force = false): BlockAllocationTable {
    const expected = maxBlockCount * HASH_SIZE
    if (buffer.length !== expected) {
      const message = `unexpected hashes file size: ${buffer.length} instead of ${expected}`
      if (force) {
        warn(message)
        maxBlockCount = Math.min(maxBlockCount, Math.floor(buffer.length / HASH_SIZE))
      } else {
        throw new Error(message)
      }
    }
    return new BlockAllocationTable(buffer, maxBlockCount)
  }

  private constructor(bat: Buffer, maxBlockCount: number) {
    this.#bat = bat
    this.#maxBlockCount = maxBlockCount
  }

  #entry(index: number): Buffer {
    if (index < 0 || index >= this.#maxBlockCount) {
      throw new Error(`block index ${index} out of range [0, ${this.#maxBlockCount})`)
    }
    const offset = index * HASH_SIZE
    return this.#bat.subarray(offset, offset + HASH_SIZE)
  }

  entryAt(index: number): Buffer {
    return this.#entry(index)
  }

  sameAt(index: number, other: BlockAllocationTable, otherIndex: number): boolean {
    if (index >= this.#maxBlockCount) {
      return false
    }
    return this.entryAt(index).equals(other.entryAt(otherIndex))
  }

  hashAt(index: number): BlockHash {
    return this.#entry(index).toString('hex') as BlockHash
  }

  set(index: number, hash: BlockHash) {
    if (this.#entry(index).write(asBlockHash(hash), 'hex') !== HASH_SIZE) {
      throw new Error(`incomplete write of block hash ${hash}`)
    }
  }

  isEmpty(index: number): boolean {
    const offset = index * HASH_SIZE
    return this.#bat.compare(ZERO_ENTRY, 0, HASH_SIZE, offset, offset + HASH_SIZE) === 0
  }

  countAllocated(): number {
    let total = 0
    for (let idx = 0; idx < this.#maxBlockCount; idx++) {
      if (!this.isEmpty(idx)) total++
    }
    return total
  }

  indexes(): Array<number> {
    const res = new Array<number>()
    for (let idx = 0; idx < this.#maxBlockCount; idx++) {
      if (!this.isEmpty(idx)) res.push(idx)
    }
    return res
  }

  toBuffer(): Buffer {
    return this.#bat
  }

  static async *readChunks(
    stream: Readable,
    blockCount: number
  ): AsyncGenerator<{ firstIndex: number; bat: BlockAllocationTable }> {
    for (let firstIndex = 0; firstIndex < blockCount; firstIndex += CHUNK_ENTRIES) {
      const count = Math.min(CHUNK_ENTRIES, blockCount - firstIndex)
      const chunk = (await readChunkStrict(stream, count * HASH_SIZE)) as Buffer
      yield { firstIndex, bat: new BlockAllocationTable(chunk, count) }
    }
  }
}
