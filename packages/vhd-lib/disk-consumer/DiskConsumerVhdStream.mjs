import { Readable } from 'stream'
import { BaseVhd, FULL_BLOCK_BITMAP } from './BaseVhd.mjs'
import { DEFAULT_BLOCK_SIZE } from '../_constants.js'

/**
 * @typedef {Readable & { length: number }} VhdStream
 */

/**
 * @extends {BaseVhd}
 */
export class DiskConsumerVhdStream extends BaseVhd {
  /**
   * @returns {VhdStream}
   */
  async toStream() {
    const footer = this.computeVhdFooter()
    const header = this.computeVhdHeader()
    const { bat, fileSize } = this.computeVhdBatAndFileSize() // the bat contains the calculated position of the futures blocks
    const uid = 'to stream ' + Math.random()
    const blockGenerator = this.source.diskBlocks(uid)
    const EXPECTED_FULL_BUFFER_SIZE = DEFAULT_BLOCK_SIZE + FULL_BLOCK_BITMAP.length
    async function* generator() {
      yield footer
      yield header
      yield bat
      let truncatedBlock = null
      for await (const { data, index } of blockGenerator) {
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
