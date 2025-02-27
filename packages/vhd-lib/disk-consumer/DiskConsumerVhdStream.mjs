import { Readable } from 'stream'
import { BaseVhd } from './BaseVhd.mjs'
import { SECTOR_SIZE } from 'vhd-lib/_constants.js'

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
    const blocks = await this.source.diskBlocks()
    const FULL_BLOCK_BITMAP = Buffer.alloc(SECTOR_SIZE, 255)

    async function* generator() {
      yield footer
      yield header
      yield bat
      for await (const { data } of blocks) {
        yield Buffer.concat([FULL_BLOCK_BITMAP, data])
      }
      yield footer
    }

    /** @type {VhdStream} */
    const stream = Readable.from(generator(), { objectMode: false, highWaterMark: 10 * 1024 * 1024 })
    stream.length = fileSize
    return stream
  }
}
