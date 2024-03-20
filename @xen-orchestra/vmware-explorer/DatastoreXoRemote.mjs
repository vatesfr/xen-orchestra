import assert from 'node:assert'
import { Datastore } from './_Datastore.mjs'

export const DatastoreXoRemote = class DatastoreXoRemote extends Datastore {
  #handler
  constructor(datastoreName, { handler, ...otherOptions }) {
    super(datastoreName, otherOptions)
    this.#handler = handler
  }
  async getStream(path, start, end) {
    return this.#handler.createReadStream(path, { start, end })
  }
  async getBuffer(path, start, end) {
    const buffer = Buffer.alloc(end - start)
    const { bytesRead } = await this.#handler.read(path, buffer, start)
    assert.strictEqual(bytesRead, end - start)
    return buffer
  }
  async getSize(path) {
    return this.#handler.getSize(path)
  }
}
