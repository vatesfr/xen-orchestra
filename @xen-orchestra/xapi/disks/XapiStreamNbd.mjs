// @ts-check
/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 * @typedef {import('@xen-orchestra/disk-transform').Disk} Disk
 * @typedef {import('@xen-orchestra/disk-transform').RandomAccessDisk} RandomAccessDisk
 * @typedef {import('@vates/nbd-client/multi.mjs')} MultiNbdClient
 */

import { DiskPassthrough } from '@xen-orchestra/disk-transform'
import { connectNbdClientIfPossible } from './utils.mjs'
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('@xen-orchestra/xapi/disks/XapiStreamNbd')
export class XapiStreamNbdSource extends DiskPassthrough {
  /** @type {MultiNbdClient|undefined} */
  #nbdClient
  /** @type {number } */
  #nbdConcurrency

  /**
   * @type {any}
   */
  #xapi
  /**
   * @type {string}
   */
  #vdiRef

  /**
   * @param {Disk} streamSourceDisk
   * @param {Object} params
   * @param {string} params.vdiRef
   * @param {string|undefined} params.baseRef
   * @param {any} params.xapi
   * @param {number} params.nbdConcurrency
   */
  constructor(streamSourceDisk, { vdiRef, xapi, nbdConcurrency = 4 }) {
    if (streamSourceDisk === undefined) {
      throw new Error(`A stream source must be given`)
    }
    super(streamSourceDisk)
    this.#nbdConcurrency = nbdConcurrency
    this.#vdiRef = vdiRef
    this.#xapi = xapi
  }
  /**
   * @returns {Promise<RandomAccessDisk>}
   */
  openSource() {
    //
    throw new Error('Method not implemented.')
  }
  /** @returns {Promise<void>} */
  async init() {
    await super.init()
    const client = await connectNbdClientIfPossible(this.#xapi, this.#vdiRef, this.#nbdConcurrency)
    this.#nbdClient = client
    // we won't use the stream anymore
    await super.close()
  }
  /**
   * @param {number} index
   * @returns {Promise<DiskBlock>}
   */
  async readBlock(index) {
    if (this.#nbdClient === undefined) {
      throw new Error(`Can't use the nbd client of a XapiVhdStreamNbdSource before init`)
    }
    const data = await this.#nbdClient.readBlock(index, this.getBlockSize())
    return { index, data }
  }

  async *buildDiskBlockGenerator() {
    for (const index of this.getBlockIndexes()) {
      yield this.readBlock(index)
    }
  }
  /** @returns {Promise<void>} */
  async close() {
    try {
      await super.close()
    } catch (err) {
      warn('error whilee closing stream source', { vdiRef: this.#vdiRef, err })
    }
    await this.#nbdClient?.disconnect()
  }
}
