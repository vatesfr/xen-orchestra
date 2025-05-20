import { Readable } from 'stream'
import { BaseVhd, FULL_BLOCK_BITMAP } from './BaseVhd.mjs'

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
    async function* generator() {
      yield footer
      yield header
      yield bat
      for await (const { data } of blockGenerator) {
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
