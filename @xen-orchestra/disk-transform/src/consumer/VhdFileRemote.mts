import type { FileAccessor } from '../FileAccessor.mjs'
import type { PortableDisk } from '../PortableDisk.mjs'
import { VhdStream } from './VhdStream.mjs'

type VhdRemoteTarget = {
  handler: FileAccessor
  path: string
}

export class VhdFileRemote extends VhdStream {
  #target: VhdRemoteTarget
  constructor(source: PortableDisk, target: VhdRemoteTarget) {
    super(source)
    this.#target = target
  }

  async write() {
    const stream = this.toStream()
    await this.#target.handler.outputStream(stream)
  }
}
