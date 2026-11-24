import { DiskPassthrough } from './DiskPassthrough.mjs'
import { Synchronized } from '@vates/generator-toolbox'
import { Disk, DiskBlock } from './Disk.mjs'

class ForkedDisk extends DiskPassthrough {
  #closed = false
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
    // the source is shared by all the forks: it must handle being initialized by each of them
    await this.source.init()
  }
  async *diskBlocks(): AsyncGenerator<DiskBlock> {
    try {
      if (this.#closed) {
        // it has been closed while the source was being opened, it would look like an empty disk
        throw new Error(`Can't read the blocks of a closed forked disk`)
      }
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
  async close(): Promise<void> {
    const alreadyClosed = this.#closed
    this.#closed = true
    // closing the source first makes a pending read fail instead of ending like a complete disk
    await super.close()
    if (!alreadyClosed) {
      // the other forks are waiting for this one at each block, even if it has not been consumed at all
      await this.#generator.return(undefined)
    }
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
