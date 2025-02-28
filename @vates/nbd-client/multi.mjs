import { asyncEach } from '@vates/async-each'
import { NBD_DEFAULT_BLOCK_SIZE } from './constants.mjs'
import NbdClient from './index.mjs'
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('vates:nbd-client:multi')
export default class MultiNbdClient {
  #clients = []
  #nbdConcurrency
  #options
  #readAhead
  #settings

  get exportSize() {
    return this.#clients[0].exportSize
  }

  constructor(settings, { nbdConcurrency = 8, readAhead = 16, ...options } = {}) {
    this.#readAhead = readAhead
    this.#options = options
    this.#nbdConcurrency = nbdConcurrency
    if (!Array.isArray(settings)) {
      settings = [settings]
    }
    this.#settings = settings
  }

  /**
   *
   * open nbdConcurrency connections to NBD servers
   * it must obtain at least one connection to succeed
   * it tries to spread connections on multiple host
   *
   * @returns {Promise<void>}
   */
  async connect() {
    const candidates = [...this.#settings]

    const baseOptions = this.#options
    const _connect = async () => {
      if (candidates.length === 0) {
        return
      }
      // a little bit of randomization to spread the load
      const nbdInfo = candidates[Math.floor(Math.random() * candidates.length)]
      const client = new NbdClient(nbdInfo, {
        ...baseOptions,
        readAhead: Math.ceil(this.#readAhead / this.#nbdConcurrency),
      })
      try {
        await client.connect()
        this.#clients.push(client)
      } catch (err) {
        client.disconnect().catch(() => {})
        // do not hammer unreachable hosts, once failed, remove from the list
        const candidateIndex = candidates.findIndex(({ address }) => address === nbdInfo.address)
        if (candidateIndex >= 0) {
          // this candidate may have already been deleted by another parallel promise
          candidates.splice(candidateIndex, 1)
        }

        warn(`can't connect to one nbd client`, { err })
        // retry with another candidate (if available)
        return _connect()
      }
    }
    // don't connect in parallel since this can lead to race condition
    // on distributed systems ( like the NBD server of the XAPI)
    for (let i = 0; i < this.#nbdConcurrency; i++) {
      await _connect()
    }
    if (this.#clients.length === 0) {
      throw new Error(`Fail to connect to any Nbd client`)
    }
    if (this.#clients.length < this.#nbdConcurrency) {
      warn(
        `incomplete connection by multi Nbd, only ${this.#clients.length} over ${this.#nbdConcurrency} expected clients`
      )
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async disconnect() {
    await asyncEach(this.#clients, client => client.disconnect(), {
      stopOnError: false,
    })
  }

  /**
   *
   * @param {number} index
   * @param {number} size
   * @returns {Promise<Buffer>}
   */
  async readBlock(index, size = NBD_DEFAULT_BLOCK_SIZE) {
    const clientId = index % this.#clients.length
    return this.#clients[clientId].readBlock(index, size)
  }

  /**
   *
   * @param {AsyncGenerator<Buffer>} indexGenerator
   */
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
