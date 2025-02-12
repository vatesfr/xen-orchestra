import type { DiskBlock } from '../PortableDisk.mts'
import { connectNbdClientIfPossible } from './nbdutils.mjs'
import { XapiVhdStreamSource } from './XapiVhdStreamSource.mjs'

export class XapiVhdStreamNbdSource extends XapiVhdStreamSource {
  #nbdClient: any
  #nbdConcurrency: number

  constructor({ vdiRef, baseRef, xapi, nbdConcurrency = 4 }) {
    super({ vdiRef, baseRef, xapi })
    this.#nbdConcurrency = nbdConcurrency
  }

  async init(): Promise<void> {
    await super.init()
    this.#nbdClient = await connectNbdClientIfPossible(this.xapi, this.ref, this.#nbdConcurrency)
    // we won't use the stream anymore
    await super.close()
  }
  async readBlock(index: number): Promise<DiskBlock> {
    const data = await this.#nbdClient.readBlock(index, this.getBlockSize())
    return { index, data }
  }
  async *buildDiskBlockGenerator(): AsyncGenerator<DiskBlock> {
    for (const { index } of this.blocks) {
      yield this.readBlock(index)
    }
  }

  async close() {
    await super.close()
    await this.#nbdClient?.disconnect()
  }
}
