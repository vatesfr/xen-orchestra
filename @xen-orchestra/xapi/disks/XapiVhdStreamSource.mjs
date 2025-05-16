// @ts-check
/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 * @typedef {import('stream').Readable} Readable
 */

import { Disk } from '@xen-orchestra/disk-transform'
import { readChunkStrict, skipStrict } from '@vates/read-chunk'

import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import Constants, { DEFAULT_BLOCK_SIZE } from 'vhd-lib/_constants.js'
import assert from 'node:assert'

const { BLOCK_UNUSED, DISK_TYPES, FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } = Constants
export class XapiVhdStreamSource extends Disk {
  /** @type {Readable | undefined} */
  #vhdStream

  /** @type {boolean} */
  #busy = false

  /** @type {number} */
  #streamOffset = 0

  /** @type {number | undefined} */
  #virtualSize

  /** @type {Array<{ index: number; offset: number }>} */
  #blocks = []

  /** @type {Set<number>} */
  #blockSet = new Set()
  get blocks() {
    return this.#blocks
  }

  /** @type {boolean} */
  #initDone = false

  #xapi
  get xapi() {
    return this.#xapi
  }

  /** @type {string} */
  #ref
  /** @returns {string} */
  get ref() {
    return this.#ref
  }

  /** @type {string|undefined} */
  #baseRef
  /** @returns {string|undefined} */
  get baseRef() {
    return this.#baseRef
  }

  /** @type {boolean|undefined} */
  #isDifferencing
  /**
   * @param {Object} params
   * @param {string} params.vdiRef
   * @param {string| undefined} params.baseRef
   * @param {any} params.xapi
   */
  constructor({ vdiRef, baseRef, xapi }) {
    super()
    this.#ref = vdiRef
    this.#baseRef = baseRef
    this.#xapi = xapi
  }
  /**
   * @returns {number}
   */
  getVirtualSize() {
    if (this.#virtualSize === undefined) {
      throw new Error('Virtual size of XapiVhdStreamSource has not been initialized before use')
    }
    return this.#virtualSize
  }
  /**
   * @returns {number}
   */
  getBlockSize() {
    return 2 * 1024 * 1024
  }

  /**
   * @param {number} length
   * @returns {Promise<Buffer>}
   */
  async #read(length) {
    if (this.#busy) {
      throw new Error("Can't read/skip multiple block in parallel")
    }
    this.#busy = true
    const data = /** @type {Buffer} */ (/** @type {unknown} */ (await readChunkStrict(this.#vhdStream, length)))
    this.#streamOffset += length
    this.#busy = false
    return data
  }

  /**
   * @param {number} length
   * @returns {Promise<void>}
   */
  async #skip(length) {
    if (this.#busy) {
      throw new Error("Can't read/skip multiple block in parallel")
    }
    this.#busy = true
    await skipStrict(this.#vhdStream, length)
    this.#streamOffset += length
    this.#busy = false
  }

  /**
   * @returns {Promise<Readable> }
   */
  async #getExportStream() {
    // get the stream with nbd or any magic
    const stream = await this.#xapi.VDI_exportContent(this.ref, {
      baseRef: this.#baseRef,
      format: 'vhd',
      preferNbd: false,
    })
    return stream
  }

  /**
   * @returns {Promise<void> }
   */
  async init() {
    this.#vhdStream = await this.#getExportStream()
    const footer = unpackFooter(await this.#read(FOOTER_SIZE))
    this.#isDifferencing = footer.diskType === DISK_TYPES.DIFFERENCING
    this.#virtualSize = footer.currentSize
    const header = unpackHeader(await this.#read(HEADER_SIZE))
    const batSize = Math.ceil((header.maxTableEntries * 4) / SECTOR_SIZE) * SECTOR_SIZE
    // skip space between header and beginning of the table
    await this.#skip(header.tableOffset - (FOOTER_SIZE + HEADER_SIZE))
    const bat = await this.#read(batSize)
    const blocks = []
    for (let index = 0; index < header.maxTableEntries; index++) {
      const offset = bat.readUInt32BE(index * 4)
      if (offset !== BLOCK_UNUSED) {
        blocks.push({ index, offset: (offset + 1) /* skip block bitmap */ * SECTOR_SIZE })
        this.#blockSet.add(index)
      }
    }
    // ensure we will generate the blocks in the same order as the stream
    blocks.sort((b1, b2) => b1.offset - b2.offset)
    this.#blocks = blocks
    this.#initDone = true
  }

  async close() {
    this.#vhdStream?.on('error', () => {})
    this.#vhdStream?.destroy()
  }

  /**
   *
   * @returns {Array<number>}
   */
  getBlockIndexes() {
    assert.strictEqual(this.#initDone, true, 'init must be done to call getBlockIndexes')

    return this.#blocks.map(({ index }) => index)
  }

  /**
   *
   * @param {number} index
   * @returns {boolean}
   */
  hasBlock(index) {
    assert.strictEqual(this.#initDone, true, 'init must be done to call hasBlock')
    return this.#blockSet.has(index)
  }

  /**
   * @returns  {AsyncGenerator<DiskBlock> }
   */
  buildDiskBlockGenerator() {
    assert.strictEqual(this.#initDone, true, 'init must be done to call buildDiskGenerator')
    const blockIndexes = this.#blocks
    const self = this
    async function* generator() {
      for (const { offset, index } of blockIndexes) {
        await self.#skip(offset - self.#streamOffset) // this will skip the bitmap
        const data = await self.#read(DEFAULT_BLOCK_SIZE)
        yield {
          index,
          data,
        }
      }
    }

    return generator()
    // @todo read the end to check the end footer and ensure the stream is complete
  }

  /**
   * @returns {boolean}
   */
  isDifferencing() {
    if (this.#isDifferencing === undefined) {
      throw new Error('isDifferencing of XapiVhdStreamSource has not been initialized before use')
    }
    return this.#isDifferencing
  }
}
