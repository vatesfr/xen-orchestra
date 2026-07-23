import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
import NbdClient from '@vates/nbd-client'

/**
 * @typedef {{ offset: number, length: number }} DataRange
 */

/**
 * @extends {RandomAccessDisk}
 */
export class NbdDisk extends RandomAccessDisk {
  #nbdInfos
  /** @type {NbdClient|undefined} */
  #nbdClient

  /** @type {Array<DataRange> | undefined} */
  #dataMap

  /** @type {number} */
  #blockSize

  // Forward-only cursor for hasBlock(): the last extent index that matched and
  // the block index it was queried with. Lets ascending-order callers resume
  // scanning instead of restarting from 0. Relies on #dataMap being sorted and
  // non-overlapping (guaranteed by #processDatamap).
  /** @type {number | undefined} */
  #hasBlockCursor
  /** @type {number | undefined} */
  #hasBlockPreviousIndex

  constructor(nbdInfos, blockSize, { dataMap } = {}) {
    super()
    this.#blockSize = blockSize
    this.#nbdInfos = nbdInfos
    this.#dataMap = dataMap && this.#processDatamap(dataMap)
  }

  #processDatamap(rawDataMap) {
    const ranges = rawDataMap
      .filter(({ type, length }) => type === 0 && length > 0)
      .map(({ offset, length }) => ({ offset, length }))
      .sort(({ offset: offset1 }, { offset: offset2 }) => offset1 - offset2)

    // hasBlock()'s forward-only cursor is only correct if the extents are
    // sorted AND disjoint: an earlier extent must never reach into a block
    // after a later one, otherwise the cursor could skip it and wrongly report
    // a block as empty, dropping data and corrupting the output.
    // Touching extents (cur.offset === prevEnd) are merged
    const merged = []
    for (const range of ranges) {
      const last = merged[merged.length - 1]
      if (last !== undefined) {
        const lastEnd = last.offset + last.length
        if (range.offset < lastEnd) {
          throw new Error(
            `overlapping ranges in data map: [${last.offset}, ${lastEnd}) and [${range.offset}, ${range.offset + range.length})`
          )
        }
        if (range.offset === lastEnd) {
          // touching: extend the previous extent
          last.length += range.length
          continue
        }
      }
      // gap (or first range): new extent
      merged.push(range)
    }
    return merged
  }

  /**
   * @param {number} index
   * @returns {Promise<DiskBlock>}
   */
  async readBlock(index) {
    if (!this.#nbdClient) {
      throw new Error("can't readBlock before init")
    }
    let data = await this.#nbdClient.readBlock(index, this.getBlockSize())
    if (data.length !== this.getBlockSize()) {
      // this condition only work on non aligned disks
      // we won't accept truncated block from unaligned disks
      if (index === Math.ceil(this.getVirtualSize() / this.getBlockSize()) - 1) {
        // last block add zeros at the end
        data = Buffer.concat([data], this.getBlockSize())
      } else {
        throw new Error(`Block ${index} is not at the right size, expecting ${this.getBlockSize()}, got ${data.length}`)
      }
    }
    return {
      index,
      data,
    }
  }

  /**
   * @returns {number}
   */
  getVirtualSize() {
    if (!this.#nbdClient) {
      throw new Error("can't get size before init")
    }
    return Number(this.#nbdClient.exportSize)
  }

  /**
   * @returns {number}
   */
  getBlockSize() {
    return this.#blockSize
  }

  /**
   * @returns {Promise<void>}
   */
  async init() {
    this.#nbdClient = new NbdClient(this.#nbdInfos)
    await this.#nbdClient.connect()
    if (this.#dataMap === undefined) {
      this.#dataMap = this.#processDatamap(await this.#nbdClient.getMap())
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async close() {
    await this.#nbdClient?.disconnect()
  }

  /**
   * @returns {boolean}
   */
  isDifferencing() {
    return false
  }

  /**
   * @returns {Array<number>}
   */
  getBlockIndexes() {
    const indexes = new Set()
    this.#dataMap?.forEach(({ offset, length }) => {
      if (length === 0) return

      const firstBlockIndex = Math.floor(offset / this.getBlockSize())
      const lastBlockIndex = Math.floor((offset + length - 1) / this.getBlockSize())

      for (let blockIndex = firstBlockIndex; blockIndex <= lastBlockIndex; blockIndex++) {
        indexes.add(blockIndex)
      }
    })
    return [...indexes].sort((a, b) => a - b)
  }

  /**
   * Counts the allocated blocks without materializing the index list.
   *
   * @returns {number}
   */
  getBlockIndexesCount() {
    if (!this.#dataMap) {
      throw new Error("can't getBlockIndexesCount before init")
    }

    const blockSize = this.getBlockSize()

    let count = 0
    let lastCountedBlock = -1
    for (const { offset, length } of this.#dataMap) {
      const firstBlockIndex = Math.floor(offset / blockSize)
      const lastBlockIndex = Math.floor((offset + length - 1) / blockSize)
      const from = Math.max(firstBlockIndex, lastCountedBlock + 1)

      if (lastBlockIndex >= from) {
        count += lastBlockIndex - from + 1
        lastCountedBlock = lastBlockIndex
      }
    }

    return count
  }

  /**
   * @param {number} index
   * @returns {boolean}
   */
  hasBlock(index) {
    if (!this.#dataMap) {
      throw new Error("can't hasBlock before init")
    }

    const blockSize = this.getBlockSize()
    const blockStart = index * blockSize
    const blockEnd = blockStart + blockSize

    let startExtentIndex = 0
    if (this.#hasBlockCursor !== undefined && index >= this.#hasBlockPreviousIndex) {
      startExtentIndex = this.#hasBlockCursor
    }
    this.#hasBlockPreviousIndex = index

    const dataMap = this.#dataMap
    const l = dataMap.length
    for (let i = startExtentIndex; i < l; i++) {
      const { offset, length } = dataMap[i]
      if (offset >= blockEnd) {
        // extents are sorted: nothing from here on can overlap this block
        break
      }
      if (offset + length > blockStart) {
        this.#hasBlockCursor = i
        return true
      }
    }
    return false
  }
}
