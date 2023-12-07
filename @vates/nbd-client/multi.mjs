import { asyncEach } from '@vates/async-each'
import { NBD_DEFAULT_BLOCK_SIZE } from './constants.mjs'
import NbdClient from './index.mjs'

export default class MultiNbdClient {
  #clients = []
  #readAhead

  constructor(settings, { nbdConcurrency = 8, readAhead = 16, ...options } = {}) {
    this.#readAhead = readAhead
    if (!Array.isArray(settings)) {
      settings = [settings]
    }
    for (let i = 0; i < nbdConcurrency; i++) {
      this.#clients.push(
        new NbdClient(settings[i % settings.length], { ...options, readAhead: Math.ceil(readAhead / nbdConcurrency) })
      )
    }
  }

  async connect() {
    for (const client of this.#clients) {
      await client.connect()
    }
  }

  async disconnect() {
    asyncEach(this.#clients, 
      client => client.disconnect(),
      {
        stopOnError: false
      }) 
  }

  async readBlock(index, size = NBD_DEFAULT_BLOCK_SIZE) {
    const clientId = index % this.#clients.length
    return this.#clients[clientId].readBlock(index, size)
  }

  async *readBlocks(indexGenerator) {
    // default : read all blocks
    const readAhead = []
    const makeReadBlockPromise = (index, size) => {
      const promise = this.readBlock(index, size)
      // error is handled during unshift
      promise.catch(() => {})
      return promise
    }

    // read all blocks, but try to keep readAheadMaxLength promise waiting ahead
    for (const { index, size } of indexGenerator()) {
      // stack readAheadMaxLength promises before starting to handle the results
      if (readAhead.length === this.#readAhead) {
        // any error will stop reading blocks
        yield readAhead.shift()
      }

      readAhead.push(makeReadBlockPromise(index, size))
    }
    while (readAhead.length > 0) {
      yield readAhead.shift()
    }
  }
}
