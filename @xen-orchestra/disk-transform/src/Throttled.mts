import { Throttle } from '@vates/generator-toolbox'
import { Disk, DiskBlock } from './Disk.mjs'
import { DiskPassthrough } from './DiskPassthrough.mjs'

export class ThrottledDisk extends DiskPassthrough {
  #throttle: Throttle
  constructor(source: Disk, throttle: Throttle) {
    super(source)
    this.#throttle = throttle
  }
  async buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> {
    const generator = await this.source.buildDiskBlockGenerator()
    //throttle want to be able to know the length of the data
    async function* generatorWithLength() {
      for await (const block of generator) {
        // keep the optional properties (release)
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
