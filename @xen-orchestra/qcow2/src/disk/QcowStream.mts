import { Readable } from "node:stream"
import { QcowDisk } from "./QcowDisk.mjs"
import {readChunkStrict, skipStrict} from '@vates/read-chunk'

export class QcowStream extends QcowDisk {
  #stream: Readable
  #streamOffset: number = 0
  #busy = false

  constructor(stream: Readable) {
    super()
    this.#stream = stream
  }
  async #read(length: number) {
    if (this.#busy) {
      throw new Error("Can't read/skip multiple block in parallel")
    }
    this.#busy = true
    const data = await readChunkStrict(this.#stream, length)
    this.#streamOffset += length
    this.#busy = false
    return data
  }

  async #skip(length: number) {
    if (this.#busy) {
      throw new Error("Can't read/skip multiple block in parallel")
    }
    this.#busy = true
    await skipStrict(this.#stream, length)
    this.#streamOffset += length
    this.#busy = false
  }

  async readBuffer(offset: number, length: number): Promise<Buffer> {
    if (offset < this.#streamOffset) {
      throw new Error(`Can't read backward in stream from ${this.#streamOffset} to ${offset}`)
    }
    if (offset > this.#streamOffset) {
      await this.#skip(offset - this.#streamOffset)
    }
    return this.#read(length)
  }
  async close(): Promise<void> {
    this.#stream.destroy()
  }
}
