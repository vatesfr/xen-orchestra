import { Readable } from 'stream'
import { BaseVhd, FULL_BLOCK_BITMAP } from './BaseVhd.mjs'
import assert from 'node:assert'
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
    let length = 0
    function* yieldAndTrack(buffer) {
      length += buffer.length
      yield buffer
    }
    async function* generator() {
      yield* yieldAndTrack(footer)
      yield* yieldAndTrack(header)
      yield* yieldAndTrack(bat)
      for await (const { data } of blockGenerator) {
        assert.strictEqual(data.length, 2 * 1024 * 1024)
        yield* yieldAndTrack(Buffer.concat([FULL_BLOCK_BITMAP, data]))
      }
      yield* yieldAndTrack(footer)
      assert.strictEqual(length, stream.length)
    }

    /** @type {VhdStream} */
    const stream = Readable.from(generator(), { objectMode: false, highWaterMark: 10 * 1024 * 1024 })
    stream.length = fileSize
    return stream
  }
}
