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

  /**
   * @param {string} vmRef
   * @param {string} diskPath
   * @param {number} blockSize
   */
  constructor(nbdInfos, blockSize) {
    super()
    this.#blockSize = blockSize
    this.#nbdInfos = nbdInfos
  }

  /**
   * @param {number} index
   * @returns {Promise<DiskBlock>}
   */
  async readBlock(index) {
    if (!this.#nbdClient) {
      throw new Error("can't readBlock before init")
    }
    const data = await this.#nbdClient.readBlock(index, this.getBlockSize())
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
    const diskMap = await this.#nbdClient.getMap()
    console.log('got map ', diskMap)
    this.#dataMap = diskMap.filter(({ type }) => type === 0).map(({ offset, length }) => ({ offset, length }))
  }

  /**
   * @returns {Promise<void>}
   */
  async close() {
    this.#nbdClient?.disconnect()
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
    let empty = 0
    this.#dataMap?.forEach(({ offset, length }) => {
      const lastBlockIndex = Math.ceil((offset + length) / this.getBlockSize())
      empty += this.#blockSize - ((offset + length) % this.#blockSize)
      empty += offset % this.#blockSize
      for (let blockIndex = Math.floor(offset / this.getBlockSize()); blockIndex < lastBlockIndex; blockIndex++) {
        indexes.add(blockIndex)
      }
    })
    console.log(this.#dataMap)
    console.log([...indexes])
    console.log({
      nbBlocks: indexes.size,
      empty,
      size: Number(this.#nbdClient.exportSize),
      blockSize: this.getBlockSize(),
    })
    // process.exit()
    return [...indexes]
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
