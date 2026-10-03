import { DiskPassthrough } from './DiskPassthrough.mjs'
import { Synchronized } from '@vates/generator-toolbox'
import { Disk, DiskBlock } from './Disk.mjs'

function once(fn: () => void): () => void {
  let called = false
  return () => {
    if (!called) {
      called = true
      fn()
    }
  }
}

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
        // the block is shared with the other forks: a consumer releasing it twice must count only once
        yield block.release === undefined ? block : { ...block, release: once(block.release) }
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
  #nbForks = 0

  constructor(source: Disk) {
    this.#source = source
  }

  fork(uid: string): ForkedDisk {
    if (this.#synchronized === undefined) {
      const generator = this.#withSharedRelease(this.#source.diskBlocks())
      this.#synchronized = new Synchronized(generator)
    }
    // Synchronized forbids forking once the data is flowing: #nbForks is final when the first block is read
    const fork = this.#synchronized.fork(uid) as AsyncGenerator<DiskBlock, any, any>
    this.#nbForks++
    return new ForkedDisk(this.#source, fork)
  }

  // every fork gets the same block: its memory can only go back to its pool once all of them released it
  // a fork which stops early never releases the next blocks, they are then left to the garbage collector
  async *#withSharedRelease(generator: AsyncGenerator<DiskBlock>): AsyncGenerator<DiskBlock> {
    for await (const block of generator) {
      const { release } = block
      if (release === undefined) {
        yield block
      } else {
        let remaining = this.#nbForks
        yield {
          ...block,
          release: () => {
            if (--remaining === 0) {
              release()
            }
          },
        }
      }
    }
  }
  close() {
    return this.#source.close()
  }
}
