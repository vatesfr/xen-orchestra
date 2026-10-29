import { DiskPassthrough } from './DiskPassthrough.mjs'
import { Synchronized } from '@vates/generator-toolbox'
import { Disk, DiskBlock } from './Disk.mjs'

class ForkedDisk extends DiskPassthrough {
  #closed = false
  #generator: AsyncGenerator<DiskBlock, any, any>
  #generatedDiskBlocks = 0
  #init: () => Promise<void>
  constructor(source: Disk, generator: AsyncGenerator<DiskBlock, any, any>, init: () => Promise<void>) {
    super(source)
    this.#generator = generator
    this.#init = init
  }
  async openSource(): Promise<Disk> {
    throw new ErrorEvent(' No need to open forked disk ')
  }
  async init(): Promise<void> {
    // the source is shared by all the forks, it is only opened by the first one
    await this.#init()
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
  #init: () => Promise<void>
  #initPromise: Promise<void> | undefined

  /**
   * @param source
   * @param options.init how to open the source, defaults to `source.init()`
   */
  constructor(source: Disk, { init = () => source.init() }: { init?: () => Promise<void> } = {}) {
    this.#source = source
    this.#init = init
  }

  init(): Promise<void> {
    if (this.#initPromise === undefined) {
      this.#initPromise = this.#init()
    }
    return this.#initPromise
  }

  fork(uid: string): ForkedDisk {
    if (this.#synchronized === undefined) {
      const generator = this.#source.diskBlocks()
      this.#synchronized = new Synchronized(generator)
    }
    return new ForkedDisk(this.#source, this.#synchronized.fork(uid) as AsyncGenerator<DiskBlock, any, any>, () =>
      this.init()
    )
  }
  close() {
    return this.#source.close()
  }
}
