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
    let sent = 0
    function * track(buffer){
      yield buffer
      sent += buffer.length
      console.log({sent, fileSize})
    }
    async function* generator() {
      yield *track(footer)
      yield *track(header)
      yield *track(bat)
      for await (const { data } of blockGenerator) {
        yield *track(Buffer.concat([FULL_BLOCK_BITMAP, data]))
      }
      yield *track(footer)
    }

    /** @type {VhdStream} */
    const stream = Readable.from(generator(), { objectMode: false, highWaterMark: 10 * 1024 * 1024 })
    stream.length = fileSize
    return stream
  }
}
