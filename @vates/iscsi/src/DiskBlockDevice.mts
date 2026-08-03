import { createLogger, type Logger } from '@xen-orchestra/log'
import type { RandomAccessDisk } from '@xen-orchestra/disk-transform'

import type { BlockDevice } from './backend.mjs'

const log: Logger = createLogger('vates:iscsi:disk-block-device')

const DEFAULT_BLOCK_SIZE = 512

export interface DiskBlockDeviceOptions {
  /**
   * Source disk, already `init()`ed by the caller (this adapter never calls
   * `init()` — the disk may be part of a chain the caller assembled).
   */
  readonly disk: RandomAccessDisk
  /**
   * Logical block size advertised to initiators, in bytes. Defaults to 512.
   * The disk's own block size must be a multiple of it.
   */
  readonly blockSize?: number
}

/**
 * A read-only {@link BlockDevice} for a {@link RandomAccessDisk} (the inverse
 * of {@link IscsiDisk}). Unallocated blocks read as zero; the source must
 * never be asked for a block it doesn't have (e.g. `RemoteVhdDiskChain`
 * throws).
 *
 * Nothing is cached — every read re-fetches a whole source block. Put a
 * caching decorator in front of the source disk, not here.
 */
export class DiskBlockDevice implements BlockDevice {
  readonly #disk: RandomAccessDisk
  readonly #blockSize: number
  #diskBlockSize?: number
  #size?: number

  constructor({ disk, blockSize = DEFAULT_BLOCK_SIZE }: DiskBlockDeviceOptions) {
    if (!Number.isInteger(blockSize) || blockSize <= 0) {
      throw new Error(`blockSize must be a positive integer, got ${blockSize}`)
    }
    this.#disk = disk
    this.#blockSize = blockSize
  }

  /**
   * Read the source disk's geometry and check it can be exposed as a LUN.
   * Awaited by the target before it serves any I/O.
   */
  async open(): Promise<void> {
    const blockSize = this.#blockSize
    const diskBlockSize = this.#disk.getBlockSize()
    if (diskBlockSize % blockSize !== 0) {
      throw new Error(`disk block size (${diskBlockSize}) is not a multiple of the LUN block size (${blockSize})`)
    }
    const size = this.#disk.getVirtualSize()
    if (size <= 0 || size % blockSize !== 0) {
      throw new Error(`disk virtual size (${size}) is not a positive multiple of the LUN block size (${blockSize})`)
    }
    this.#diskBlockSize = diskBlockSize
    this.#size = size
    log.debug('opened', { size, blockSize, diskBlockSize })
  }

  getSize(): number {
    const size = this.#size
    if (size === undefined) {
      throw new Error('DiskBlockDevice.open() must be called before I/O')
    }
    return size
  }

  getBlockSize(): number {
    return this.#blockSize
  }

  async read(offset: number, length: number): Promise<Buffer> {
    const size = this.getSize()
    if (offset < 0 || length < 0 || offset + length > size) {
      throw new Error(`read of ${length} bytes at ${offset} is out of range (size ${size})`)
    }
    if (length === 0) {
      return Buffer.alloc(0)
    }

    const diskBlockSize = this.#diskBlockSize as number
    // zero-filled: unallocated blocks, and any source block shorter than
    // announced, are left as zeroes
    const result = Buffer.alloc(length)
    const end = offset + length
    const lastIndex = Math.floor((end - 1) / diskBlockSize)
    for (let index = Math.floor(offset / diskBlockSize); index <= lastIndex; index++) {
      if (!this.#disk.hasBlock(index)) {
        continue
      }
      const blockStart = index * diskBlockSize
      const from = Math.max(offset, blockStart)
      const to = Math.min(end, blockStart + diskBlockSize)
      const { data } = await this.#disk.readBlock(index)
      data.copy(result, from - offset, from - blockStart, to - blockStart)
    }
    return result
  }

  /**
   * Always throws: the source disk is read-only. The target answers CHECK
   * CONDITION / MEDIUM ERROR, which initiators surface as an I/O error.
   */
  async write(): Promise<void> {
    throw new Error('DiskBlockDevice is read-only')
  }

  async flush(): Promise<void> {
    // nothing to flush: read-only
  }

  async close(): Promise<void> {
    await this.#disk.close()
  }
}
