import { Throttle } from '@vates/generator-toolbox'
import { Disk, DiskBlock } from './Disk.mjs'
import { DiskPassthrough } from './DiskPassthrough.mjs'

export class ThrottledDisk extends DiskPassthrough {
  #throttle: Throttle
  constructor(source: Disk, throttle: Throttle) {
    super(source)
    this.#throttle = throttle
  }
  async init(): Promise<void> {
    // nothing to open here, but the source may not be opened yet
    await this.source.init()
  }
  async buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> {
    const generator = await this.source.buildDiskBlockGenerator()
    //throttle want to be able to know the length of the data
    async function* generatorWithLength() {
      for await (const block of generator) {
        // keep the other properties of the block (like the compression of a raw VHD directory block)
        yield {
          ...block,
          length: block.data.length,
        }
      }
    }
    const throttledGenerator = this.#throttle.createThrottledGenerator(generatorWithLength())
    return throttledGenerator as AsyncGenerator<DiskBlock>
  }
}
