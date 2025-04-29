import { Datastore } from './_Datastore.mjs'
import { Readable } from 'node:stream'

export class DatastoreSoapEsxi extends Datastore {
  #esxi
  constructor(datastoreName, { esxi, ...otherOptions } = {}) {
    super(datastoreName, otherOptions)
    this.#esxi = esxi
  }
  async getStream(path, start, end) {
    const res = await this.#esxi.download(this.datastoreName, path, start || end ? `${start}-${end}` : undefined)
    return Readable.from(res.body, { objectMode: false, highWaterMark: 2 * 1024 * 1024 })
  }
  async getBuffer(path, start, end) {
    const res = await this.#esxi.download(this.datastoreName, path, start || end ? `${start}-${end - 1}` : undefined)
    const bytes = await res.bytes()
    return Buffer.from(bytes)
  }
  async getSize(path) {
    const res = await this.#esxi.download(this.datastoreName, path)
    return Number(res.headers.get('content-length'))
  }
}
