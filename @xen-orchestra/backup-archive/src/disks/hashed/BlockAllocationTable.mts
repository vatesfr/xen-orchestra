import { createLogger } from '@xen-orchestra/log'
import { BlockHash, HASH_SIZE } from './hbdPaths.mjs'

const { warn } = createLogger('xo:backup-archive:bat')

const ZERO_ENTRY = Buffer.alloc(HASH_SIZE)

export class BlockAllocationTable {
  #bat: Buffer
  #maxBlockCount: number

  static allocate(maxBlockCount: number): BlockAllocationTable {
    return new BlockAllocationTable(Buffer.alloc(maxBlockCount * HASH_SIZE), maxBlockCount)
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

  get(index: number): BlockHash {
    return this.#entry(index).toString('hex') as BlockHash
  }

  set(index: number, hash: BlockHash) {
    this.#entry(index).write(hash, 'hex')
  }

  isEmpty(index: number): boolean {
    return this.#entry(index).equals(ZERO_ENTRY)
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
}
