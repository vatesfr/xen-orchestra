import { Readable } from 'stream'
import { BaseVhd } from './BaseVhd.mjs'
import { SECTOR_SIZE } from 'vhd-lib/_constants.js'

export interface VhdStream extends Readable {
  length: number
}

export class VhdStream extends BaseVhd {
  toStream(): Readable {
    const footer = this.computeVhdFooter()
    const header = this.computeVhdHeader()
    const { bat, fileSize } = this.computeVhdBatAndFileSize() // the bat contains the calculated position of the futures blocks
    const blocks = this.source.diskBlocks()
    const FULL_BLOCK_BITMAP = Buffer.alloc(SECTOR_SIZE, 255)

    async function* generator(): AsyncGenerator<Buffer> {
      let start = Date.now()
      yield footer
      yield header
      yield bat
      for await (const { data, index } of blocks) {
        yield Buffer.concat([FULL_BLOCK_BITMAP, data])
      }
      yield footer
      console.log(Math.round(Date.now() - start) / 1000)
    }
    const stream = Readable.from(generator(), { objectMode: false, highWaterMark:10*102*1024 }) as VhdStream
    stream.length = fileSize
    return stream
  }
}
