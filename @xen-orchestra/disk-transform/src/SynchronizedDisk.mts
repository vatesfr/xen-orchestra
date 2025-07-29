import { DiskPassthrough } from './DiskPassthrough.mjs'
import { Synchronized } from '@vates/generator-toolbox'
import { Disk, DiskBlock } from './Disk.mjs'

class ForkedDisk extends DiskPassthrough {
  #generator: AsyncGenerator<DiskBlock, any, any>
  #generatedDiskBlocks = 0
  constructor(source: Disk, generator: AsyncGenerator<DiskBlock, any, any>) {
    super(source)
    this.#generator = generator
  }
  async openSource(): Promise<Disk> {
    throw new ErrorEvent(' No need to open forked disk ')
  }
  async init(): Promise<void> {
    /* source has already been open , */
  }
  async *diskBlocks(): AsyncGenerator<DiskBlock> {
    try {
      for await (const block of this.#generator) {
        this.#generatedDiskBlocks++
        yield block
      }
    } finally {
      await this.progressHandler?.done()
      await this.close()
    }
  }
  getNbGeneratedBlock(): number {
    return this.#generatedDiskBlocks
  }
}

export class SynchronizedDisk {
  #synchronized: Synchronized<DiskBlock, any, any> | undefined
  #source: Disk

  constructor(source: Disk) {
    this.#source = source
  }

  fork(uid: string): ForkedDisk {
    if (this.#synchronized === undefined) {
      const generator = this.#source.diskBlocks()
      this.#synchronized = new Synchronized(generator)
    }
    return new ForkedDisk(this.#source, this.#synchronized.fork(uid) as AsyncGenerator<DiskBlock, any, any>)
  }
  close() {
    return this.#source.close()
  }
}
