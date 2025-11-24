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

  constructor(nbdInfos, blockSize, { dataMap } = {}) {
    super()
    this.#blockSize = blockSize
    this.#nbdInfos = nbdInfos
    this.#dataMap = dataMap && this.#processDatamap(dataMap)
  }

  #processDatamap(rawDataMap) {
    return rawDataMap
      .filter(({ type }) => type === 0)
      .map(({ offset, length }) => ({ offset, length }))
      .sort(({ offset: offset1 }, { offset: offset2 }) => offset1 - offset2)
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
   * @param {number} index
   * @returns {boolean}
   */
  hasBlock(index) {
    if (!this.#dataMap) {
      throw new Error("can't hasBlock before init")
    }
    const blockStart = index * this.getBlockSize()
    const blockEnd = (index + 1) * this.getBlockSize()
    return this.#dataMap.some(({ offset, length }) => offset + length > blockStart && blockEnd >= offset)
  }
}
