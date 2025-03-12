// @ts-check
/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 * @typedef {import('@xen-orchestra/disk-transform').Disk} Disk
 * @typedef {import('@vates/nbd-client/multi.mjs')} MultiNbdClient
 */

import { connectNbdClientIfPossible } from './utils.mjs'
import { XapiVhdStreamSource } from './XapiVhdStreamSource.mjs'

export class XapiVhdStreamNbdSource extends XapiVhdStreamSource {
  /** @type {MultiNbdClient|undefined} */
  #nbdClient
  /** @type {number } */
  #nbdConcurrency

  /**
   * @param {Object} params
   * @param {string} params.vdiRef
   * @param {string|undefined} params.baseRef
   * @param {any} params.xapi
   * @param {number} params.nbdConcurrency
   */
  constructor({ vdiRef, baseRef, xapi, nbdConcurrency = 4 }) {
    super({ vdiRef, baseRef, xapi })
    this.#nbdConcurrency = nbdConcurrency
  }

  /** @returns {Promise<void>} */
  async init() {
    await super.init()
    const client = await connectNbdClientIfPossible(this.xapi, this.ref, this.#nbdConcurrency)
    if (client === undefined) {
      throw new Error(`can't connect to any nbd client`)
    }
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
  /**
   * @returns {Promise<AsyncGenerator<DiskBlock>> }
   */
  async buildDiskBlockGenerator() {
    const self = this
    async function* generator() {
      for (const { index } of this.blocks) {
        yield self.readBlock(index)
      }
    }
    return generator()
  }

  /** @returns {Promise<void>} */
  async close() {
    await super.close()
    await this.#nbdClient?.disconnect()
  }
}
