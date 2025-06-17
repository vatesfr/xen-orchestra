import { DiskBlock, FileAccessor } from "@xen-orchestra/disk-transform"
import { QcowDisk } from "./QcowDisk.mjs"

export class QCowAccessor extends QcowDisk {

  #accessor: FileAccessor
  #path: string
  #descriptor: number | undefined 

  constructor(accessor: FileAccessor, path: string) {
    super()
    this.#accessor = accessor
    this.#path = path
  }

  async init() {
    this.#descriptor = await this.#accessor.openFile(this.#path)
    await super.init()
  }

  async readBuffer(offset: number, length: number): Promise<Buffer> {
    if (this.#descriptor === undefined) {
      throw new Error("Can't get file decriptor before init")
    }
    const buffer = Buffer.alloc(length)
    await this.#accessor.read(this.#descriptor , buffer, offset)
    return buffer
  }

  close(): Promise<void> {
    return this.#descriptor !== undefined && this.#accessor.closeFile(this.#descriptor)
  }
}
