import { DiskPassthrough } from './DiskPassthrough.mjs'
import { Synchronized } from '@vates/generator-toolbox'
import { Disk, DiskBlock } from './Disk.mjs'

export class SynchronizedDisk extends DiskPassthrough {
  #synchronized: Synchronized<DiskBlock, any, any> | undefined
  #source: Disk
  constructor(source: Disk) {
    super()
    this.#source = source
  }
  async openSource(): Promise<Disk> {
    // await this.#source.init()
    const generator = this.#source.diskBlocks()
    this.#synchronized = new Synchronized(generator)
    return this.#source
  }
  diskBlocks(uid: string): AsyncGenerator<DiskBlock> {
    console.log('will fork')
    if (this.#synchronized === undefined) {
      throw new Error("Can't call fork before init")
    }
    const fork = this.#synchronized.fork(uid)
    console.log('got fork ', fork)

    return fork
  }

  async close() {
    console.log('SynchronizedDisk.close')
    await this.source.close() // this will trigger cleanup in syncrhonized
  }
}
