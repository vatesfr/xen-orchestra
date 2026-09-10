import assert from 'node:assert'
import { pRetry, pDelay, pTimeout, pFromCallback } from 'promise-toolbox'
import { readChunkStrict } from '@vates/read-chunk'
import { createLogger } from '@xen-orchestra/log'
import {
  INIT_PASSWD,
  NBD_CMD_DISC,
  NBD_CMD_READ,
  NBD_DEFAULT_BLOCK_SIZE,
  NBD_FLAG_FIXED_NEWSTYLE,
  NBD_FLAG_HAS_FLAGS,
  NBD_OPT_EXPORT_NAME,
  NBD_OPT_REPLY_MAGIC,
  NBD_REPLY_ACK,
  NBD_REPLY_MAGIC,
  NBD_REQUEST_MAGIC,
  OPTS_MAGIC,
} from './constants.mjs'

const { debug, warn } = createLogger('vates:nbd-client')

// documentation is here : https://github.com/NetworkBlockDevice/nbd/blob/master/doc/proto.md

/**
 * A pair of streams carrying the NBD protocol.
 *
 * For a TCP client both are the same socket, for a client talking to a server
 * through its standard streams they are the two ends of two different pipes.
 *
 * @typedef {object} NbdTransport
 * @property {import('node:stream').Readable} readable - where the server answers are read from
 * @property {import('node:stream').Writable} writable - where the client queries are written to
 */

/**
 * Transport agnostic NBD client: it implements the handshake and the
 * transmission phases, and delegates the opening/closing of the underlying
 * streams to its subclasses.
 *
 * Subclasses MUST implement `_openTransport()` and MAY override
 * `_secureTransport()`, `_closeTransport()`, `_destroyTransport()` and `getMap()`.
 *
 * @abstract
 */
export default class AbstractNbdClient {
  #exportName
  #exportSize

  /** @type {NbdTransport|undefined} */
  #transport

  #waitBeforeReconnect
  #readBlockRetries
  #reconnectRetry
  #connectTimeout
  #messageTimeout

  // AFAIK, there is no guaranty the server answers in the same order as the queries
  // so we handle a backlog of command waiting for response and handle concurrency manually

  #waitingForResponse // there is already a listener waiting for a response
  #nextCommandQueryId = BigInt(0)
  // map of command waiting for a response queryId => { size/*in byte*/, resolve, reject}
  #commandQueryBacklog = new Map()
  #connected = false

  #reconnectingPromise

  /**
   * @param {object} settings
   * @param {string} [settings.exportname] - the NBD export to open, empty for the default one
   * @param {object} [options]
   * @param {number} [options.connectTimeout]
   * @param {number} [options.messageTimeout]
   * @param {number} [options.waitBeforeReconnect]
   * @param {number} [options.readBlockRetries]
   * @param {number} [options.reconnectRetry]
   */
  constructor(
    { exportname = '' },
    {
      connectTimeout = 6e4,
      messageTimeout = 6e4,
      waitBeforeReconnect = 1e3,
      readBlockRetries = 5,
      reconnectRetry = 5,
    } = {}
  ) {
    this.#exportName = exportname
    this.#waitBeforeReconnect = waitBeforeReconnect
    this.#readBlockRetries = readBlockRetries
    this.#reconnectRetry = reconnectRetry
    this.#connectTimeout = connectTimeout
    this.#messageTimeout = messageTimeout
  }

  get exportSize() {
    return this.#exportSize
  }

  get exportName() {
    return this.#exportName
  }

  get connected() {
    return this.#connected
  }

  /* ---------------------------------------------------------------------------
   * transport, to be implemented by the subclasses
   * ------------------------------------------------------------------------- */

  /**
   * Open the streams used to talk to the NBD server.
   *
   * Called on every (re)connection: it must be able to open a brand new
   * transport each time it is called.
   *
   * @abstract
   * @returns {Promise<NbdTransport>}
   */
  async _openTransport() {
    throw new Error(`${this.constructor.name} must implement _openTransport()`)
  }

  /**
   * Hook called during the handshake, after the client flags have been sent and
   * before the export is selected: this is the only moment where the transport
   * can be upgraded (NBD_OPT_STARTTLS).
   *
   * Returning another transport than the one received replaces it, returning
   * the same one is a no-op.
   *
   * @param {NbdTransport} transport
   * @returns {Promise<NbdTransport>}
   */
  async _secureTransport(transport) {
    return transport
  }

  /**
   * Gracefully close the transport.
   *
   * `lastMessage` is a ready to send NBD_CMD_DISC: implementations must hand it
   * over to the server (it is the only clean way to tell it we're done) before
   * closing their side.
   *
   * Failing or timing out here is not fatal: `_destroyTransport()` will be
   * called as a fallback.
   *
   * @param {NbdTransport} transport
   * @param {Buffer} lastMessage
   * @returns {Promise<void>}
   */
  async _closeTransport(transport, lastMessage) {
    await pFromCallback(cb => transport.writable.end(lastMessage, cb))
  }

  /**
   * Forcefully release the transport and everything backing it.
   *
   * Must be idempotent, and must not throw.
   *
   * @param {NbdTransport} transport
   * @returns {void}
   */
  _destroyTransport(transport) {
    transport.readable.destroy()
    if (transport.writable !== transport.readable) {
      transport.writable.destroy()
    }
  }

  /**
   * Returns the map of the file with holes, zeros and data, useful to handle
   * efficiently sparse sources.
   *
   * The base implementation is unable to compute it: subclasses able to do so
   * must override this method.
   *
   * To implement this here: use structured replies if the server supports them,
   * and then ask for BLOCK_STATUS.
   *
   * @returns {Promise<{ offset: number, length: number, type: number }[]>}
   * A promise that resolves to an array where each object represents a segment:
   * - `offset` — The byte offset from the start.
   * - `length` — The size of the segment in bytes.
   * - `type` — A numeric code indicating the segment type ( 0 means data).
   */
  async getMap() {
    const error = new Error(`${this.constructor.name} does not support getMap()`)
    error.code = 'NBD_MAP_UNSUPPORTED'
    throw error
  }

  /* ---------------------------------------------------------------------------
   * connection
   * ------------------------------------------------------------------------- */

  #onTransportError = error => {
    // without this listener an error on the transport would be thrown as an
    // uncaught exception, and pending reads would only fail on message timeout
    //
    // an error outside of the connected window is expected (the other end can
    // be gone already while we're closing), and always reported to the caller
    // through the connect()/readBlock() rejection
    const log = this.#connected ? warn : debug
    log('error on the nbd transport', { error })
    this.#rejectAll(error)
  }

  #watchTransport(transport) {
    transport.readable.on('error', this.#onTransportError)
    if (transport.writable !== transport.readable) {
      transport.writable.on('error', this.#onTransportError)
    }
  }

  async #connect() {
    const transport = await this._openTransport()
    this.#watchTransport(transport)
    this.#transport = transport
    try {
      // the transport can be replaced during the handshake (TLS upgrade)
      await this.#handshake()
    } catch (error) {
      // don't leak the transport (a socket, a child process, ...): disconnect()
      // is a no-op as long as we're not connected, so nobody else will close it
      this.#destroyCurrentTransport()
      throw error
    }
    this.#connected = true
    // reset internal state if we reconnected a nbd client
    this.#commandQueryBacklog = new Map()
    this.#waitingForResponse = false
  }

  async connect() {
    const promise = this.#connect()
    try {
      return await pTimeout.call(promise, this.#connectTimeout)
    } catch (error) {
      // pTimeout does not cancel: #connect() may still be running and end up
      // with an opened transport nobody owns anymore
      promise.then(
        () =>
          this.disconnect().catch(cleanupError => warn('error while cleaning up a late connection', { cleanupError })),
        () => {} // the failure is already reported through `error`
      )
      throw error
    }
  }

  async disconnect() {
    if (!this.#connected) {
      return
    }
    this.#connected = false
    const transport = this.#transport
    this.#transport = undefined
    if (transport === undefined) {
      return
    }

    const queryId = this.#nextCommandQueryId
    this.#nextCommandQueryId++

    const buffer = Buffer.alloc(28)
    buffer.writeInt32BE(NBD_REQUEST_MAGIC, 0) // it is a nbd request
    buffer.writeInt16BE(0, 4) // no command flags for a disconnect
    buffer.writeInt16BE(NBD_CMD_DISC, 6) // we want to disconnect from nbd server
    buffer.writeBigUInt64BE(queryId, 8)
    buffer.writeBigUInt64BE(0n, 16)
    buffer.writeInt32BE(0, 24)

    try {
      await pTimeout.call(this._closeTransport(transport, buffer), this.#messageTimeout)
    } catch (error) {
      // expected when the other end is already gone, nothing actionable: the
      // transport is destroyed instead of being closed gracefully
      debug('error while closing the nbd transport, destroying it', { error })
      this.#destroyTransport(transport)
    }
  }

  #destroyCurrentTransport() {
    const transport = this.#transport
    this.#transport = undefined
    if (transport !== undefined) {
      this.#destroyTransport(transport)
    }
  }

  #destroyTransport(transport) {
    try {
      this._destroyTransport(transport)
    } catch (error) {
      warn('error while destroying the nbd transport', { error })
    }
  }

  #clearReconnectPromise = () => {
    this.#reconnectingPromise = undefined
  }

  async #reconnect() {
    await this.disconnect().catch(() => {})
    await pDelay(this.#waitBeforeReconnect) // need to let the xapi clean things on its side
    await this.connect()
  }

  async reconnect() {
    // we need to ensure reconnections do not occur in parallel
    if (this.#reconnectingPromise === undefined) {
      this.#reconnectingPromise = pRetry(() => this.#reconnect(), {
        tries: this.#reconnectRetry,
      })
      this.#reconnectingPromise.then(this.#clearReconnectPromise, this.#clearReconnectPromise)
    }

    return this.#reconnectingPromise
  }

  /* ---------------------------------------------------------------------------
   * handshake
   * ------------------------------------------------------------------------- */

  // we can use individual read/write from the transport here since there is no concurrency
  //
  // protected: subclasses need it to negotiate their own options (NBD_OPT_STARTTLS)
  async _sendOption(option, buffer = Buffer.alloc(0)) {
    await this.#write(OPTS_MAGIC)
    await this.#writeInt32(option)
    await this.#writeInt32(buffer.length)
    await this.#write(buffer)
    assert.strictEqual(await this.#readInt64(), NBD_OPT_REPLY_MAGIC) // magic number everywhere
    assert.strictEqual(await this.#readInt32(), option) // the option passed
    assert.strictEqual(await this.#readInt32(), NBD_REPLY_ACK) // ACK
    const length = await this.#readInt32()
    assert.strictEqual(length, 0) // length
  }

  // we can use individual read/write from the transport here since there is only one handshake at once, no concurrency
  async #handshake() {
    assert((await this.#read(8)).equals(INIT_PASSWD))
    assert((await this.#read(8)).equals(OPTS_MAGIC))
    const flagsBuffer = await this.#read(2)
    const flags = flagsBuffer.readInt16BE(0)
    assert.strictEqual(flags & NBD_FLAG_FIXED_NEWSTYLE, NBD_FLAG_FIXED_NEWSTYLE) // only FIXED_NEWSTYLE one is supported from the server options
    await this.#writeInt32(NBD_FLAG_FIXED_NEWSTYLE) // client also support  NBD_FLAG_C_FIXED_NEWSTYLE

    // let the subclass upgrade the transport if it needs to (TLS)
    const secured = await this._secureTransport(this.#transport)
    if (secured !== this.#transport) {
      this.#watchTransport(secured)
      this.#transport = secured
    }

    // send export name we want to access.
    // it's implicitly closing the negotiation phase.
    await this.#write(OPTS_MAGIC)
    await this.#writeInt32(NBD_OPT_EXPORT_NAME)
    const exportNameBuffer = Buffer.from(this.#exportName)
    await this.#writeInt32(exportNameBuffer.length)
    await this.#write(exportNameBuffer)

    // 8 (export size ) + 2 (flags) + 124 zero = 134
    // must read all to ensure nothing stays in the  buffer
    const answer = await this.#read(134)
    this.#exportSize = answer.readBigUInt64BE(0)
    const transmissionFlags = answer.readInt16BE(8)
    assert.strictEqual(transmissionFlags & NBD_FLAG_HAS_FLAGS, NBD_FLAG_HAS_FLAGS, 'NBD_FLAG_HAS_FLAGS') // must always be 1 by the norm

    // note : xapi server always send NBD_FLAG_READ_ONLY (3) as a flag
  }

  /* ---------------------------------------------------------------------------
   * raw read/write
   * ------------------------------------------------------------------------- */

  #getTransport() {
    const transport = this.#transport
    if (transport === undefined) {
      const error = new Error('the nbd client is not connected')
      error.code = 'NBD_NOT_CONNECTED'
      throw error
    }
    return transport
  }

  #read(length) {
    const promise = readChunkStrict(this.#getTransport().readable, length)
    return pTimeout.call(promise, this.#messageTimeout)
  }

  #write(buffer) {
    let timeout
    const messageTimeout = this.#messageTimeout
    const { writable } = this.#getTransport()
    return Promise.race([
      new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('timeout'))
        }, messageTimeout)
      }),
      new Promise(resolve =>
        writable.write(buffer, () => {
          clearTimeout(timeout)
          resolve()
        })
      ),
    ])
  }

  async #readInt32() {
    const buffer = await this.#read(4)
    return buffer.readInt32BE(0)
  }

  async #readInt64() {
    const buffer = await this.#read(8)
    return buffer.readBigUInt64BE(0)
  }

  #writeInt32(int) {
    const buffer = Buffer.alloc(4)
    buffer.writeInt32BE(int)
    return this.#write(buffer)
  }

  /* ---------------------------------------------------------------------------
   * transmission
   * ------------------------------------------------------------------------- */

  // when one read fail ,stop everything
  // (sync: it must be usable from an event handler without leaving a floating promise)
  #rejectAll(error) {
    this.#commandQueryBacklog.forEach(({ reject }) => {
      reject(error)
    })
  }

  async #readBlockResponse() {
    // ensure at most one read occur in parallel
    if (this.#waitingForResponse) {
      return
    }
    try {
      this.#waitingForResponse = true
      const buffer = await this.#read(16)
      const magic = buffer.readInt32BE(0)

      if (magic !== NBD_REPLY_MAGIC) {
        throw new Error(`magic number for block answer is wrong : ${magic} ${NBD_REPLY_MAGIC}`)
      }

      const error = buffer.readInt32BE(4)
      if (error !== 0) {
        // @todo use error code from constants.mjs
        throw new Error(`GOT ERROR CODE  : ${error}`)
      }

      const blockQueryId = buffer.readBigUInt64BE(8)
      const query = this.#commandQueryBacklog.get(blockQueryId)
      if (!query) {
        throw new Error(` no query associated with id ${blockQueryId}`)
      }
      this.#commandQueryBacklog.delete(blockQueryId)
      const data = await this.#read(query.size)
      query.resolve(data)
      this.#waitingForResponse = false
      if (this.#commandQueryBacklog.size > 0) {
        // it doesn't throw directly but will throw all relevant promise on failure
        this.#readBlockResponse()
      }
    } catch (error) {
      // reject all the promises
      // we don't need to call readBlockResponse on failure
      // since we will empty the backlog
      this.#rejectAll(error)
    }
  }

  async #readBlock(index, size) {
    // we don't want to add anything in backlog while reconnecting
    if (this.#reconnectingPromise) {
      await this.#reconnectingPromise
    }

    const queryId = this.#nextCommandQueryId
    this.#nextCommandQueryId++

    // create and send  command at once to ensure there is no concurrency issue
    const buffer = Buffer.alloc(28)
    buffer.writeInt32BE(NBD_REQUEST_MAGIC, 0) // it is a nbd request
    buffer.writeInt16BE(0, 4) // no command flags for a simple block read
    buffer.writeInt16BE(NBD_CMD_READ, 6) // we want to read a data block
    buffer.writeBigUInt64BE(queryId, 8)
    // byte offset in the raw disk
    const offset = BigInt(index) * BigInt(size)
    const remaining = this.#exportSize - offset
    if (remaining < BigInt(size)) {
      size = Number(remaining)
    }

    buffer.writeBigUInt64BE(offset, 16)
    buffer.writeInt32BE(size, 24)

    return new Promise((resolve, reject) => {
      function decoratedReject(error) {
        error.index = index
        error.size = size
        reject(error)
      }

      // this will handle one block response, but it can be another block
      // since server does not guaranty to handle query in order
      this.#commandQueryBacklog.set(queryId, {
        size,
        resolve,
        reject: decoratedReject,
      })
      // really send the command to the server
      this.#write(buffer).catch(decoratedReject)

      // #readBlockResponse never throws directly
      // but if it fails it will reject all the promises in the backlog
      this.#readBlockResponse()
    })
  }

  async readBlock(index, size = NBD_DEFAULT_BLOCK_SIZE) {
    return pRetry(() => this.#readBlock(index, size), {
      tries: this.#readBlockRetries,
      when: error => error.code !== 'ERR_ABORTED',
      onRetry: async err => {
        warn('will retry reading block ', index, err)
        await this.reconnect()
      },
    })
  }
}
