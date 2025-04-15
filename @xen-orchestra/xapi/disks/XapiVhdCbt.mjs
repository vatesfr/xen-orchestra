// @ts-check
/**
 * @typedef {import('@xen-orchestra/disk-transform').Disk} Disk
 */
import assert from 'node:assert'
import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
import { connectNbdClientIfPossible } from './utils.mjs'

/**
 * @typedef {Error & { code: string }} ErrorWithCode
 */

/**
 * Represents a source for reading VHD (Virtual Hard Disk) data using Change Block Tracking (CBT).
 */
export class XapiVhdCbtSource extends RandomAccessDisk {
  /** @type {any} */
  #nbdClient

  /** @type {number} */
  #nbdConcurrency

  /** @type {string} */
  #ref

  /** @type {string | undefined} */
  #baseRef

  /** @type {any} */
  #xapi

  /** @type {Buffer | undefined} */
  #cbt

  /** @type {number | undefined} */
  #virtualSize

  /**
   * @param {Object} params
   * @param {string} params.vdiRef
   * @param {string|undefined} params.baseRef
   * @param {any} params.xapi
   * @param {number} params.nbdConcurrency
   */
  constructor({ vdiRef, baseRef, xapi, nbdConcurrency }) {
    super()
    this.#ref = vdiRef
    this.#baseRef = baseRef
    assert.notEqual(baseRef, undefined, 'CBT source can only be used for delta, no baseref given')
    this.#xapi = xapi
    this.#nbdConcurrency = nbdConcurrency
  }

  /** @returns {Promise<void>} */
  async init() {
    const ref = this.#ref
    const xapi = this.#xapi
    const nbdConcurrency = this.#nbdConcurrency

    const [cbt_enabled, size] = await Promise.all([
      xapi.getField('VDI', ref, 'cbt_enabled').catch(() => {
        /* on XS < 7.3 cbt is not supported */
      }),
      xapi.getField('VDI', ref, 'virtual_size'),
    ])
    if (cbt_enabled === false) {
      const error = new Error(`CBT is disabled`)
      error.code = 'CBT_DISABLED'
      throw error
    }

    this.#virtualSize = size

    this.#cbt = await this.#xapi.VDI_listChangedBlock(this.#ref, this.#baseRef)
    const client = await connectNbdClientIfPossible(xapi, ref, nbdConcurrency)
    this.#nbdClient = client
  }

  /** @returns {number} */
  getVirtualSize() {
    if (this.#virtualSize === undefined) {
      throw new Error(`Can't getVirtualSize of a xapivhdcbt disk before init`)
    }
    return this.#virtualSize
  }

  /** @returns {number} */
  getBlockSize() {
    return 2 * 1024 * 1024
  }

  /** @returns {Array<number>} */
  getBlockIndexes() {
    if (this.#cbt === undefined) {
      throw new Error(`Can't getBlockIndexes of a xapivhdcbt disk before init`)
    }
    assert.strictEqual(this.getBlockSize(), 2 * 1024 * 1024)

    // Blocks are aligned, we could probably compare the bytes to 255
    // Each CBT block is 64KB
    // Each VHD block is 2MB
    // => 32 CBT blocks per VHD block
    // Each CBT block used flag is stored in 1 bit
    // => 4 bytes per VHD block => UINT32
    // If any sublock is used => download the full block
    const nbBlocks = this.#cbt.length / 4
    const blocks = []
    for (let blockId = 0; blockId < nbBlocks; blockId++) {
      const position = blockId * 4
      if (this.#cbt.readUInt32BE(position) !== 0) {
        blocks.push(blockId)
      }
    }
    return blocks
  }

  /**
   * @param {number} index
   * @returns {Promise<import('@xen-orchestra/disk-transform').DiskBlock>}
   */
  async readBlock(index) {
    const data = await this.#nbdClient.readBlock(index, this.getBlockSize())
    return { index, data }
  }

  /** @returns {Promise<void>} */
  async close() {
    await this.#nbdClient?.disconnect()
  }

  /** @returns {boolean} */
  isDifferencing() {
    return true
  }

  /**
   * @param {number} index
   * @returns {boolean}
   */
  hasBlock(index) {
    if (this.#cbt === undefined) {
      throw new Error(`Can't use hasBlock of a xapivhdcbt disk before init`)
    }
    // Blocks are aligned, we could probably compare the bytes to 255
    // Each CBT block is 64KB
    // Each VHD block is 2MB
    // => 32 CBT blocks per VHD block
    // Each CBT block used flag is stored in 1 bit
    // => 4 bytes per VHD block => UINT32
    // If any sublock is used => download the full block
    const position = index * 4
    return this.#cbt.readUInt32BE(position) !== 0
  }
}
