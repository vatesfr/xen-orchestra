import { Datastore } from './_Datastore.mjs'

export class DatastoreSoapEsxi extends Datastore {
  #esxi
  constructor(datastoreName, { esxi, ...otherOptions } = {}) {
    super(datastoreName, otherOptions)
    this.#esxi = esxi
  }
  async getStream(path, start, end) {
    const res = await this.#esxi.download(this.datastoreName, path, start || end ? `${start}-${end}` : undefined)
    return res.body
  }
  async getBuffer(path, start, end) {
    return (
      await this.#esxi.download(this.datastoreName, path, start || end ? `${start}-${end - 1}` : undefined)
    ).buffer()
  }
  async getSize(path) {
    const res = await this.#esxi.download(this.datastoreName, path)
    return Number(res.headers.get('content-length'))
  }
}
