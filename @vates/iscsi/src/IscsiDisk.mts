import { RandomAccessDisk, type DiskBlock } from '@xen-orchestra/disk-transform'

import { IscsiInitiator, type IscsiInitiatorOptions } from './initiator.mjs'

export interface IscsiDiskOptions {
  /**
   * Block size, in bytes, presented to the disk-transform pipeline. Must be a
   * multiple of the LUN's logical block size (checked at {@link IscsiDisk.init}).
   * A single SCSI READ(16) fetches one whole block.
   */
  readonly blockSize: number
}

/**
 * A {@link RandomAccessDisk} backed by a remote iSCSI LUN read through an
 * {@link IscsiInitiator} — the iSCSI analogue of `@vates/nbd-client`'s `NbdDisk`.
 * It plugs a target LUN into the `@xen-orchestra/disk-transform` pipeline
 * (`ReadAhead`, `DiskLargerBlock`, block generator) unchanged.
 *
 * First implementation: the LUN is treated as fully allocated — every block is
 * reported as present (dense, like `RawDisk`). A future version can narrow this
 * with a changed-block map (e.g. a Pure "Volume Difference"). Read-only.
 */
export class IscsiDisk extends RandomAccessDisk {
  readonly #options: IscsiInitiatorOptions
  readonly #blockSize: number
  #initiator?: IscsiInitiator

  constructor(options: IscsiInitiatorOptions, { blockSize }: IscsiDiskOptions) {
    super()
    this.#options = options
    this.#blockSize = blockSize
  }

  async init(): Promise<void> {
    const initiator = new IscsiInitiator(this.#options)
    await initiator.connect()
    const lunBlockSize = initiator.getBlockSize()
    if (this.#blockSize % lunBlockSize !== 0) {
      await initiator.close()
      throw new Error(`block size ${this.#blockSize} is not a multiple of the LUN block size ${lunBlockSize}`)
    }
    this.#initiator = initiator
  }

  async close(): Promise<void> {
    const initiator = this.#initiator
    this.#initiator = undefined
    await initiator?.close()
  }

  #requireInitiator(): IscsiInitiator {
    const initiator = this.#initiator
    if (initiator === undefined) {
      throw new Error('IscsiDisk.init() must be called first')
    }
    return initiator
  }

  getBlockSize(): number {
    return this.#blockSize
  }

  getVirtualSize(): number {
    return this.#requireInitiator().getSize()
  }

  isDifferencing(): boolean {
    return false
  }

  getBlockIndexes(): Array<number> {
    const count = Math.ceil(this.getVirtualSize() / this.#blockSize)
    const indexes = new Array<number>(count)
    for (let i = 0; i < count; i++) {
      indexes[i] = i
    }
    return indexes
  }

  hasBlock(index: number): boolean {
    return index >= 0 && index * this.#blockSize < this.getVirtualSize()
  }

  async readBlock(index: number): Promise<DiskBlock> {
    const initiator = this.#requireInitiator()
    const size = this.getVirtualSize()
    const offset = index * this.#blockSize
    const length = Math.min(this.#blockSize, size - offset)
    let data = await initiator.read(offset, length)
    if (data.length < this.#blockSize) {
      // Last (short) block on a LUN whose capacity is not a multiple of the
      // disk block size: zero-pad the tail to a full block.
      data = Buffer.concat([data], this.#blockSize)
    }
    return { index, data }
  }
}
