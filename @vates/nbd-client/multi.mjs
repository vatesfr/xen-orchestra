import { asyncEach } from '@vates/async-each'
import { NBD_DEFAULT_BLOCK_SIZE, NBD_DEFAULT_PORT } from './constants.mjs'
import { formatAddress } from './formatAddress.mjs'
import NbdClient from './index.mjs'
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('vates:nbd-client:multi')
export default class MultiNbdClient {
  #clients = []
  #nbdConcurrency
  #nextClient = 0
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
    // keyed by address: a candidate is removed from `candidates` on its first failure, so it is
    // attempted at most once and this keeps the reason of that single attempt
    const errorByAddress = new Map()

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
        errorByAddress.set(nbdInfo.address, err)
        // do not hammer unreachable hosts, once failed, remove from the list
        const candidateIndex = candidates.findIndex(({ address }) => address === nbdInfo.address)
        if (candidateIndex >= 0) {
          // this candidate may have already been deleted by another parallel promise
          candidates.splice(candidateIndex, 1)
        }

        warn(`can't connect to one nbd client`, {
          address: nbdInfo.address,
          port: nbdInfo.port ?? NBD_DEFAULT_PORT,
          err,
        })
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
      if (errorByAddress.size === 0) {
        // the loop above did not run a single iteration, or there was no candidate at all: no
        // socket was ever opened, so claiming the servers were attempted and unreachable would be
        // a lie. Report what actually happened instead of pre-validating the values.
        const error = new Error(
          `no NBD connection was attempted (${this.#settings.length} server(s), nbdConcurrency is ${this.#nbdConcurrency})`
        )
        error.code = 'NO_NBD_AVAILABLE'
        throw error
      }
      // `#settings` order is kept so the report matches what the caller asked for. Every candidate
      // was attempted: `_connect` recurses until the list is empty
      const attempts = this.#settings.map(({ address, port = NBD_DEFAULT_PORT }) => ({
        address,
        port,
        error: errorByAddress.get(address)?.message ?? 'unknown error',
      }))
      const error = new Error(
        `could not connect to any NBD server, attempted ${attempts
          .map(({ address, port, error }) => `${formatAddress(address, port)} (${error})`)
          .join(', ')}`,
        // all the servers usually fail for the same reason, keep the first one reachable
        { cause: errorByAddress.values().next().value }
      )
      error.code = 'NO_NBD_AVAILABLE'
      error.attempts = attempts
      throw error
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
    const clientId = this.#nextClient++ % this.#clients.length
    const client = this.#clients[clientId]
    try {
      return await client.readBlock(index, size)
    } catch (err) {
      // client.readBlock() already exhausted its own retries/reconnects: this connection is dead.
      // Evict it so future reads stop being routed to it, and retry this read on a surviving
      // client, since the data is usually still reachable through the others.
      this.#evict(client)
      if (this.#clients.length === 0) {
        throw err
      }
      warn(`evicted a dead nbd client, retrying block ${index} on a remaining client`, { err })
      return this.readBlock(index, size)
    }
  }

  // no-op if `client` was already evicted by a concurrent failed read on the same client
  #evict(client) {
    const i = this.#clients.indexOf(client)
    if (i === -1) {
      return
    }
    this.#clients.splice(i, 1)
    client.disconnect().catch(() => {})
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
  /**
   *  returns the map of the file with holes, zeros and data, useful to handle efficiently sparse source   *
   *
   * @returns {Promise<{ offset: number, length: number, type: number }[]>}
   * A promise that resolves to an array where each object represents a segment:
   * - `offset` — The byte offset from the start.
   * - `length` — The size of the segment in bytes.
   * - `type` — A numeric code indicating the segment type (0 means no data).
   */
  async getMap(signal) {
    // ask the map from one of the connected client
    return this.#clients[Math.floor(this.#clients.length * Math.random())].getMap(signal)
  }
}
