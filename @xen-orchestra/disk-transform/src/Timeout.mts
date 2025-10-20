import { Timeout } from '@vates/generator-toolbox'
import { Disk, DiskBlock } from './Disk.mjs'
import { DiskPassthrough } from './DiskPassthrough.mjs'

export class TimeoutDisk extends DiskPassthrough {
  #timeout: number
  constructor(source: Disk, timeout: number) {
    super(source)
    this.#timeout = timeout
  }
  async buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> {
    const generator = await this.source.buildDiskBlockGenerator()
    const timeoutedGenerator = new Timeout(generator, this.#timeout)
    return timeoutedGenerator
  }
}
