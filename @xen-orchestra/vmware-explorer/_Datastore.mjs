export class Datastore {
  #datastoreName

  get datastoreName() {
    return this.#datastoreName
  }
  constructor(dataStoreName) {
    this.#datastoreName = dataStoreName
  }
  async getStream(path, start, end) {
    throw new Error('Not implemented')
  }
  async getBuffer(path, start, end) {
    throw new Error('Not implemented')
  }
  async getSize(path) {}
}
