import { Readable } from 'stream'
import { BaseVhd, FULL_BLOCK_BITMAP } from './BaseVhd.mjs'
import { DEFAULT_BLOCK_SIZE } from '../_constants.js'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { fuFooter, fuHeader, checksumStruct } from 'vhd-lib/_structs.js'

/**
 * @typedef {Readable & { length: number }} VhdStream
 */

/**
 * @typedef {Object} VhdStreamTarget
 * @property {Buffer?} uuid
 * @property {Buffer?} parentUuid
 * @property {string?} parentPath
 */

/**
 * @extends {BaseVhd}
 */
export class DiskConsumerVhdStream extends BaseVhd {
  /** @type {VhdStreamTarget} */
  #target

  /**
   * @param {import('@xen-orchestra/disk-transform').Disk} source
   * @param {VhdStreamTarget} [target]
   */
  constructor(source, target = {}) {
    super(source)
    this.#target = target
  }

  /**
   * @param {AbortSignal} [signal]
   * @returns {VhdStream}
   */
  async toStream(signal) {
    const { uuid, parentUuid, parentPath } = this.#target

    // footer/header are yielded as raw bytes below (no separate writeFooter()/writeHeader()
    // step to repack them later), so any post-creation change must be repacked here
    const footerObj = unpackFooter(this.computeVhdFooter())
    if (uuid) {
      footerObj.uuid = uuid
    }
    const footer = fuFooter.pack(footerObj)
    checksumStruct(footer, fuFooter)

    const headerObj = unpackHeader(this.computeVhdHeader())
    if (parentUuid) {
      headerObj.parentUuid = parentUuid
    }
    if (parentPath) {
      headerObj.parentUnicodeName = parentPath
    }
    const header = fuHeader.pack(headerObj)
    checksumStruct(header, fuHeader)

    const { bat, fileSize } = this.computeVhdBatAndFileSize() // the bat contains the calculated position of the futures blocks
    const uid = 'to stream ' + Math.random()
    const blockGenerator = this.source.diskBlocks(uid)
    const EXPECTED_FULL_BUFFER_SIZE = DEFAULT_BLOCK_SIZE + FULL_BLOCK_BITMAP.length
    async function* generator() {
      signal?.throwIfAborted()
      yield footer
      yield header
      yield bat
      let truncatedBlock = null
      for await (const { data, index } of blockGenerator) {
        signal?.throwIfAborted()
        // only the last block can be truncated
        // but the stream expect a full block
        if (truncatedBlock !== null) {
          throw new Error(
            `Expecting a ${DEFAULT_BLOCK_SIZE} bytes block, got a ${truncatedBlock.data.length}, for index ${truncatedBlock.index}`
          )
        }

        if (data.length < DEFAULT_BLOCK_SIZE) {
          truncatedBlock = { data, index }
        }
        // ensure the blocks are always at full size
        yield Buffer.concat([FULL_BLOCK_BITMAP, data], EXPECTED_FULL_BUFFER_SIZE)
      }
      yield footer
    }

    /** @type {VhdStream} */
    const stream = Readable.from(generator(), { objectMode: false, highWaterMark: 10 * 1024 * 1024 })
    stream.length = fileSize
    return stream
  }
}
